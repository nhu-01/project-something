"use client";
import { useCallback, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";
import type { PinLabels } from "./MapView";
import { Search } from "@/components/ui/Icons";
import type { CityReport, Mission, Pothole, Track } from "@/lib/data/types";
import { CitySheet, MissionSheet } from "./CityPanels";
import DetailSheet from "./DetailSheet";
import MapClient from "./MapClient";

type StatusFilter = "all" | "open" | "repaired";
const SEV_FILTERS = [{ key: "map.anySeverity", min: 1 }, { key: "map.sev3", min: 3 }, { key: "map.sev4", min: 4 }] as const;

const NO_TRACKS: Track[] = [];
const NO_CITY: CityReport[] = [];
const MISSION_KEY = "spotholes-mission"; // read by the ride screen, so the route carries over

export default function MapExplorer({ potholes, tracks, city }: { potholes: Pothole[]; tracks: Track[]; city: CityReport[] }) {
  const { t } = useI18n();
  const labels: PinLabels = useMemo(() => ({
    hazard: { pothole: t("hazard.pothole"), bump: t("hazard.bump"), rough: t("hazard.rough") },
    sev: { 1: t("sev.1"), 2: t("sev.2"), 3: t("sev.3"), 4: t("sev.4"), 5: t("sev.5") },
    repaired: t("common.repaired"), city: t("city.eyebrow"),
  }), [t]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [minSev, setMinSev] = useState(1);
  const [q, setQ] = useState("");
  const [showTracks, setShowTracks] = useState(true);
  const [showCity, setShowCity] = useState(true);
  const [cityId, setCityId] = useState<string | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planNote, setPlanNote] = useState<string | null>(null);
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
  const cityReport = showCity ? city.find((c) => c.id === cityId) ?? null : null;
  const pickHazard = useCallback((id: string) => { setCityId(null); setSelectedId(id); }, []);
  const pickCity = useCallback((id: string) => { setSelectedId(null); setMission(null); setCityId(id); }, []);

  // Ask where the visitor is, then fetch a short route past nearby reports that have no photo.
  const plan = () => {
    setPlanning(true); setPlanNote(null);
    if (!navigator.geolocation) { setPlanning(false); setPlanNote(t("map.noLocationSupport")); return; }
    navigator.geolocation.getCurrentPosition(async (p) => {
      try {
        const res = await fetch(`/api/mission?lat=${p.coords.latitude}&lng=${p.coords.longitude}`);
        const m = (await res.json()) as Mission;
        if (!res.ok || !m.stops?.length) { setPlanNote(t("map.noneNear")); return; }
        setMission(m); setCityId(null); setSelectedId(null);
        try { sessionStorage.setItem(MISSION_KEY, JSON.stringify(m.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, place: s.place })))); } catch { /* storage blocked */ }
      } catch { setPlanNote(t("map.routeFailed")); }
      finally { setPlanning(false); }
    }, () => { setPlanning(false); setPlanNote(t("map.locationOff")); }, { enableHighAccuracy: true, timeout: 12000 });
  };
  const clearMission = () => { setMission(null); try { sessionStorage.removeItem(MISSION_KEY); } catch { /* storage blocked */ } };

  return (
    <div className="map-shell relative h-[calc(100dvh-64px)] w-full">
      <MapClient labels={labels} potholes={visible} tracks={showTracks ? tracks : NO_TRACKS} selectedId={selected?.id ?? null} onSelect={pickHazard}
        city={showCity ? city : NO_CITY} onSelectCity={pickCity} mission={mission} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-col gap-3 p-3 sm:p-4 md:max-w-[calc(100%-420px)]">
        <label className="pointer-events-auto flex h-12 max-w-md items-center gap-3 rounded-full border border-line bg-card/95 px-4 shadow-[0_6px_24px_rgb(32_33_30/0.08)] backdrop-blur">
          <Search />
          <span className="sr-only">{t("map.search")}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("map.search")} className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted" />
        </label>
        <div className="pointer-events-auto flex flex-wrap gap-2" role="group" aria-label={t("map.filters")}>
          {(["all", "open", "repaired"] as StatusFilter[]).map((s) => (
            <button key={s} className="chip shadow-sm" aria-pressed={status === s} onClick={() => setStatus(s)}>{s === "all" ? t("map.all") : s === "open" ? t("map.fOpen") : t("map.fRepaired")}</button>
          ))}
          <span className="mx-1 hidden w-px bg-line sm:block" aria-hidden />
          {SEV_FILTERS.map((f) => (
            <button key={f.min} className="chip shadow-sm" aria-pressed={minSev === f.min} onClick={() => setMinSev(f.min)}>{t(f.key as Key)}</button>
          ))}
          <span className="mx-1 hidden w-px bg-line sm:block" aria-hidden />
          <button className="chip shadow-sm" aria-pressed={showTracks} onClick={() => setShowTracks((v) => !v)}>
            <span className="h-1 w-4 rounded-full bg-repaired" aria-hidden />{t("map.ridden")}
          </button>
          <button className="chip shadow-sm" aria-pressed={showCity} onClick={() => setShowCity((v) => !v)}>
            <span className="h-3 w-3 rounded-full border-2 border-dashed border-current" aria-hidden />{t("map.city", { n: city.length })}
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-full border border-line bg-card/95 px-4 py-2 text-sm backdrop-blur sm:bottom-4 sm:left-4">
        <span className="text-muted">{potholes.length === 0 ? t("map.none") : t("map.shown", { n: visible.length })}</span>
      </div>

      {!selected && !cityReport && !mission && city.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-[1000] flex flex-col items-center gap-2 px-3 sm:bottom-6">
          {planNote && <p className="pointer-events-auto max-w-sm rounded-full border border-line bg-card/95 px-4 py-2 text-center text-sm backdrop-blur" role="status">{planNote}</p>}
          <button onClick={plan} disabled={planning} className="pill pill-ink pointer-events-auto shadow-[0_10px_30px_rgb(32_33_30/0.25)] disabled:opacity-70">{planning ? t("map.finding") : t("map.routeNear")}</button>
        </div>
      )}

      <DetailSheet pothole={selected} onClose={close} />
      {cityReport && <CitySheet report={cityReport} onClose={() => setCityId(null)} onPlan={plan} planning={planning} />}
      {mission && <MissionSheet mission={mission} onClose={clearMission} />}
    </div>
  );
}
