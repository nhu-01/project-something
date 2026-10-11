"use client";
import L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef } from "react";
import { escapeHtml } from "@/lib/escape";
import { gradeOf } from "@/lib/tokens";
import type { CityReport, Pothole } from "@/lib/data/types";

// Text for the pins' screen-reader labels, supplied by the page in the visitor's language.
export type PinLabels = { hazard: Record<string, string>; sev: Record<number, string>; repaired: string; city: string; cityPhotos: string; me: string };
export type Me = { lat: number; lng: number; accuracy: number | null; heading: number | null };
export type Selection = { type: "rider" | "city"; id: string } | null;

type Props = {
  labels: PinLabels;
  potholes: Pothole[];
  city: CityReport[];
  selected: Selection;
  onSelect: (s: NonNullable<Selection>) => void;
  me: Me | null;
  centerOnMe: number; // bump to fly the map to the visitor
};

// Rider-reported hazard: a circle holding the road-hazard sign, with its letter grade (A mildest to E worst) on a badge.
function riderIcon(p: Pothole, selected: boolean, labels: PinLabels) {
  const sev = p.severity ?? 1;
  const label = escapeHtml(`${labels.hazard[p.kind] ?? p.kind} · ${p.street} · ${p.status === "repaired" ? labels.repaired : `${gradeOf(sev)} · ${labels.sev[sev]}`}`);
  return L.divIcon({
    className: "pin-wrap",
    html: `<button type="button" class="pin${selected ? " pin--selected" : ""}${p.status === "repaired" ? " pin--repaired" : ""}" style="--pin-color:var(--sev-${sev});--pin-text:${sev <= 2 ? "var(--ink)" : "#fff"}" aria-label="${label}"><span class="pin-dot" aria-hidden="true"><img src="/pothole-sign.png" alt="" width="26" height="26" /></span><span class="pin-grade" aria-hidden="true">${p.status === "repaired" ? "✓" : gradeOf(sev)}</span></button>`,
    iconSize: [44, 44], iconAnchor: [22, 22],
  });
}

// 311 report: a rounded square, so it never looks like a rider's circle. Hollow and dashed until it has a photo; once
// riders have added photos it is solid and carries a camera count.
function cityIcon(r: CityReport, selected: boolean, labels: PinLabels) {
  const photographed = r.photoCount > 0;
  const label = escapeHtml(`${labels.city}: ${r.place}${photographed ? ` · ${labels.cityPhotos.replace("{n}", String(r.photoCount))}` : ""}`);
  const badge = photographed ? `<span class="pin-count" aria-hidden="true">${r.photoCount}</span>` : "";
  return L.divIcon({
    className: "pin-wrap",
    html: `<button type="button" class="pin pin--city${photographed ? " pin--city-photo" : ""}${selected ? " pin--selected" : ""}" aria-label="${label}"><span class="pin-dot" aria-hidden="true"><img src="/pothole-sign.png" alt="" width="24" height="24" /></span>${badge}</button>`,
    iconSize: [44, 44], iconAnchor: [22, 22],
  });
}

const meIcon = () => L.divIcon({ className: "pin-wrap", html: '<span class="me-dot" aria-hidden="true"><span class="me-pulse"></span><span class="me-core"></span></span>', iconSize: [28, 28], iconAnchor: [14, 14] });

