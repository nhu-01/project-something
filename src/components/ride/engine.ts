"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { GpsState, Hazard, NavTarget, NearAlert, NearbyHazard, Pos, RideEvent, Sev, Spot } from "./types";

type ServerEvent = {
  kind: RideEvent["kind"]; source?: "311" | "rider"; potholeId: string; hazard?: string; street: string; lane: string; severity: number | null;
};

const FRAME_MS = 800; // how often a frame is taken
const MAX_IN_FLIGHT = 2; // frames being checked at once, so a slow answer doesn't stall the camera
const NEEDED = 1; // one accepted photo finishes the visit to a chosen spot
const FT = 3.28084;
export const MISSION_KEY = "spotholes-mission"; // stops chosen on the map or from a destination
const toHazard = (s?: string): Hazard => (s === "bump" || s === "rough" ? s : "pothole");
const toSev = (n: number | null): Sev | null => (n == null ? null : (Math.min(5, Math.max(1, Math.round(n))) as Sev));

const rad = (d: number) => (d * Math.PI) / 180;
export function meters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
export function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
export const ft = (m: number) => m * FT;

export function deviceId() {
  try {
    let id = localStorage.getItem("spotholes-device");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("spotholes-device", id); }
    return id;
  } catch { return crypto.randomUUID(); }
}

function storedStops(): Spot[] {
  try {
    const raw = sessionStorage.getItem(MISSION_KEY);
    return raw ? (JSON.parse(raw) as Spot[]).filter((s) => s && Number.isFinite(s.lat) && Number.isFinite(s.lng)) : [];
  } catch { return []; }
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
  onResult: (e: RideEvent) => void;
  onHint: (hint: "screen") => void;
  onLuma: (luma: number) => void;
  onTargetClose: (place: string) => void; // first time the target is within ~150 m
  onAtSpot: (place: string) => void; // arrived at it
  onNext: (place: string | null) => void; // moved on to a new target (null: nothing left)
  onNear: (place: string) => void; // a pothole is close by
  onNoHazard: () => void; // a photo asked for by hand showed no road pothole
  onSnap: () => void; // a photo was just taken by hand; the answer comes later
  auto: boolean; // also let the camera pick out potholes by itself
};

