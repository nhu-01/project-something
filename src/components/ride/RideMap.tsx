"use client";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { NavTarget, NearbyHazard, Pos, Spot } from "./types";

type Props = { pos: Pos | null; target: NavTarget | null; spots: Spot[]; hazards: NearbyHazard[]; stops: Spot[]; label: string };

const dot = (cls: string, text = "") => L.divIcon({ className: "pin-wrap", html: `<span class="${cls}" aria-hidden="true">${text}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] });
const meIcon = L.divIcon({ className: "pin-wrap", html: '<span class="me-dot" aria-hidden="true"><span class="me-pulse"></span><span class="me-core"></span></span>', iconSize: [28, 28], iconAnchor: [14, 14] });

// A small live map for the ride: you, the 311 spots around you, and the one you are heading to. Rendered with the same
// free tiles as the main map. It follows you until you drag it.
export default function RideMap({ pos, target, spots, hazards, stops, label }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const me = useRef<L.Marker | null>(null);
  const follow = useRef(true);

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: false, attributionControl: false, center: [40.73, -73.95], zoom: 16 });
    L.tileLayer("https://dev.{s}.tile.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", { maxZoom: 19, subdomains: "abc" }).addTo(m);
    m.on("dragstart", () => { follow.current = false; });
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; layer.current = null; me.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !pos) return;
    const ll: L.LatLngExpression = [pos.lat, pos.lng];
    if (!me.current) me.current = L.marker(ll, { icon: meIcon, interactive: false, keyboard: false }).addTo(m);
    else me.current.setLatLng(ll);
    if (follow.current) m.setView(ll, m.getZoom(), { animate: true });
  }, [pos]);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    const route = (stops.length ? stops : target ? [target] : []).map((s) => [s.lat, s.lng] as [number, number]);
    if (route.length > 1) L.polyline(route, { color: "#0039A6", weight: 4, opacity: 0.7, dashArray: "2 8" }).addTo(g);
    hazards.forEach((h) => L.marker([h.lat, h.lng], { icon: dot("ride-pin ride-pin--rider", String(Math.min(5, Math.max(1, Math.round(h.severity))))), interactive: false }).addTo(g));
    spots.forEach((s) => { if (s.id !== target?.id) L.marker([s.lat, s.lng], { icon: dot("ride-pin ride-pin--city"), interactive: false }).addTo(g); });
    if (target) L.marker([target.lat, target.lng], { icon: dot("ride-pin ride-pin--target", "311"), interactive: false, zIndexOffset: 500 }).addTo(g);
  }, [spots, hazards, stops, target]);

  return <div ref={box} role="img" aria-label={label} className="h-full w-full" />;
}
