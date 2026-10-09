"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { GpsState, Hazard, RideEvent, Sev, Upcoming } from "./types";

type Known = { id: string; lat: number; lng: number; street: string; lane: string; severity: number; kind?: string };
type Pos = { lat: number; lng: number; heading: number | null; accuracy: number | null; speed: number };
type ServerEvent = { kind: RideEvent["kind"]; potholeId: string; hazard?: string; street: string; lane: string; severity: number | null };
type Crumb = { lat: number; lng: number; t: number };

const PASS_M = 20; // closer than this counts as having reached it
const FRAME_MS = 800; // how often a frame is taken
const MAX_IN_FLIGHT = 2; // frames being checked at once, so a slow answer doesn't stall the camera
const MAX_CRUMBS = 6000; // breadcrumbs kept while offline (hours of riding)
const FT = 3.28084;
const toHazard = (s?: string): Hazard => (s === "bump" || s === "rough" ? s : "pothole");

// Faster riders need earlier warnings: about 9 seconds' notice, never less than 45 m or more than 260 m.
const warnDistance = (speed: number) => Math.min(260, Math.max(45, speed * 9));
// ...and need to know about hazards further out.
const lookAhead = (speed: number) => Math.min(3000, Math.max(600, speed * 60));

const rad = (d: number) => (d * Math.PI) / 180;
function meters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const toSev = (n: number | null): Sev | null => (n == null ? null : (Math.min(5, Math.max(1, Math.round(n))) as Sev));

export function deviceId() {
  try {
    let id = localStorage.getItem("spotholes-device");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("spotholes-device", id); }
    return id;
  } catch { return crypto.randomUUID(); }
}

// Letterboxes the current video frame to 640x640 for the detector, and measures how bright the scene is (0..1).
function grabFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, tiny: HTMLCanvasElement): Promise<{ blob: Blob | null; luma: number; aspect: number }> {
  const vw = video.videoWidth, vh = video.videoHeight;
  const ctx = canvas.getContext("2d"), tctx = tiny.getContext("2d", { willReadFrequently: true });
  if (!vw || !vh || !ctx || !tctx) return Promise.resolve({ blob: null, luma: 1, aspect: 1 });
  canvas.width = 640; canvas.height = 640;
  const s = Math.min(640 / vw, 640 / vh), w = vw * s, h = vh * s;
  ctx.fillStyle = "#727272"; ctx.fillRect(0, 0, 640, 640);
  ctx.drawImage(video, (640 - w) / 2, (640 - h) / 2, w, h);
  tiny.width = 24; tiny.height = 24;
  tctx.drawImage(video, 0, 0, 24, 24);
  const px = tctx.getImageData(0, 0, 24, 24).data;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
  const luma = sum / (px.length / 4) / 255;
  return new Promise((res) => canvas.toBlob((blob) => res({ blob, luma, aspect: vw / vh }), "image/jpeg", 0.6));
}

type Opts = {
  active: boolean;
  paused: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onAhead: (u: Upcoming) => void;
  onResult: (e: RideEvent) => void;
  onHint: (hint: "screen") => void;
  onLuma: (luma: number) => void;
};

