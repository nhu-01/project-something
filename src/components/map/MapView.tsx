"use client";
import L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef } from "react";
import { escapeHtml } from "@/lib/escape";
import type { CityReport, Mission, Pothole, Track } from "@/lib/data/types";

// Text for the pins' screen-reader labels, supplied by the page in the visitor's language.
export type PinLabels = { hazard: Record<string, string>; sev: Record<number, string>; repaired: string; city: string };

type Props = {
  labels: PinLabels;
  potholes: Pothole[]; tracks: Track[]; selectedId: string | null; onSelect: (id: string) => void;
  city: CityReport[]; onSelectCity: (id: string) => void; mission: Mission | null;
};

// A 311 report nobody has photographed yet: a hollow, dashed pin, so it never reads as a confirmed hazard.
function cityIcon(r: CityReport, labels: PinLabels) {
  return L.divIcon({
    className: "pin-wrap",
    html: `<button type="button" class="pin pin--city" aria-label="${escapeHtml(`${labels.city}: ${r.place}`)}"><span class="pin-dot" aria-hidden="true">311</span></button>`,
    iconSize: [44, 44], iconAnchor: [22, 22],
  });
}

function pinIcon(p: Pothole, selected: boolean, labels: PinLabels) {
  const sev = p.severity ?? 1;
  const label = escapeHtml(`${labels.hazard[p.kind] ?? p.kind} · ${p.street} · ${p.status === "repaired" ? labels.repaired : `${sev} · ${labels.sev[sev]}`}`);
  return L.divIcon({
    className: "pin-wrap",
    html: `<button type="button" class="pin${selected ? " pin--selected" : ""}${p.status === "repaired" ? " pin--repaired" : ""}" style="--pin-color:var(--sev-${sev});--pin-text:${sev <= 2 ? "var(--ink)" : "#fff"}" aria-label="${label}"><span class="pin-dot" aria-hidden="true">${p.status === "repaired" ? "✓" : sev}</span></button>`,
    iconSize: [44, 44], iconAnchor: [22, 22],
  });
}

