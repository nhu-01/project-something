"use client";
import { useCallback, useMemo, useState } from "react";
import { Search } from "@/components/ui/Icons";
import type { Pothole } from "@/lib/data/types";
import DetailSheet from "./DetailSheet";
import MapClient from "./MapClient";

type StatusFilter = "all" | "open" | "repaired";
const SEV_FILTERS = [{ label: "any severity", min: 1 }, { label: "3+ moderate", min: 3 }, { label: "4+ serious", min: 4 }];

export default function MapExplorer({ potholes, sample }: { potholes: Pothole[]; sample: boolean }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [minSev, setMinSev] = useState(1);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return potholes.filter((p) =>
      (status === "all" || p.status === status) &&
      (p.status === "repaired" || (p.severity ?? 0) >= minSev) &&
      (!needle || `${p.street} ${p.borough}`.toLowerCase().includes(needle)));
  }, [potholes, status, minSev, q]);

  const selected = visible.find((p) => p.id === selectedId) ?? null;
  const close = useCallback(() => setSelectedId(null), []);

  return (
    <div className="map-shell relative h-[calc(100dvh-64px)] w-full">
      <MapClient potholes={visible} selectedId={selected?.id ?? null} onSelect={setSelectedId} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-col gap-3 p-3 sm:p-4 md:max-w-[calc(100%-420px)]">
        <label className="pointer-events-auto flex h-12 max-w-md items-center gap-3 rounded-full border border-line bg-card/95 px-4 shadow-[0_6px_24px_rgb(32_33_30/0.08)] backdrop-blur">
          <Search />
          <span className="sr-only">search by street or borough</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search a street or borough" className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted" />
        </label>
        <div className="pointer-events-auto flex flex-wrap gap-2" role="group" aria-label="filters">
          {(["all", "open", "repaired"] as StatusFilter[]).map((s) => (
            <button key={s} className="chip shadow-sm" aria-pressed={status === s} onClick={() => setStatus(s)}>{s === "all" ? "all" : s === "open" ? "open" : "repaired"}</button>
          ))}
          <span className="mx-1 hidden w-px bg-line sm:block" aria-hidden />
          {SEV_FILTERS.map((f) => (
            <button key={f.min} className="chip shadow-sm" aria-pressed={minSev === f.min} onClick={() => setMinSev(f.min)}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-full border border-line bg-card/95 px-4 py-2 text-sm backdrop-blur sm:bottom-4 sm:left-4">
        <span className="font-medium">{visible.length}</span><span className="text-muted">potholes shown{sample ? " · sample data" : ""}</span>
      </div>

      <DetailSheet pothole={selected} onClose={close} />
    </div>
  );
}
