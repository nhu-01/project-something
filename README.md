# spotholes

**spot a pothole. snap it.** A photo record of New York City's reported potholes.

New York has thousands of pothole reports filed through 311, and almost none of them have a picture. spotholes takes a
volunteer to **one** reported pothole with turn-by-turn directions, where they film it or snap a photo and submit it.
Each 311 report becomes a page that collects photos from many people over time, like the public ticket pages in Austin
and Boston. Everyone else follows along on a map.

Live at **spotholes.nyc**. Built for MLH Hack Knight 2026. An independent project, not affiliated with the City of New York.

## What it does

- **Spot a pothole:** one button, three ways in: start a video, go to the nearest reported pothole, or submit a photo or
  video you already have. One screen asks for location, camera and microphone once, so nothing pops up mid-way.
- **The map is an entry point too:** it opens on where you are, zooms to the closest reported potholes, and has
  "go to the nearest pothole" and "start a video" buttons. Tap any spot to be taken to it.
- **One spot, one visit:** the nearest open 311 report that needs a photo, with turn-by-turn directions
  ([Leaflet Routing Machine](https://www.liedman.net/leaflet-routing-machine/) over OpenStreetMap bike routing), a
  see-through direction arrow and a live mini-map. When the photo is accepted, you're done.
- **Hands-free:** the microphone is on during a visit. Say "take a picture here" (ElevenLabs speech-to-text) or tap
  the shutter; the photo is checked in the background while the camera stays free. An "auto" switch lets the camera
  pick out potholes by itself too.
- **Roads only:** an AI judge rejects sidewalks, pavers, plazas, screens and prints. Frames showing faces or license
  plates are never stored.
- **Letter grades:** severity is shown as A (minor) to E (severe), like the NYC Department of Health letter grades.
- **Map:** 311 reports are rounded squares, other finds are circles, and you are the blue dot.
- **Spot pages:** every 311 report has a gallery of volunteer photos plus street-level photos from Mapillary.
- **Voice:** spoken cues in ten languages (ElevenLabs, with the browser voice as a fallback).
- **Ten languages**, with Arabic right-to-left. The language is chosen on first visit.

## Tech stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, design tokens in `globals.css`, `motion` for animation |
| Map and directions | Leaflet + leaflet.markercluster, CyclOSM tiles, Leaflet Routing Machine (OSRM bike profile); no keys |
| Database | Tiger Data (TimescaleDB / Postgres), `pg`; PGlite embedded for local dev |
| Photos | Vercel Blob (local files in dev) |
| Detection, first pass | YOLOv8s ONNX model run server-side with `onnxruntime-web` (WASM) |
| Detection, judge | Google Gemini (`@google/genai`), structured JSON verdicts validated with Zod |
| Voice | ElevenLabs text-to-speech (cached, fixed catalog phrases only) and speech-to-text for "take a picture here" |
| Street-level photos | Mapillary API (CC BY-SA 4.0) |
| City data | NYC Open Data, 311 service requests (`erm2-nwe9`), synced daily |
| Geocoding | NYC geocoder, OpenStreetMap Nominatim |
| Hosting | Vercel (manual deploys), Vercel Cron for the daily 311 sync |

## How it was built

Built in roughly 40 hours with [Claude Code](https://claude.com/claude-code) as a pair programmer.

1. **311 first.** The 311 open-data feed is imported (reports with coordinates, minus expressways, ramps and bridges
   nobody should be filming). Every report is a place where photos can be added.
2. **A visit is a stream of frames.** The browser takes a frame about every 800 ms while the GPS watch runs. Frames go
   to `/api/scan`, signed with a short-lived token. At most two are in flight at once. A shutter tap or a spoken
   command sends one immediately and skips the pacing rules.
3. **Cheap first, smart second.** The YOLO model filters frames on the server; only frames that look promising go to
   Gemini, which returns hazard type, grade, size, lane, road type, and whether the camera is pointed at a screen.
4. **Place matching.** A frame near an open 311 report becomes a photo on that report. Elsewhere it joins an existing
   volunteer-found hazard or creates one, with a radius that grows with GPS error so one pothole is not logged twice.
5. **Directions.** `/api/nearest` picks the spot; the browser asks the OSRM bike router for steps through Leaflet
   Routing Machine, follows the GPS fix along the line, and re-routes if you drift more than about 70 m away. The arrow
   is bearing math on GPS plus the phone compass.
6. **Everything said aloud lives in the translation catalog.** One English file, nine generated dictionaries
   (`scripts/translate.mjs`, placeholder-checked and resumable). The voice endpoint only synthesizes catalog phrases,
   so it can't be used to speak arbitrary text. The microphone is opt-in; short clips are transcribed and not stored.
7. **Privacy by design.** Frames with identifiable people or plates are dropped; people are anonymous labels; there is
   no location trail and no account system.

## Project layout

```
src/app/            pages (home, map, capture, spots/[id], potholes/[id]) and API routes
src/components/     landing, map, ride (camera screen: engine, navigation, HUD, overlay), photos, ui
src/lib/server/     database, detection, Gemini judge, 311 sync, Mapillary, storage
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
| `ELEVENLABS_API_KEY` | voice cues and voice commands |
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