export default function MapView({ labels, potholes, tracks, selectedId, onSelect, city, onSelectCity, mission }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const cluster = useRef<L.MarkerClusterGroup | null>(null);
  const trackLayer = useRef<L.LayerGroup | null>(null);
  const cityCluster = useRef<L.MarkerClusterGroup | null>(null);
  const missionLayer = useRef<L.LayerGroup | null>(null);
  const onCityRef = useRef(onSelectCity);
  useEffect(() => { onCityRef.current = onSelectCity; }, [onSelectCity]);
  const markers = useRef(new Map<string, { marker: L.Marker; data: Pothole }>());
  const onSelectRef = useRef(onSelect);
  const fitted = useRef(false);
  const prevSelected = useRef<string | null>(null);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const m = L.map(el, { center: [40.7306, -73.9352], zoom: 11, zoomControl: false, scrollWheelZoom: false });
    L.control.zoom({ position: "bottomright" }).addTo(m);
    // CyclOSM: a free, bike-focused map style (bike lanes and paths stand out). No API key needed.
    L.tileLayer("https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", {
      maxZoom: 20, subdomains: "abc",
      attribution: '<a href="https://www.cyclosm.org">CyclOSM</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    const group = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 46,
      iconCreateFunction: (c) => {
        const n = c.getChildCount();
        return L.divIcon({ className: "cluster-wrap", html: `<div class="cluster" role="img" aria-label="${n}">${n}</div>`, iconSize: [42, 42] });
      },
    });
    m.addLayer(group);
    // ridden streets sit under the pins; overlapping rides darken, like a heatmap
    m.createPane("tracks").style.zIndex = "350";
    trackLayer.current = L.layerGroup().addTo(m);
    const cityGroup = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 60,
      iconCreateFunction: (c) => L.divIcon({ className: "cluster-wrap", html: `<div class="cluster cluster--city" role="img" aria-label="311: ${c.getChildCount()}">${c.getChildCount()}</div>`, iconSize: [42, 42] }),
    });
    m.addLayer(cityGroup);
    cityCluster.current = cityGroup;
    missionLayer.current = L.layerGroup().addTo(m);
    // wheel zoom only after the map is clicked or focused, so the page never gets trapped
    m.on("click focus", () => m.scrollWheelZoom.enable());
    el.addEventListener("mouseleave", () => m.scrollWheelZoom.disable());
    map.current = m; cluster.current = group;
    const stash = markers.current;
    return () => { m.remove(); map.current = null; stash.clear(); };
  }, []);

  useEffect(() => {
    const group = cluster.current, m = map.current;
    if (!group || !m) return;
    group.clearLayers(); markers.current.clear();
    const list = potholes.map((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: pinIcon(p, false, labels), keyboard: false, alt: "" });
      marker.on("click", () => onSelectRef.current(p.id));
      markers.current.set(p.id, { marker, data: p });
      return marker;
    });
    group.addLayers(list);
    if (!fitted.current && potholes.length) {
      m.fitBounds(L.latLngBounds(potholes.map((p) => [p.lat, p.lng] as L.LatLngTuple)), { padding: [60, 60], maxZoom: 13 });
      fitted.current = true;
    }
  }, [potholes, labels]);

  useEffect(() => {
    const group = cityCluster.current;
    if (!group) return;
    group.clearLayers();
    group.addLayers(city.map((r) => L.marker([r.lat, r.lng], { icon: cityIcon(r, labels), keyboard: false, alt: "" }).on("click", () => onCityRef.current(r.id))));
  }, [city, labels]);

  // the suggested photo route: a dashed line through numbered stops
  useEffect(() => {
    const layer = missionLayer.current, m = map.current;
    if (!layer || !m) return;
    layer.clearLayers();
    if (!mission || !mission.stops.length) return;
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#20211e";
    L.polyline(mission.line, { color: ink, weight: 4, opacity: 0.85, dashArray: "2 9", lineCap: "round", interactive: false }).addTo(layer);
    mission.stops.forEach((s, i) => L.marker([s.lat, s.lng], { interactive: false, keyboard: false, zIndexOffset: 1000, icon: L.divIcon({ className: "pin-wrap", html: `<span class="stop" aria-hidden="true">${i + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }) }).addTo(layer));
    m.fitBounds(L.latLngBounds(mission.line as L.LatLngTuple[]), { padding: [70, 70], maxZoom: 16 });
  }, [mission]);

  useEffect(() => {
    const layer = trackLayer.current, m = map.current;
    if (!layer || !m) return;
    layer.clearLayers();
    const color = getComputedStyle(document.documentElement).getPropertyValue("--line-blue").trim() || "#0039a6";
    for (const t of tracks) L.polyline(t, { pane: "tracks", color, weight: 5, opacity: 0.32, lineCap: "round", lineJoin: "round", interactive: false }).addTo(layer);
    if (!fitted.current && !potholes.length && tracks.length) {
      m.fitBounds(L.latLngBounds(tracks.flat() as L.LatLngTuple[]), { padding: [60, 60], maxZoom: 14 });
      fitted.current = true;
    }
  }, [tracks, potholes.length]);

  useEffect(() => {
    const prev = prevSelected.current ? markers.current.get(prevSelected.current) : null;
    if (prev) prev.marker.setIcon(pinIcon(prev.data, false, labels));
    const cur = selectedId ? markers.current.get(selectedId) : null;
    if (cur && cluster.current) {
      cluster.current.zoomToShowLayer(cur.marker, () => {
        cur.marker.setIcon(pinIcon(cur.data, true, labels));
        map.current?.panTo(cur.marker.getLatLng(), { animate: true });
      });
    }
    prevSelected.current = selectedId;
  }, [selectedId, potholes, labels]);

  return <div ref={box} className="h-full w-full" />;
}
