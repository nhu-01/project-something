"use client";
import { useEffect, useRef, useState } from "react";
import { SeverityBullet } from "@/components/ui/Bullet";
import { Close, Search } from "@/components/ui/Icons";
import type { Severity } from "@/lib/data/types";
import { distance } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { plural, type Key } from "@/lib/i18n";

type Place = { label: string; lat: number; lng: number };
type RouteHazard = { id: string; kind: string; street: string; lane: string; severity: number; alongM: number };
type Result = { hazards: RouteHazard[]; distanceM: number; routed: boolean };

const hazardKey = (k: string) => `hazard.${k === "bump" || k === "rough" ? k : "pothole"}` as Key;
const here = () => new Promise<GeolocationPosition>((res, rej) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 }) : rej(new Error("no gps")));

// Optional: say where you're heading and get the known hazards on the way before you set off.
export default function Destination({ onRoute, compact = false }: { onRoute: (count: number | null, label: string | null) => void; compact?: boolean }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [options, setOptions] = useState<Place[]>([]);
  const [picked, setPicked] = useState<Place | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error" | "nogps">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const seq = useRef(0);

  // suggestions as you type (debounced)
  useEffect(() => {
    if (picked || q.trim().length < 3) return;
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}`);
        const list = res.ok ? ((await res.json()) as Place[]) : [];
        if (mine === seq.current) setOptions(list);
      } catch { /* offline: no suggestions */ }
    }, 280);
    return () => clearTimeout(t);
  }, [q, picked]);

  const choose = async (p: Place) => {
    setPicked(p); setQ(p.label); setOptions([]); setState("loading"); setResult(null);
    try {
      const pos = await here().catch(() => null);
      if (!pos) { setState("nogps"); onRoute(null, null); return; }
      const res = await fetch(`/api/route?from=${pos.coords.latitude},${pos.coords.longitude}&to=${p.lat},${p.lng}`);
      if (!res.ok) throw new Error("route failed");
      const r = (await res.json()) as Result;
      setResult(r); setState("idle"); onRoute(r.hazards.length, p.label);
    } catch { setState("error"); onRoute(null, null); }
  };
  const clear = () => { seq.current++; setPicked(null); setQ(""); setOptions([]); setResult(null); setState("idle"); onRoute(null, null); };

  return (
    <div className={compact ? "text-ink" : "mt-8"}>
      <label htmlFor="dest" className={compact ? "sr-only" : "text-sm text-muted"}>{t("dest.label")}</label>
      <div className={compact ? "relative" : "relative mt-3"}>
        <div className="flex h-12 items-center gap-3 rounded-full border border-line bg-card px-4">
          <Search />
          <input id="dest" value={q} onChange={(e) => { setQ(e.target.value); if (picked) { setPicked(null); setResult(null); onRoute(null, null); } }} placeholder={t("dest.label")} autoComplete="off" className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={clear} aria-label={t("dest.clear")} className="grid h-8 w-8 place-items-center rounded-full text-muted"><Close /></button>}
        </div>
        {options.length > 0 && (
          <ul className="card absolute inset-x-0 top-14 z-10 overflow-hidden py-1 shadow-[0_12px_32px_rgb(32_33_30/0.10)]">
            {options.map((o) => (
              <li key={`${o.label}-${o.lat}`}><button type="button" onClick={() => void choose(o)} className="block w-full px-4 py-2.5 text-start text-[15px] hover:bg-paper">{o.label}</button></li>
            ))}
          </ul>
        )}
      </div>

      <div aria-live="polite">
        {state === "loading" && <p className="mt-3 text-sm text-muted">{t("dest.checking")}</p>}
        {state === "nogps" && <p className="mt-3 text-sm text-muted">{t("dest.noGps")}</p>}
        {state === "error" && <p className="mt-3 text-sm text-muted">{t("dest.error")}</p>}
        {result && (
          <div className="card mt-3 p-4">
            <p className="font-medium">{result.hazards.length === 0 ? t("dest.none") : plural(t, "dest.count", result.hazards.length)}</p>
            <p className="text-sm text-muted">{distance(result.distanceM)} · {result.routed ? t("dest.routed") : t("dest.straight")} · {t("dest.onlyKnown")}</p>
            {result.hazards.length > 0 && (
              <ul className="mt-3 divide-y divide-line">
                {result.hazards.slice(0, compact ? 3 : 6).map((h) => (
                  <li key={h.id} className="flex items-center gap-3 py-2 text-[15px]">
                    <SeverityBullet value={Math.min(5, Math.max(1, Math.round(h.severity))) as Severity} />
                    <span className="min-w-0 flex-1 truncate">{t(hazardKey(h.kind))} · {h.street}<span className="text-muted"> · {h.lane}</span></span>
                    <span className="text-sm text-muted">{distance(h.alongM)}</span>
                  </li>
                ))}
              </ul>
            )}
            {result.hazards.length > (compact ? 3 : 6) && <p className="mt-2 text-sm text-muted">{t("dest.more", { n: result.hazards.length - (compact ? 3 : 6) })}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
