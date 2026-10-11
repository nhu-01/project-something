"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { deviceId } from "@/components/ride/engine";
import { SeverityBullet } from "@/components/ui/Bullet";
import { ArrowUpRight, Camera, Close, Pin, Search } from "@/components/ui/Icons";
import type { Severity } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";

type Place = { label: string; lat: number; lng: number };
type Spot = { lat: number; lng: number; label: string };
type Outcome =
  | { ok: true; event: { kind: string; potholeId: string; hazard: string; street: string; lane: string; severity: number | null }; photoKept: boolean; to311?: { id: string; place: string } }
  | { ok: false; reason: string };

const REASONS = new Set(["no_hazard", "picture", "not_rideable"]);

// Shrinks the photo (and turns HEIC and friends into JPEG) before upload.
async function resize(file: File, size: number): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(size / bmp.width, size / bmp.height, 1);
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("could not read photo"))), "image/jpeg", 0.82));
}

// Three still frames from a video (20%, 50%, 80% in), so a clip can be submitted as one photo.
async function frames(file: File): Promise<File[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true; video.playsInline = true; video.preload = "auto"; video.src = url;
  try {
    await new Promise<void>((res, rej) => { video.onloadedmetadata = () => res(); video.onerror = () => rej(new Error("video")); });
    const out: File[] = [];
    for (const at of [0.2, 0.5, 0.8]) {
      await new Promise<void>((res) => { video.onseeked = () => res(); video.currentTime = Math.max(0, (video.duration || 1) * at); });
      const c = document.createElement("canvas");
      const scale = Math.min(1280 / video.videoWidth, 1280 / video.videoHeight, 1);
      c.width = Math.round(video.videoWidth * scale); c.height = Math.round(video.videoHeight * scale);
      c.getContext("2d")?.drawImage(video, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.85));
      if (blob) out.push(new File([blob], `frame-${at}.jpg`, { type: "image/jpeg" }));
    }
    return out;
  } finally { URL.revokeObjectURL(url); }
}

