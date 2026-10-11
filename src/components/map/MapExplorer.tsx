"use client";
import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Locate, Search } from "@/components/ui/Icons";
import type { CityReport, Mission, Pothole } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";
import { CitySheet, MissionSheet } from "./CityPanels";
import DetailSheet from "./DetailSheet";
import MapClient from "./MapClient";
import type { Me, PinLabels, Selection } from "./MapView";

type StatusFilter = "all" | "open" | "repaired";
const SEV_FILTERS = [{ key: "map.anySeverity", min: 1 }, { key: "map.sev3", min: 3 }, { key: "map.sev4", min: 4 }] as const;
export const MISSION_KEY = "spotholes-mission"; // read by the ride screen, so the route carries over

const stopsOf = (stops: { id: string; lat: number; lng: number; place: string }[]) => stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, place: s.place }));

export default function MapExplorer({ potholes, city }: { potholes: Pothole[]; city: CityReport[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const labels: PinLabels = useMemo(() => ({
    hazard: { pothole: t("hazard.pothole"), bump: t("hazard.bump"), rough: t("hazard.rough") },
    sev: { 1: t("sev.1"), 2: t("sev.2"), 3: t("sev.3"), 4: t("sev.4"), 5: t("sev.5") },
    repaired: t("common.repaired"), city: t("city.eyebrow"), cityPhotos: t("map.photosN"), me: t("map.you"),
  }), [t]);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [minSev, setMinSev] = useState(1);
  const [q, setQ] = useState("");
  const [showRider, setShowRider] = useState(true);
  const [showCityNone, setShowCityNone] = useState(true);
  const [showCityPhoto, setShowCityPhoto] = useState(true);
  const [selected, setSelected] = useState<Selection>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [planning, setPlanning] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [centerOnMe, setCenterOnMe] = useState(0);

  // The visitor's own location. Asked for only when they tap the button (or if the browser already allows it).
  const watch = useCallback(() => {
    if (!navigator.geolocation) { setNote(t("map.noLocationSupport")); return () => {}; }
    const id = navigator.geolocation.watchPosition(
      (p) => { setMe({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, heading: p.coords.heading }); setNote(null); },
      () => setNote(t("map.locationOff")), { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [t]);
  useEffect(() => {
    let stop = () => {};
    let alive = true;
    // the map is for finding potholes near you, so it asks for your location straight away (unless you already said no)
    const begin = () => { if (alive) stop = watch(); };
    if (!navigator.permissions) begin();
    else navigator.permissions.query({ name: "geolocation" as PermissionName }).then((p) => { if (p.state !== "denied") begin(); }).catch(begin);
    return () => { alive = false; stop(); };
  }, [watch]);
  const locate = () => { if (!me) watch(); setCenterOnMe((n) => n + 1); };

  const needle = q.trim().toLowerCase();
  const visibleRider = useMemo(() => !showRider ? [] : potholes.filter((p) =>
    (status === "all" || p.status === status) && (p.status === "repaired" || (p.severity ?? 0) >= minSev) &&
    (!needle || `${p.street} ${p.borough}`.toLowerCase().includes(needle))), [potholes, status, minSev, needle, showRider]);
  const visibleCity = useMemo(() => city.filter((r) =>
    (r.photoCount > 0 ? showCityPhoto : showCityNone) && (!needle || `${r.place} ${r.borough}`.toLowerCase().includes(needle))), [city, showCityNone, showCityPhoto, needle]);

  const riderSel = selected?.type === "rider" ? visibleRider.find((p) => p.id === selected.id) ?? null : null;
  const citySel = selected?.type === "city" ? visibleCity.find((r) => r.id === selected.id) ?? null : null;
  const clearSelection = useCallback(() => setSelected(null), []);
  const pick = useCallback((s: NonNullable<Selection>) => { setMission(null); setSelected(s); }, []);

  const goToSpot = (r: CityReport) => {
    try { sessionStorage.setItem(MISSION_KEY, JSON.stringify(stopsOf([r]))); } catch { /* storage blocked */ }
    router.push("/ride");
  };
  const startMission = () => {
    if (!mission) return;
    try { sessionStorage.setItem(MISSION_KEY, JSON.stringify(stopsOf(mission.stops))); } catch { /* storage blocked */ }
    router.push("/ride");
  };

  // Ask where the visitor is, then fetch a short route past nearby 311 spots, fewest photos first.
  const plan = () => {
    setPlanning(true); setNote(null);
    if (!navigator.geolocation) { setPlanning(false); setNote(t("map.noLocationSupport")); return; }
    navigator.geolocation.getCurrentPosition(async (p) => {
      try {
        const res = await fetch(`/api/mission?lat=${p.coords.latitude}&lng=${p.coords.longitude}`);
        const m = (await res.json()) as Mission;
        if (!res.ok || !m.stops?.length) { setNote(t("map.noneNear")); return; }
        setMission(m); setSelected(null);
      } catch { setNote(t("map.routeFailed")); }
      finally { setPlanning(false); }
    }, () => { setPlanning(false); setNote(t("map.locationOff")); }, { enableHighAccuracy: true, timeout: 12000 });
  };

  const nothing = potholes.length === 0 && city.length === 0;
  return (
    <div className="map-shell relative h-[calc(100dvh-64px)] w-full">
      <MapClient labels={labels} potholes={visibleRider} city={visibleCity} selected={selected} onSelect={pick} mission={mission} me={me} centerOnMe={centerOnMe} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-col gap-3 p-3 sm:p-4 md:max-w-[calc(100%-420px)]">
        <label className="pointer-events-auto flex h-12 max-w-md items-center gap-3 rounded-full border border-line bg-card/95 px-4 shadow-[0_6px_24px_rgb(32_33_30/0.08)] backdrop-blur">
          <Search />
          <span className="sr-only">{t("map.search")}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("map.search")} className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted" />
        </label>
        {/* the layer chips are also the key to the pin shapes */}
        <div className="pointer-events-auto -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&>*]:shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("map.layers")}>
          <button className="chip shadow-sm" aria-pressed={showRider} onClick={() => setShowRider((v) => !v)}><span className="key-glyph key-rider" aria-hidden />{t("map.layerRider", { n: potholes.length })}</button>
          <button className="chip shadow-sm" aria-pressed={showCityNone} onClick={() => setShowCityNone((v) => !v)}><span className="key-glyph key-city" aria-hidden />{t("map.layerCityNone", { n: city.filter((r) => r.photoCount === 0).length })}</button>
          <button className="chip shadow-sm" aria-pressed={showCityPhoto} onClick={() => setShowCityPhoto((v) => !v)}><span className="key-glyph key-city-photo" aria-hidden />{t("map.layerCityPhoto", { n: city.filter((r) => r.photoCount > 0).length })}</button>
        </div>
        {showRider && potholes.length > 0 && (
          <div className="pointer-events-auto -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&>*]:shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("map.filters")}>
            {(["all", "open", "repaired"] as StatusFilter[]).map((s) => (
              <button key={s} className="chip shadow-sm" aria-pressed={status === s} onClick={() => setStatus(s)}>{s === "all" ? t("map.all") : s === "open" ? t("map.fOpen") : t("map.fRepaired")}</button>
            ))}
            {SEV_FILTERS.map((f) => (
              <button key={f.min} className="chip shadow-sm" aria-pressed={minSev === f.min} onClick={() => setMinSev(f.min)}>{t(f.key as Key)}</button>
            ))}
          </div>
        )}
      </div>

      <button onClick={locate} aria-label={t("map.locate")} className="absolute bottom-[132px] end-3 z-[1000] grid h-11 w-11 place-items-center rounded-full border border-line bg-card shadow-sm sm:end-4 md:bottom-[132px]"><Locate /></button>

      <div className="pointer-events-none absolute bottom-3 start-3 z-[1000] flex items-center gap-2 rounded-full border border-line bg-card/95 px-4 py-2 text-sm backdrop-blur sm:bottom-4 sm:start-4">
        <span className="text-muted">{nothing ? t("map.none") : t("map.shown", { n: visibleRider.length + visibleCity.length })}</span>
      </div>

      {!selected && !mission && city.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-[1000] flex flex-col items-center gap-2 px-3 sm:bottom-6">
          {note && <p className="pointer-events-auto max-w-sm rounded-full border border-line bg-card/95 px-4 py-2 text-center text-sm backdrop-blur" role="status">{note}</p>}
          <button onClick={plan} disabled={planning} className="pill pill-ink pointer-events-auto shadow-[0_10px_30px_rgb(32_33_30/0.25)] disabled:opacity-70">{planning ? t("map.finding") : t("map.routeNear")}</button>
        </div>
      )}

      <AnimatePresence>
        {riderSel && <DetailSheet key={`r${riderSel.id}`} pothole={riderSel} onClose={clearSelection} />}
        {citySel && <CitySheet key={`c${citySel.id}`} report={citySel} onClose={clearSelection} onGo={() => goToSpot(citySel)} onPlan={plan} planning={planning} />}
        {mission && <MissionSheet key="mission" mission={mission} onClose={() => setMission(null)} onStart={startMission} />}
      </AnimatePresence>
    </div>
  );
}
