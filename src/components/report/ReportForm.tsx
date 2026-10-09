"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { deviceId } from "@/components/ride/engine";
import { SeverityBullet } from "@/components/ui/Bullet";
import { ArrowUpRight, Camera, Close, Pin, Search } from "@/components/ui/Icons";
import type { Severity } from "@/lib/data/types";
import { HAZARD_LABEL } from "@/lib/tokens";

type Place = { label: string; lat: number; lng: number };
type Spot = { lat: number; lng: number; label: string };
type Outcome =
  | { ok: true; event: { kind: string; potholeId: string; hazard: string; street: string; lane: string; severity: number | null }; photoKept: boolean }
  | { ok: false; reason: string };

const REASONS: Record<string, string> = {
  no_hazard: "we couldn't see a pothole, bump or rough pavement in that photo. try a closer, clearer shot.",
  picture: "that looks like a picture of a screen or a print, so nothing was logged. please photograph the real spot.",
  not_rideable: "that doesn't look like a street, sidewalk or path, so nothing was logged.",
};

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

export default function ReportForm() {
  const [file, setFile] = useState<File | null>(null);
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
    if (!navigator.geolocation) { setLocating(false); setLocError("this browser can't share location. type the address instead."); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocating(false); setSpot({ lat: p.coords.latitude, lng: p.coords.longitude, label: `your current location (within about ${Math.max(5, Math.round(p.coords.accuracy))} m)` }); setQ(""); setOptions([]); },
      () => { setLocating(false); setLocError("couldn't get your location. allow location access, or type the address instead."); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };
  const pick = (f: FileList | null) => { if (f?.[0]) { setFile(f[0]); setOutcome(null); setError(null); } };
  const reset = () => { setFile(null); setPreview(null); setOutcome(null); setError(null); };

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
      if (!res.ok) throw new Error(body?.error ?? "something went wrong. please try again.");
      setOutcome(body as Outcome);
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong. please try again.");
    } finally { setBusy(false); }
  };

  if (outcome?.ok) {
    const e = outcome.event;
    const sev = e.severity ? (Math.min(5, Math.max(1, Math.round(e.severity))) as Severity) : null;
    return (
      <div className="card p-6" role="status">
        <p className="eyebrow">{e.kind === "new" ? "added to the map" : "added to an existing spot"}</p>
        <h2 className="mt-2 flex items-center gap-3 text-2xl font-medium tracking-tight">{sev && <SeverityBullet value={sev} large />}{HAZARD_LABEL[e.hazard as keyof typeof HAZARD_LABEL] ?? "pothole"} · {e.street}</h2>
        <p className="mt-2 text-muted">{e.kind === "new" ? "riders heading that way will now be warned." : `someone had already reported this one. your photo updated it (${e.kind}).`}{!outcome.photoKept && " the photo wasn't kept because it shows people or a license plate."}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/potholes/${e.potholeId}`} className="pill pill-ink">see it <ArrowUpRight /></Link>
          <button onClick={reset} className="pill pill-line">report another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="photo-h">
        <h2 id="photo-h" className="text-sm text-muted">1. the photo</h2>
        {preview ? (
          <div className="relative mt-3 overflow-hidden rounded-3xl border border-line">
            <img src={preview} alt="the photo you chose" className="max-h-80 w-full object-cover" />
            <button onClick={reset} aria-label="remove photo" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-paper/90 backdrop-blur"><Close /></button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            <button onClick={() => takeRef.current?.click()} className="pill pill-ink"><Camera />take a photo</button>
            <button onClick={() => pickRef.current?.click()} className="pill pill-line">choose from library</button>
          </div>
        )}
        <input ref={takeRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
        <input ref={pickRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
        <p className="mt-3 text-sm text-muted">stand somewhere safe, never in traffic. get the whole spot in frame from a few steps back.</p>
      </section>

      <section aria-labelledby="where-h">
        <h2 id="where-h" className="text-sm text-muted">2. where it is</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button onClick={useHere} disabled={locating} className="chip !min-h-11 disabled:opacity-60"><Pin />{locating ? "finding you…" : "use my current location"}</button>
        </div>
        <div className="relative mt-3">
          <label className="flex h-12 items-center gap-3 rounded-full border border-line bg-card px-4">
            <Search /><span className="sr-only">or type the address</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="or type the address or cross streets" autoComplete="off" className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted" />
          </label>
          {options.length > 0 && q.trim().length >= 3 && (
            <ul className="card absolute inset-x-0 top-14 z-10 overflow-hidden py-1 shadow-[0_12px_32px_rgb(32_33_30/0.10)]">
              {options.map((o) => (
                <li key={`${o.label}-${o.lat}`}><button type="button" onClick={() => { seq.current++; setSpot({ lat: o.lat, lng: o.lng, label: o.label }); setQ(""); setOptions([]); setLocError(null); }} className="block w-full px-4 py-2.5 text-left text-[15px] hover:bg-paper">{o.label}</button></li>
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
        <button onClick={submit} disabled={!file || !spot || busy} className="pill pill-ink w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0">{busy ? "checking the photo…" : "submit"}</button>
        <div aria-live="polite">
          {outcome && !outcome.ok && <p className="mt-4 rounded-3xl border border-line bg-card p-4 text-[15px]">{REASONS[outcome.reason] ?? "nothing was logged."}</p>}
          {error && <p className="mt-4 rounded-3xl border border-line bg-card p-4 text-[15px]">{error}</p>}
        </div>
        <p className="mt-4 text-sm text-muted">ai checks every photo before it goes on the map. photos showing faces or license plates aren&apos;t kept. audio and other files are never collected.</p>
      </div>
    </div>
  );
}