export default function SubmitForm() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [choices, setChoices] = useState<File[]>([]); // frames of a video to choose from
  const [preview, setPreview] = useState<string | null>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [options, setOptions] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const takeRef = useRef<HTMLInputElement>(null), pickRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the preview URL is created from, and must be revoked with, this file
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // address suggestions as you type (debounced)
  useEffect(() => {
    if (q.trim().length < 3) return;
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}`);
        const list = res.ok ? ((await res.json()) as Place[]) : [];
        if (mine === seq.current) setOptions(list);
      } catch { /* offline: no suggestions */ }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  const useHere = () => {
    setLocating(true); setLocError(null);
    if (!navigator.geolocation) { setLocating(false); setLocError(t("report.noLocationSupport")); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocating(false); setSpot({ lat: p.coords.latitude, lng: p.coords.longitude, label: t("report.currentLocation", { n: Math.max(5, Math.round(p.coords.accuracy)) }) }); setQ(""); setOptions([]); },
      () => { setLocating(false); setLocError(t("report.locationFailed")); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };
  const pick = async (f: FileList | null) => {
    const chosen = f?.[0];
    if (!chosen) return;
    setOutcome(null); setError(null); setChoices([]);
    if (chosen.type.startsWith("video/")) {
      try { const got = await frames(chosen); setChoices(got); setFile(got[1] ?? got[0] ?? null); }
      catch { setError(t("report.failed")); }
      return;
    }
    setFile(chosen);
  };
  const reset = () => { setFile(null); setPreview(null); setChoices([]); setOutcome(null); setError(null); };

  const submit = async () => {
    if (!file || !spot) return;
    setBusy(true); setError(null); setOutcome(null);
    try {
      const photo = await resize(file, 1280);
      const form = new FormData();
      form.append("deviceId", deviceId());
      form.append("lat", String(spot.lat)); form.append("lng", String(spot.lng));
      form.append("photo", photo, "photo.jpg");
      const res = await fetch("/api/report", { method: "POST", body: form });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(t("report.failed"));
      setOutcome(body as Outcome);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("report.failed"));
    } finally { setBusy(false); }
  };

  if (outcome?.ok) {
    const e = outcome.event;
    const sev = e.severity ? (Math.min(5, Math.max(1, Math.round(e.severity))) as Severity) : null;
    return (
      <div className="card p-6" role="status">
        <p className="eyebrow">{outcome.to311 ? t("report.addedExisting") : e.kind === "new" ? t("report.added") : t("report.addedExisting")}</p>
        <h2 className="mt-2 flex items-center gap-3 text-2xl font-medium tracking-tight">{sev && <SeverityBullet value={sev} large />}{t(`hazard.${["pothole", "bump", "rough"].includes(e.hazard) ? e.hazard : "pothole"}` as Key)} · {e.street}</h2>
        <p className="mt-2 text-muted">{outcome.to311 ? t("report.to311", { place: outcome.to311.place }) : e.kind === "new" ? t("report.addedBody") : t("report.existingBody")}{!outcome.photoKept && ` ${t("report.photoNotKept")}`}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={outcome.to311 ? `/spots/${outcome.to311.id}` : `/potholes/${e.potholeId}`} className="pill pill-ink">{t("report.seeIt")} <ArrowUpRight /></Link>
          <button onClick={reset} className="pill pill-line">{t("report.another")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="photo-h">
        <h2 id="photo-h" className="text-sm text-muted">{t("report.step1")}</h2>
        {preview ? (
          <div className="relative mt-3 overflow-hidden rounded-3xl border border-line">
            <img src={preview} alt={t("report.photoAlt")} className="max-h-80 w-full object-cover" />
            <button onClick={reset} aria-label={t("report.remove")} className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-paper/90 backdrop-blur"><Close /></button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            <button onClick={() => takeRef.current?.click()} className="pill pill-ink"><Camera />{t("report.take")}</button>
            <button onClick={() => pickRef.current?.click()} className="pill pill-line">{t("report.choose")}</button>
          </div>
        )}
        <input ref={takeRef} type="file" accept="image/*,video/*" capture="environment" hidden onChange={(e) => { void pick(e.target.files); e.target.value = ""; }} />
        <input ref={pickRef} type="file" accept="image/*,video/*" hidden onChange={(e) => { void pick(e.target.files); e.target.value = ""; }} />
        {choices.length > 1 && (
          <div className="mt-3">
            <p className="text-sm text-muted">{t("report.pickFrame")}</p>
            <ul className="mt-2 flex gap-2">
              {choices.map((c, i) => (
                <li key={c.name}><button type="button" onClick={() => setFile(c)} aria-pressed={file === c} aria-label={t("report.frameN", { n: i + 1 })} className={`overflow-hidden rounded-2xl border-2 ${file === c ? "border-ink" : "border-line"}`}><FramePreview file={c} /></button></li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-3 text-sm text-muted">{t("report.safety")}</p>
      </section>

      <section aria-labelledby="where-h">
        <h2 id="where-h" className="text-sm text-muted">{t("report.step2")}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button onClick={useHere} disabled={locating} className="chip !min-h-11 disabled:opacity-60"><Pin />{locating ? t("report.findingYou") : t("report.useHere")}</button>
        </div>
        <div className="relative mt-3">
          <label className="flex h-12 items-center gap-3 rounded-full border border-line bg-card px-4">
            <Search /><span className="sr-only">{t("report.typeAddress")}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("report.typeAddress")} autoComplete="off" className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted" />
          </label>
          {options.length > 0 && q.trim().length >= 3 && (
            <ul className="card absolute inset-x-0 top-14 z-10 overflow-hidden py-1 shadow-[0_12px_32px_rgb(32_33_30/0.10)]">
              {options.map((o) => (
                <li key={`${o.label}-${o.lat}`}><button type="button" onClick={() => { seq.current++; setSpot({ lat: o.lat, lng: o.lng, label: o.label }); setQ(""); setOptions([]); setLocError(null); }} className="block w-full px-4 py-2.5 text-start text-[15px] hover:bg-paper">{o.label}</button></li>
              ))}
            </ul>
          )}
        </div>
        <div aria-live="polite">
          {spot && <p className="mt-3 flex items-start gap-2 text-[15px]"><span className="mt-1 text-repaired"><Pin /></span><span>{spot.label}</span></p>}
          {locError && <p className="mt-3 text-sm text-muted">{locError}</p>}
        </div>
      </section>

      <div>
        <button onClick={submit} disabled={!file || !spot || busy} className="pill pill-ink w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0">{busy ? t("report.checking") : t("report.submit")}</button>
        <div aria-live="polite">
          {outcome && !outcome.ok && <p className="mt-4 rounded-3xl border border-line bg-card p-4 text-[15px]">{t(`report.reason.${REASONS.has(outcome.reason) ? outcome.reason : "no_hazard"}` as Key)}</p>}
          {error && <p className="mt-4 rounded-3xl border border-line bg-card p-4 text-[15px]">{error}</p>}
        </div>
        <p className="mt-4 text-sm text-muted">{t("report.privacy")}</p>
      </div>
    </div>
  );
}

function FramePreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the object URL belongs to this file and is revoked with it
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url ? <img src={url} alt="" className="h-20 w-16 object-cover" /> : <span className="block h-20 w-16" />;
}
