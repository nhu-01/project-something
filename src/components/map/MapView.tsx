"use client";
import L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef } from "react";
import { escapeHtml } from "@/lib/escape";
import type { Pothole } from "@/lib/data/types";
import { SEV_WORD } from "@/lib/tokens";

type Props = { potholes: Pothole[]; selectedId: string | null; onSelect: (id: string) => void };

function pinIcon(p: Pothole, selected: boolean) {
  const sev = p.severity ?? 1;
  const label = escapeHtml(`pothole on ${p.street}, ${p.status === "repaired" ? "appears repaired" : `severity ${sev}, ${SEV_WORD[sev]}`}`);
  return L.divIcon({
    className: "pin-wrap",
    html: `<button type="button" class="pin${selected ? " pin--selected" : ""}${p.status === "repaired" ? " pin--repaired" : ""}" style="--pin-color:var(--sev-${sev});--pin-text:${sev <= 2 ? "var(--ink)" : "#fff"}" aria-label="${label}"><span class="pin-dot" aria-hidden="true">${p.status === "repaired" ? "✓" : sev}</span></button>`,
    iconSize: [44, 44], iconAnchor: [22, 22],
  });
}

export default function MapView({ potholes, selectedId, onSelect }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const cluster = useRef<L.MarkerClusterGroup | null>(null);
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
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    const group = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 46,
      iconCreateFunction: (c) => {
        const n = c.getChildCount();
        return L.divIcon({ className: "cluster-wrap", html: `<div class="cluster" role="img" aria-label="${n} potholes, click to zoom in">${n}</div>`, iconSize: [42, 42] });
      },
    });
    m.addLayer(group);
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
      const marker = L.marker([p.lat, p.lng], { icon: pinIcon(p, false), keyboard: false, alt: "" });
      marker.on("click", () => onSelectRef.current(p.id));
      markers.current.set(p.id, { marker, data: p });
      return marker;
    });
    group.addLayers(list);
    if (!fitted.current && potholes.length) {
      m.fitBounds(L.latLngBounds(potholes.map((p) => [p.lat, p.lng] as L.LatLngTuple)), { padding: [60, 60], maxZoom: 13 });
      fitted.current = true;
    }
  }, [potholes]);

  useEffect(() => {
    const prev = prevSelected.current ? markers.current.get(prevSelected.current) : null;
    if (prev) prev.marker.setIcon(pinIcon(prev.data, false));
    const cur = selectedId ? markers.current.get(selectedId) : null;
    if (cur && cluster.current) {
      cluster.current.zoomToShowLayer(cur.marker, () => {
        cur.marker.setIcon(pinIcon(cur.data, true));
        map.current?.panTo(cur.marker.getLatLng(), { animate: true });
      });
    }
    prevSelected.current = selectedId;
  }, [selectedId, potholes]);

  return <div ref={box} className="h-full w-full" />;
}
