"use client";
import { useEffect, useRef, useState } from "react";
import { SeverityBullet } from "@/components/ui/Bullet";
import { Close, Search } from "@/components/ui/Icons";
import type { Severity } from "@/lib/data/types";
import { HAZARD_LABEL } from "@/lib/tokens";

type Place = { label: string; lat: number; lng: number };
type RouteHazard = { id: string; kind: string; street: string; lane: string; severity: number; alongM: number };
type Result = { hazards: RouteHazard[]; distanceM: number; routed: boolean };

const miles = (m: number) => (m / 1609.344 < 0.1 ? `${Math.round(m * 3.28084 / 10) * 10} ft` : `${(m / 1609.344).toFixed(1)} mi`);
const label = (k: string) => HAZARD_LABEL[k as keyof typeof HAZARD_LABEL] ?? "pothole";
const here = () => new Promise<GeolocationPosition>((res, rej) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 }) : rej(new Error("no gps")));

// Optional: say where you're heading and get the known hazards on the way before you set off.
export default function Destination({ onRoute, compact = false }: { onRoute: (count: number | null, label: string | null) => void; compact?: boolean }) {
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
      <label htmlFor="dest" className={compact ? "sr-only" : "text-sm text-muted"}>where are you heading? (optional)</label>
      <div className={compact ? "relative" : "relative mt-3"}>
        <div className="flex h-12 items-center gap-3 rounded-full border border-line bg-card px-4">
          <Search />
          <input id="dest" value={q} onChange={(e) => { setQ(e.target.value); if (picked) { setPicked(null); setResult(null); onRoute(null, null); } }} placeholder={compact ? "where are you heading? (optional)" : "an address or place in nyc"} autoComplete="off" className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={clear} aria-label="clear destination" className="grid h-8 w-8 place-items-center rounded-full text-muted"><Close /></button>}
        </div>
        {options.length > 0 && (
          <ul className="card absolute inset-x-0 top-14 z-10 overflow-hidden py-1 shadow-[0_12px_32px_rgb(32_33_30/0.10)]">
            {options.map((o) => (
              <li key={`${o.label}-${o.lat}`}><button type="button" onClick={() => void choose(o)} className="block w-full px-4 py-2.5 text-left text-[15px] hover:bg-paper">{o.label}</button></li>
            ))}
          </ul>
        )}
      </div>

      <div aria-live="polite">
        {state === "loading" && <p className="mt-3 text-sm text-muted">checking what&apos;s on the way…</p>}
        {state === "nogps" && <p className="mt-3 text-sm text-muted">turn on location to see what&apos;s on your way.</p>}
        {state === "error" && <p className="mt-3 text-sm text-muted">couldn&apos;t check the route right now. you&apos;ll still get warnings as you ride.</p>}
        {result && (
          <div className="card mt-3 p-4">
            <p className="font-medium">{result.hazards.length === 0 ? "nothing reported on the way" : `${result.hazards.length} known ${result.hazards.length === 1 ? "hazard" : "hazards"} on the way`}</p>
            <p className="text-sm text-muted">{miles(result.distanceM)} · {result.routed ? "along a bike route" : "roughly, along a straight line (no route found)"} · only streets riders have covered are known</p>
            {result.hazards.length > 0 && (
              <ul className="mt-3 divide-y divide-line">
                {result.hazards.slice(0, compact ? 3 : 6).map((h) => (
                  <li key={h.id} className="flex items-center gap-3 py-2 text-[15px]">
                    <SeverityBullet value={Math.min(5, Math.max(1, Math.round(h.severity))) as Severity} />
                    <span className="min-w-0 flex-1 truncate">{label(h.kind)} · {h.street}<span className="text-muted"> · {h.lane}</span></span>
                    <span className="text-sm text-muted">{miles(h.alongM)}</span>
                  </li>
                ))}
              </ul>
            )}
            {result.hazards.length > (compact ? 3 : 6) && <p className="mt-2 text-sm text-muted">and {result.hazards.length - (compact ? 3 : 6)} more.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