// Runs a ride: follows the rider's GPS, points to the next 311 spot, and sends camera frames to the server, which adds
// photos to the 311 report you are standing at (or logs a new hazard anywhere else).
export function useRideEngine({ active, paused, videoRef, onResult, onHint, onLuma, onTargetClose, onAtSpot, onNext, onNear, onNoHazard, onSnap, auto }: Opts) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [gps, setGps] = useState<GpsState>("waiting");
  const [online, setOnline] = useState(true);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [hazards, setHazards] = useState<NearbyHazard[]>([]);
  const stops = useMemo(() => (active ? storedStops() : []), [active]); // the chosen route, if any
  const [finished, setFinished] = useState(false);
  const [target, setTarget] = useState<NavTarget | null>(null);
  const [alert, setAlert] = useState<NearAlert | null>(null);
  const [distanceM, setDistanceM] = useState(0);

  const live = useRef({ paused, onResult, onHint, onLuma, onTargetClose, onAtSpot, onNext, onNear, onNoHazard, onSnap });
  useEffect(() => { live.current = { paused, onResult, onHint, onLuma, onTargetClose, onAtSpot, onNext, onNear, onNoHazard, onSnap }; }, [paused, onResult, onHint, onLuma, onTargetClose, onAtSpot, onNext, onNear, onNoHazard, onSnap]);
  const autoRef = useRef(auto);
  useEffect(() => { autoRef.current = auto; }, [auto]);

  const photosAt = useRef(new Map<string, number>()); // photos this ride added to each 311 spot
  const doneSet = useRef(new Set<string>()); // spots finished on this visit
  const captureRef = useRef<(() => void) | null>(null); // takes a photo right now
  const rideRef = useRef<{ rideId: string; token: string } | null>(null);
  const posRef = useRef<Pos | null>(null);
  const targetIdRef = useRef<string | null>(null);
  const spotsRef = useRef<Spot[]>([]); // read by the timer, which must not run inside a state updater
  const hazardsRef = useRef<NearbyHazard[]>([]);

  const capture = useCallback(() => captureRef.current?.(), []);
  const getRide = useCallback(() => rideRef.current, []);

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let ride: { rideId: string; token: string } | null = null;
    let startingRide = false;
    let prevFix: { lat: number; lng: number; t: number } | null = null;
    let lastFetch: { at: number; lat: number; lng: number } | null = null;
    let lastHint = 0;
    let inFlight = 0;
    const warnedClose = new Set<string>(), warnedAt = new Set<string>(), warnedNear = new Set<string>();
    const canvas = document.createElement("canvas"), tiny = document.createElement("canvas");
    photosAt.current.clear(); doneSet.current.clear(); targetIdRef.current = null;
    const missionStops = storedStops();

    // start (or restart) the ride on the server; retried until it works, so a ride begun with no signal still counts
    const ensureRide = async () => {
      if (ride || startingRide || stopped) return;
      startingRide = true;
      try {
        const r = await fetch("/api/rides", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceId: deviceId() }) });
        if (r.ok && !stopped) { ride = await r.json(); rideRef.current = ride; setOnline(true); } else if (!r.ok) setOnline(false);
      } catch { setOnline(false); }
      startingRide = false;
    };
    void ensureRide();
    const rideTimer = setInterval(() => void ensureRide(), 5000);

    const emit = (e: ServerEvent | null | undefined, frame?: { blob: Blob; aspect: number } | null) => {
      if (!e || stopped) return;
      const source = e.source === "311" ? "311" : "rider";
      if (source === "311") {
        if (e.kind === "photo") photosAt.current.set(e.potholeId, (photosAt.current.get(e.potholeId) ?? 0) + 1);
        if (e.kind === "not_found") doneSet.current.add(e.potholeId);
      }
      live.current.onResult({
        id: `${source}-${e.potholeId}-${e.kind}-${Date.now()}`, kind: e.kind, source, hazard: toHazard(e.hazard), spotId: e.potholeId, street: e.street, lane: e.lane,
        severity: toSev(e.severity), at: Date.now(), shot: frame ? URL.createObjectURL(frame.blob) : undefined, shotAspect: frame?.aspect,
      });
    };

    const send = async (frame: Blob, manual = false) => {
      const p = posRef.current;
      if (!ride || !p) return null;
      const form = new FormData();
      form.append("rideId", ride.rideId); form.append("token", ride.token);
      form.append("lat", String(p.lat)); form.append("lng", String(p.lng));
      if (p.heading != null) form.append("heading", String(p.heading));
      if (p.accuracy != null) form.append("accuracy", String(p.accuracy));
      form.append("frame", frame, "frame.jpg");
      if (manual) form.append("manual", "1");
      try {
        const res = await fetch("/api/scan", { method: "POST", body: form });
        if (res.status === 401) { ride = null; rideRef.current = null; void ensureRide(); return null; } // the server lost this ride: start a fresh one
        setOnline(res.ok);
        if (!res.ok) return null;
        const body = (await res.json()) as { event: ServerEvent | null; hint?: "screen"; reason?: "no_hazard" };
        if (body.hint && !stopped && Date.now() - lastHint > 20000) { lastHint = Date.now(); live.current.onHint(body.hint); }
        return body;
      } catch { setOnline(false); return null; }
    };

    const refreshTargets = async () => {
      const p = posRef.current;
      if (!p) return;
      lastFetch = { at: Date.now(), lat: p.lat, lng: p.lng };
      const r = Math.min(3000, Math.max(800, p.speed * 90));
      try {
        const res = await fetch(`/api/targets?lat=${p.lat}&lng=${p.lng}&r=${Math.round(r)}`);
        if (!res.ok) return;
        const body = (await res.json()) as { spots: Spot[]; hazards: NearbyHazard[] };
        spotsRef.current = body.spots; hazardsRef.current = body.hazards; setSpots(body.spots); setHazards(body.hazards);
      } catch { /* offline: keep what we have */ }
    };

    // follow the rider
    const watch = navigator.geolocation?.watchPosition(
      (g) => {
        const here = { lat: g.coords.latitude, lng: g.coords.longitude };
        const now = Date.now();
        let heading = g.coords.heading != null && !Number.isNaN(g.coords.heading) && (g.coords.speed ?? 0) > 0.5 ? g.coords.heading : posRef.current?.heading ?? null;
        let speed = g.coords.speed != null && !Number.isNaN(g.coords.speed) && g.coords.speed >= 0 ? g.coords.speed : posRef.current?.speed ?? 0;
        if (prevFix) {
          const moved = meters(prevFix, here), dt = (now - prevFix.t) / 1000;
          if (moved > 4) {
            heading = bearing(prevFix, here);
            if (g.coords.speed == null && dt > 0.2) speed = Math.min(60, moved / dt); // some phones don't report speed
            prevFix = { ...here, t: now };
          }
        } else prevFix = { ...here, t: now };
        const next: Pos = { ...here, heading, accuracy: g.coords.accuracy ?? null, speed };
        posRef.current = next; setPos(next); setGps("ok");
      },
      (err) => { if (err.code === err.PERMISSION_DENIED) setGps("denied"); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
    if (watch == null) setGps("denied");

    // choose the target, and fire the voice cues
    const tick = setInterval(() => {
      const p = posRef.current;
      if (stopped || live.current.paused || !p) return;
      if (!lastFetch || Date.now() - lastFetch.at > 30000 || meters(lastFetch, p) > 150) void refreshTargets();

      const acc = p.accuracy ?? 10;
      const arriveM = Math.min(60, Math.max(40, acc + 20));

      // candidates: the chosen route, in order, or else whatever 311 spots are nearby
      {
        // the one spot being photographed: the chosen report; with none chosen there is no target
        const candidates = missionStops;
        const open = candidates.filter((c) => !doneSet.current.has(c.id));
        let chosen: Spot | undefined = open[0];

        // a spot is finished once this pass has added enough photos to it
        // (and the next open one is picked straight away, so "finished" is only said when nothing is left)
        while (chosen && (photosAt.current.get(chosen.id) ?? 0) >= NEEDED) {
          doneSet.current.add(chosen.id);
          const rest = candidates.filter((c) => !doneSet.current.has(c.id));
          chosen = rest[0];
        }
        setFinished(!chosen && doneSet.current.size > 0);

        if (!chosen) {
          if (targetIdRef.current !== null) { targetIdRef.current = null; live.current.onNext(null); }
          setTarget(null);
        } else {
          const d = meters(p, chosen);
          if (targetIdRef.current !== chosen.id) {
            if (targetIdRef.current !== null || doneSet.current.size) live.current.onNext(chosen.place);
            targetIdRef.current = chosen.id;
          }
          const atSpot = d <= arriveM;
          if (d <= 160 && !atSpot && !warnedClose.has(chosen.id)) { warnedClose.add(chosen.id); live.current.onTargetClose(chosen.place); }
          if (atSpot && !warnedAt.has(chosen.id)) { warnedAt.add(chosen.id); live.current.onAtSpot(chosen.place); }
          setTarget({ ...chosen, meters: d, bearing: bearing(p, chosen), atSpot, photosHere: photosAt.current.get(chosen.id) ?? 0, needed: NEEDED });
          setDistanceM(d);
        }
      }

      // "pothole near you": the nearest known spot or hazard that isn't the target
      const alertM = Math.min(220, Math.max(90, p.speed * 12));
      let best: NearAlert | null = null;
      const consider = (id: string, place: string, lat: number, lng: number) => {
        if (id === targetIdRef.current) return;
        const d = meters(p, { lat, lng });
        if (d <= alertM && (!best || d < best.meters)) best = { id, place, meters: d, bearing: bearing(p, { lat, lng }) };
      };
      spotsRef.current.forEach((c) => consider(c.id, c.place, c.lat, c.lng));
      hazardsRef.current.forEach((c) => consider(`h${c.id}`, c.place, c.lat, c.lng));
      const found = best as NearAlert | null;
      if (found && !warnedNear.has(found.id)) { warnedNear.add(found.id); live.current.onNear(found.place); }
      setAlert(found);
    }, 400);

    // take a frame on a steady beat; up to MAX_IN_FLIGHT are checked at once
    const frameTimer = setInterval(async () => {
      const video = videoRef.current;
      if (stopped || live.current.paused || !ride || !posRef.current || !video || inFlight >= MAX_IN_FLIGHT || document.hidden) return;
      inFlight++;
      try {
        const { blob, luma, aspect } = await grabFrame(video, canvas, tiny);
        if (blob) {
          live.current.onLuma(luma);
          // frames are only judged when the camera is allowed to pick potholes out by itself
          if (autoRef.current) { const f = { blob, aspect }; emit((await send(blob))?.event, f); }
        }
      } finally { inFlight--; }
    }, FRAME_MS);

    // a photo on request (the shutter button, or "take a picture here"): sent right away, ignoring the pacing rules
    captureRef.current = async () => {
      if (stopped || live.current.paused) return;
      const video = videoRef.current;
      if (!video || !ride || !posRef.current) { live.current.onNoHazard(); return; }
      const { blob, luma, aspect } = await grabFrame(video, canvas, tiny);
      if (!blob) return;
      live.current.onLuma(luma);
      live.current.onSnap(); // the photo is judged in the background; the camera stays free
      const r = await send(blob, true);
      if (r?.event) emit(r.event, { blob, aspect });
      else if (r?.reason === "no_hazard") live.current.onNoHazard();
    };

    return () => {
      stopped = true;
      clearInterval(tick);
      captureRef.current = null;
      clearInterval(frameTimer);
      clearInterval(rideTimer);
      if (watch != null) navigator.geolocation.clearWatch(watch);
      setTarget(null); setAlert(null); setFinished(false); setGps("waiting"); setPos(null);
      posRef.current = null;
      const r = ride;
      if (r) void fetch(`/api/rides/${r.rideId}/end`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: r.token }), keepalive: true }).catch(() => {});
    };
  }, [active, videoRef]);

  return { pos, gps, online, spots, hazards, stops, target, alert, distanceM, finished, capture, getRide };
}