export default function MapView({ labels, potholes, city, selected, onSelect, me, centerOnMe }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const riderGroup = useRef<L.MarkerClusterGroup | null>(null);
  const cityGroup = useRef<L.MarkerClusterGroup | null>(null);
  const meLayer = useRef<{ dot: L.Marker; ring: L.Circle } | null>(null);
  const riderMarkers = useRef(new Map<string, { marker: L.Marker; data: Pothole }>());
  const cityMarkers = useRef(new Map<string, { marker: L.Marker; data: CityReport }>());
  const onSelectRef = useRef(onSelect);
  const fitted = useRef(false);
  const prevSel = useRef<Selection>(null);
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

    riderGroup.current = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 46,
      iconCreateFunction: (c) => L.divIcon({ className: "cluster-wrap", html: `<div class="cluster" role="img" aria-label="${c.getChildCount()}">${c.getChildCount()}</div>`, iconSize: [42, 42] }),
    });
    cityGroup.current = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 56,
      iconCreateFunction: (c) => L.divIcon({ className: "cluster-wrap", html: `<div class="cluster cluster--city" role="img" aria-label="311: ${c.getChildCount()}">${c.getChildCount()}</div>`, iconSize: [42, 42] }),
    });
    m.addLayer(cityGroup.current);
    m.addLayer(riderGroup.current);
    // wheel zoom only after the map is clicked or focused, so the page never gets trapped
    m.on("click focus", () => m.scrollWheelZoom.enable());
    el.addEventListener("mouseleave", () => m.scrollWheelZoom.disable());
    map.current = m;
    const rm = riderMarkers.current, cm = cityMarkers.current;
    return () => { m.remove(); map.current = null; rm.clear(); cm.clear(); meLayer.current = null; };
  }, []);

  // rider-reported hazards
  useEffect(() => {
    const g = riderGroup.current;
    if (!g) return;
    g.clearLayers(); riderMarkers.current.clear();
    g.addLayers(potholes.map((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: riderIcon(p, false, labels), keyboard: false, alt: "" });
      marker.on("click", () => onSelectRef.current({ type: "rider", id: p.id }));
      riderMarkers.current.set(p.id, { marker, data: p });
      return marker;
    }));
  }, [potholes, labels]);

  // 311 reports
  useEffect(() => {
    const g = cityGroup.current, m = map.current;
    if (!g || !m) return;
    g.clearLayers(); cityMarkers.current.clear();
    g.addLayers(city.map((r) => {
      const marker = L.marker([r.lat, r.lng], { icon: cityIcon(r, false, labels), keyboard: false, alt: "" });
      marker.on("click", () => onSelectRef.current({ type: "city", id: r.id }));
      cityMarkers.current.set(r.id, { marker, data: r });
      return marker;
    }));
    const all = [...city.map((r) => [r.lat, r.lng] as L.LatLngTuple), ...potholes.map((p) => [p.lat, p.lng] as L.LatLngTuple)];
    if (!fitted.current && all.length) {
      // frame the photographed spots and rider hazards if there are any; otherwise the whole city
      const focus = [...city.filter((r) => r.photoCount > 0).map((r) => [r.lat, r.lng] as L.LatLngTuple), ...potholes.map((p) => [p.lat, p.lng] as L.LatLngTuple)];
      m.fitBounds(L.latLngBounds(focus.length ? focus : all), { padding: [60, 60], maxZoom: focus.length ? 15 : 11 });
      fitted.current = true;
    }
  }, [city, potholes, labels]);

  // selection: bigger pin, and the map moves to it
  useEffect(() => {
    const prev = prevSel.current;
    if (prev?.type === "rider") { const e = riderMarkers.current.get(prev.id); if (e) e.marker.setIcon(riderIcon(e.data, false, labels)); }
    if (prev?.type === "city") { const e = cityMarkers.current.get(prev.id); if (e) e.marker.setIcon(cityIcon(e.data, false, labels)); }
    if (selected?.type === "rider") {
      const e = riderMarkers.current.get(selected.id);
      if (e && riderGroup.current) riderGroup.current.zoomToShowLayer(e.marker, () => { e.marker.setIcon(riderIcon(e.data, true, labels)); map.current?.panTo(e.marker.getLatLng(), { animate: true }); });
    }
    if (selected?.type === "city") {
      const e = cityMarkers.current.get(selected.id);
      if (e && cityGroup.current) cityGroup.current.zoomToShowLayer(e.marker, () => { e.marker.setIcon(cityIcon(e.data, true, labels)); map.current?.panTo(e.marker.getLatLng(), { animate: true }); });
    }
    prevSel.current = selected;
  }, [selected, labels, potholes, city]);

  // the visitor's own location
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!me) { if (meLayer.current) { meLayer.current.dot.remove(); meLayer.current.ring.remove(); meLayer.current = null; } return; }
    const at: L.LatLngTuple = [me.lat, me.lng];
    if (!meLayer.current) {
      meLayer.current = {
        ring: L.circle(at, { radius: me.accuracy ?? 30, color: "#0039a6", weight: 1, fillColor: "#0039a6", fillOpacity: 0.08, interactive: false }).addTo(m),
        dot: L.marker(at, { icon: meIcon(), interactive: false, keyboard: false, zIndexOffset: 2000, alt: labels.me }).addTo(m),
      };
    } else {
      meLayer.current.dot.setLatLng(at);
      meLayer.current.ring.setLatLng(at).setRadius(me.accuracy ?? 30);
    }
  }, [me, labels.me]);

  const lastCenter = useRef(0);
  useEffect(() => {
    if (centerOnMe === lastCenter.current) return;
    lastCenter.current = centerOnMe;
    if (me && map.current) map.current.flyTo([me.lat, me.lng], Math.max(map.current.getZoom(), 15), { duration: 0.9 });
  }, [centerOnMe, me]);

  return <div ref={box} className="h-full w-full" />;
}
