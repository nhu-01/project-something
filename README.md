# spotholes

**spot a pothole. snap it.** A photo record of New York City's reported potholes.

New York has thousands of pothole reports filed through 311, and almost none of them have a picture. spotholes lets a
volunteer find the nearest reported pothole (or a route past several), film it as they ride past, and add the picture
to that report. Each 311 report becomes a page that collects photos from many riders over time, like the public
ticket pages in Austin and Boston. Everyone else follows along on a map.

Live at **spotholes.nyc**. Built for MLH Hack Knight 2026. An independent project, not affiliated with the City of New York.

## What it does

- **Spot a pothole:** one button, three options: start a video, route to the nearest reported potholes, or watch a
  simulated demo ride (nothing is saved).
- **Ride screen:** a see-through navigation overlay with a Find My style arrow, distance, live mini-map, and a
  "pothole near you" arrow. A phone camera feed is checked frame by frame; real road potholes are added to the
  311 report you are standing at.
- **Road only:** an AI judge rejects sidewalks, pavers, plazas, screens and prints. Frames showing faces or license
  plates are never stored.
- **Letter grades:** severity is shown as A (minor) to E (severe), like a restaurant sign.
- **Map:** 311 reports are rounded squares, other finds are circles, and you are the blue dot. Cycling map style.
- **Spot pages:** every 311 report has a gallery of rider photos plus street-level photos from Mapillary.
- **Voice:** spoken cues in ten languages (ElevenLabs, with the browser voice as a fallback).
- **Ten languages**, with Arabic right-to-left. The language is chosen on first visit.

## Tech stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, design tokens in `globals.css`, `motion` for animation |
| Map | Leaflet + leaflet.markercluster, CyclOSM tiles (free, no key) |
| Database | Tiger Data (TimescaleDB / Postgres), `pg`; PGlite embedded for local dev |
| Photos | Vercel Blob (local files in dev) |
| Detection, first pass | YOLOv8s ONNX model run server-side with `onnxruntime-web` (WASM) |
| Detection, judge | Google Gemini (`@google/genai`), structured JSON verdicts validated with Zod |
| Voice | ElevenLabs text-to-speech, cached in Blob, only for fixed catalog phrases |
| Street-level photos | Mapillary API (CC BY-SA 4.0) |
| City data | NYC Open Data, 311 service requests (`erm2-nwe9`), synced daily |
| Geocoding and routing | NYC geocoder, OpenStreetMap Nominatim, OSRM bike routing |
| Hosting | Vercel (manual deploys), Vercel Cron for the daily 311 sync |

## How it was built

Built in roughly 40 hours with [Claude Code](https://claude.com/claude-code) as a pair programmer.

1. **311 first.** The 311 open-data feed is imported (reports with coordinates, minus expressways, ramps and bridges
   a cyclist should not be filming). Every report is a place where photos can be added.
2. **A ride is a stream of frames.** The browser takes a frame about every 800 ms while the GPS watch runs. Frames go to
   `/api/scan`, signed with a short-lived ride token. At most two are in flight at once.
3. **Cheap first, smart second.** The YOLO model filters frames on the server; only frames that look promising go to
   Gemini, which returns hazard type, grade, size, lane, road type, and whether the camera is pointed at a screen.
4. **Place matching.** A frame near an open 311 report becomes a photo on that report. Elsewhere it joins an existing
   rider-found hazard or creates one, with a radius that grows with GPS error so one pothole is not logged twice.
5. **Navigation without a nav SDK.** The arrow is bearing math on GPS plus the phone compass; the mini-map is a second
   small Leaflet instance.
6. **Everything said aloud lives in the translation catalog.** One English file, nine generated dictionaries
   (`scripts/translate.mjs`, placeholder-checked and resumable). The voice endpoint only synthesizes catalog phrases,
   so it can't be used to speak arbitrary text.
7. **Privacy by design.** Frames with identifiable people or plates are dropped; riders are anonymous labels; there is
   no ridden-streets trace and no account system.

## Project layout

```
src/app/            pages (home, map, ride, spots/[id], potholes/[id]) and API routes
src/components/     landing, map, ride (engine, HUD, overlay), photos, ui
src/lib/server/     database, detection, Gemini judge, 311 sync, routing, Mapillary, storage
src/lib/data/       the only way pages read data (server-only)
src/lib/i18n/       en.ts catalog and generated dictionaries
models/             the YOLO ONNX model
scripts/            translate.mjs, push-env.sh
```

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in what you have
USE_LOCAL_DB=1 npm run dev   # embedded database and local photos; production data is never touched
```

Environment variables (see `.env.example`):

| Name | Used for |
|---|---|
| `DATABASE_URL` | Postgres connection (production) |
| `USE_LOCAL_DB` | `1` to use the embedded database and local photo files |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob photo storage |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | the frame judge and translations |
| `ELEVENLABS_API_KEY` | voice |
| `MAPILLARY_TOKEN` | street-level photos (optional; hidden without it) |
| `ADMIN_KEY`, `CRON_SECRET` | the 311 sync endpoint and maintenance |

Checks: `npm run lint` and `npx tsc --noEmit`.
Translations: `TRANSLATE_MODEL=gemini-3.5-flash-lite node scripts/translate.mjs`.
Deploy: `npx vercel deploy --prod`.

## Credits and notes

- 311 data: NYC Open Data. Street photos: Mapillary contributors, CC BY-SA 4.0. Map: OpenStreetMap contributors, CyclOSM.
- The subway-line bullets are plain colored circles with numbers; no MTA marks are used.
- Grades and sizes are AI estimates, not official city grades. spotholes does not file 311 reports.
- Translations are machine-generated and should be reviewed by native speakers before a wide launch.