// Runs a ride of any length and speed: tracks GPS, warns about saved hazards ahead, and sends camera frames to the
// server, which detects new hazards and compares known ones with what earlier riders saw. Survives dropped signal.
export function useRideEngine({ active, paused, videoRef, onAhead, onResult, onHint, onLuma }: Opts) {
  const [upcoming, setUpcoming] = useState<Upcoming | null>(null);
  const [distance, setDistance] = useState(0);
  const [gps, setGps] = useState<GpsState>("waiting");
  const [online, setOnline] = useState(true);
  const [meters_, setMeters] = useState(0); // distance covered this ride, from the GPS breadcrumbs
  const live = useRef({ paused, onAhead, onResult, onHint, onLuma });
  useEffect(() => { live.current = { paused, onAhead, onResult, onHint, onLuma }; }, [paused, onAhead, onResult, onHint, onLuma]);

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let ride: { rideId: string; token: string } | null = null;
    let startingRide = false;
    let pos: Pos | null = null;
    let prevFix: { lat: number; lng: number; t: number } | null = null;
    let lastFetch: { at: number; lat: number; lng: number; r: number } | null = null;
    let lastFrame: { blob: Blob; aspect: number } | null = null;
    let current: { id: string; minD: number; warnM: number } | null = null;
    let lastHint = 0;
    let inFlight = 0;
    let crumbs: Crumb[] = [];
    let lastCrumb: { lat: number; lng: number } | null = null;
    const known = new Map<string, Known>();
    const warned = new Set<string>();
    const resolved = new Set<string>(); // hazards that already got a result on this ride
    const canvas = document.createElement("canvas"), tiny = document.createElement("canvas");

    // Start (or restart) the ride on the server. Retried until it works, so a ride begun with no signal still counts.
    const ensureRide = async () => {
      if (ride || startingRide || stopped) return;
      startingRide = true;
      try {
        const r = await fetch("/api/rides", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceId: deviceId() }) });
        if (r.ok && !stopped) { ride = await r.json(); setOnline(true); } else if (!r.ok) setOnline(false);
      } catch { setOnline(false); }
      startingRide = false;
    };
    void ensureRide();
    const rideTimer = setInterval(() => void ensureRide(), 5000);

    // `frame` is the picture the server just judged; the ride screen shows it as the "photo taken" moment.
    const emit = (e: ServerEvent | null | undefined, frame?: { blob: Blob; aspect: number } | null) => {
      if (!e || stopped) return;
      resolved.add(e.potholeId); warned.add(e.potholeId);
      if (e.kind === "repaired") known.delete(e.potholeId);
      live.current.onResult({ id: `${e.potholeId}-${e.kind}`, kind: e.kind, hazard: toHazard(e.hazard), street: e.street, lane: e.lane, severity: toSev(e.severity), at: Date.now(), shot: frame ? URL.createObjectURL(frame.blob) : undefined, shotAspect: frame?.aspect });
    };

    const send = async (path: "/api/scan" | "/api/pass", frame: Blob, extra: Record<string, string> = {}) => {
      if (!ride || !pos) return null;
      const form = new FormData();
      form.append("rideId", ride.rideId); form.append("token", ride.token);
      form.append("lat", String(pos.lat)); form.append("lng", String(pos.lng));
      if (pos.heading != null) form.append("heading", String(pos.heading));
      if (pos.accuracy != null) form.append("accuracy", String(pos.accuracy));
      for (const [k, v] of Object.entries(extra)) form.append(k, v);
      form.append("frame", frame, "frame.jpg");
      try {
        const res = await fetch(path, { method: "POST", body: form });
        if (res.status === 401) { ride = null; void ensureRide(); return null; } // the server lost this ride: start a fresh one
        setOnline(res.ok);
        if (!res.ok) return null;
        const body = (await res.json()) as { event: ServerEvent | null; hint?: "screen" };
        // don't nag: at most one hint every 20 seconds
        if (body.hint && !stopped && Date.now() - lastHint > 20000) { lastHint = Date.now(); live.current.onHint(body.hint); }
        return body.event;
      } catch { setOnline(false); return null; }
    };

    const refreshNearby = async () => {
      if (!pos) return;
      const r = lookAhead(pos.speed);
      lastFetch = { at: Date.now(), lat: pos.lat, lng: pos.lng, r };
      try {
        const res = await fetch(`/api/nearby?lat=${pos.lat}&lng=${pos.lng}&r=${Math.round(r)}`);
        if (!res.ok) return;
        for (const k of (await res.json()) as Known[]) if (!resolved.has(k.id)) known.set(k.id, k);
        // on a long ride, forget hazards that are now far behind
        for (const [id, k] of known) if (meters(pos, k) > r * 2 && current?.id !== id) known.delete(id);
      } catch { /* offline: keep what we have */ }
    };

    // follow the rider
    const watch = navigator.geolocation?.watchPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        const now = Date.now();
        let heading = p.coords.heading != null && !Number.isNaN(p.coords.heading) && (p.coords.speed ?? 0) > 0.5 ? p.coords.heading : pos?.heading ?? null;
        let speed = p.coords.speed != null && !Number.isNaN(p.coords.speed) && p.coords.speed >= 0 ? p.coords.speed : pos?.speed ?? 0;
        if (prevFix) {
          const moved = meters(prevFix, here), dt = (now - prevFix.t) / 1000;
          if (moved > 4) {
            heading = bearing(prevFix, here);
            if (p.coords.speed == null && dt > 0.2) speed = Math.min(60, moved / dt); // some phones don't report speed
            prevFix = { ...here, t: now };
          }
        } else prevFix = { ...here, t: now };
        pos = { ...here, heading, accuracy: p.coords.accuracy ?? null, speed };
        // breadcrumb for the ridden-streets map: only decent fixes, only when we've actually moved
        if ((p.coords.accuracy ?? 99) <= 50 && (!lastCrumb || meters(lastCrumb, here) > 6)) {
          if (lastCrumb) { const step = meters(lastCrumb, here); if (step < 400) setMeters((m) => m + step); }
          lastCrumb = here; crumbs.push({ ...here, t: now });
          if (crumbs.length > MAX_CRUMBS) crumbs = crumbs.slice(-MAX_CRUMBS);
        }
        setGps("ok");
      },
      (err) => { if (err.code === err.PERMISSION_DENIED) setGps("denied"); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
    if (watch == null) setGps("denied");

    // upload breadcrumbs in batches; anything that fails is kept and retried
    let flushing = false;
    const flushCrumbs = async (keepalive = false) => {
      if (flushing || !ride || !crumbs.length) return;
      flushing = true;
      for (let batchNo = 0; batchNo < 8 && crumbs.length && ride; batchNo++) {
        const points = crumbs.slice(0, 80);
        try {
          const r = await fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rideId: ride.rideId, token: ride.token, points }), keepalive });
          if (r.status === 401) { ride = null; void ensureRide(); break; }
          if (!r.ok) break;
          crumbs = crumbs.slice(points.length);
        } catch { break; }
      }
      flushing = false;
    };
    const crumbTimer = setInterval(() => void flushCrumbs(), 6000);

    // warn about saved hazards ahead, and settle each one as the rider passes it
    const tick = setInterval(() => {
      if (stopped || live.current.paused || !pos) return;
      if (!lastFetch || Date.now() - lastFetch.at > 30000 || meters(lastFetch, pos) > lastFetch.r / 4) void refreshNearby();

      if (current) {
        const k = known.get(current.id);
        const d = k ? meters(pos, k) : Infinity;
        if (k && d < current.minD) current.minD = d;
        const passed = !k || d > current.minD + Math.max(8, pos.speed * 1.5) || d > current.warnM + 40;
        if (!passed) { setDistance(Math.max(0, Math.round((d * FT) / 5) * 5)); return; }
        const done = current;
        current = null; setUpcoming(null);
        // reached it but the camera never confirmed it: ask the server to judge the latest frame
        if (k && done.minD < Math.max(PASS_M, pos.speed * 2) && !resolved.has(done.id) && lastFrame) { const f = lastFrame; void send("/api/pass", f.blob, { potholeId: done.id }).then((e) => emit(e, f)); }
        return;
      }

      const warnM = warnDistance(pos.speed);
      let best: { k: Known; d: number } | null = null;
      for (const k of known.values()) {
        if (warned.has(k.id)) continue;
        const d = meters(pos, k);
        // below walking pace the heading is noise, so only distance counts
        const ahead = pos.heading == null || pos.speed < 1 || angleDiff(bearing(pos, k), pos.heading) < 45 || d < 12;
        if (d <= warnM && ahead && (!best || d < best.d)) best = { k, d };
      }
      if (best) {
        warned.add(best.k.id);
        current = { id: best.k.id, minD: best.d, warnM };
        const u: Upcoming = { id: best.k.id, hazard: toHazard(best.k.kind), street: best.k.street, lane: best.k.lane, severity: toSev(best.k.severity) ?? 2, startFt: Math.max(10, Math.round(best.d * FT)) };
        setUpcoming(u); setDistance(u.startFt); live.current.onAhead(u);
      }
    }, 300);

    // take a frame on a steady beat; up to MAX_IN_FLIGHT are checked at once
    const frameTimer = setInterval(async () => {
      const video = videoRef.current;
      if (stopped || live.current.paused || !ride || !pos || !video || inFlight >= MAX_IN_FLIGHT || document.hidden) return;
      inFlight++;
      try {
        const { blob, luma, aspect } = await grabFrame(video, canvas, tiny);
        if (blob) { const f = { blob, aspect }; live.current.onLuma(luma); lastFrame = f; emit(await send("/api/scan", blob), f); }
      } finally { inFlight--; }
    }, FRAME_MS);

    return () => {
      stopped = true;
      clearInterval(tick); clearInterval(frameTimer); clearInterval(crumbTimer); clearInterval(rideTimer);
      if (watch != null) navigator.geolocation.clearWatch(watch);
      setUpcoming(null); setGps("waiting"); setMeters(0);
      const r = ride;
      if (r) {
        // last breadcrumbs, then close the ride
        const points = crumbs.slice(0, 80);
        const post = (url: string, body: unknown) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
        void (points.length ? post("/api/track", { rideId: r.rideId, token: r.token, points }) : Promise.resolve()).then(() => post(`/api/rides/${r.rideId}/end`, { token: r.token }));
      }
    };
  }, [active, videoRef]);

  return { upcoming, distance, gps, online, meters: meters_ };
}
