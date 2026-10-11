# spotholes

**spot a pothole. snap it.** A photo record of New York City's reported potholes.

New York has thousands of pothole reports filed through 311, and almost none of them have a picture. spotholes points a
volunteer to the nearest reported pothole (or a route past a few), where the phone camera spots it and adds the photo.
Each 311 report becomes a public page that collects photos from many people over time, like the ticket pages in Austin
and Boston. Everyone else follows along on a map.

Live at **spotholes.nyc**. Built for MLH Hack Knight 2026. An independent project, not affiliated with the City of New York.

## What it does

- **Spot a pothole:** one button with three options: start a video anywhere, route to the nearest reported potholes, or
  watch a simulated demo (nothing is saved).
- **Camera screen:** a see-through direction arrow, distance, and a live mini-map. The camera checks frames on its own and
  adds real road potholes to the 311 report you are standing at.
- **Hands-free backup:** if the camera misses one, say "take a picture here" (ElevenLabs speech-to-text) and the photo is
  checked in the background.
- **Photo routes:** a short loop past nearby 311 reports that still have no photo, planned along a bike route. You can
  also enter a destination and see the 311 spots on the way.
- **Roads only:** an AI judge rejects sidewalks, pavers, plazas, screens and prints. Frames showing faces or license
  plates are never stored.
- **Letter grades:** severity is shown as A (minor) to E (severe), like the NYC Department of Health letter grades.
- **Map:** 311 reports are rounded squares, other finds are circles, and you are the blue dot. It zooms to you and the
  nearest reported potholes when it finds your location.
- **Spot pages:** every 311 report has a gallery of volunteer photos plus street-level photos from Mapillary.
- **Voice and languages:** spoken cues (ElevenLabs, browser voice as a fallback) and ten languages, Arabic right-to-left.

## Tech stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, `motion` for animation |
| Map | Leaflet + leaflet.markercluster, CyclOSM tiles (no key) |
| Database | Tiger Data (TimescaleDB / Postgres), `pg`; PGlite embedded for local dev |
| Photos | Vercel Blob (local files in dev) |
| Detection, first pass | YOLOv8s ONNX road-damage model run server-side with `onnxruntime-web` (WASM) |
| Detection, judge | Google Gemini (`@google/genai`), structured JSON verdicts validated with Zod |
| Voice | ElevenLabs text-to-speech (cached, fixed catalog phrases only) and speech-to-text for voice capture |
| Street-level photos | Mapillary API (CC BY-SA 4.0) |
| City data | NYC Open Data, 311 service requests (`erm2-nwe9`), synced daily |
| Geocoding and routing | NYC geocoder, OpenStreetMap Nominatim, OSRM bike routing |
| Hosting | Vercel (manual deploys), Vercel Cron for the daily 311 sync |

## How it works

1. **311 first.** The 311 feed is imported (reports with coordinates, minus expressways, ramps and bridges). Every
   report is a place where photos can be added.
2. **A ride is a stream of frames.** The browser sends a 640×640 frame about every 800 ms with GPS to `/api/scan`,
   signed with a short-lived token.
3. **Cheap first, smart second.** YOLO scores each frame in milliseconds. Gemini is only asked when YOLO confidence is
   at least 0.20 (0.12 where a hazard is already known), plus a safety-net look every 3 s. Gemini returns hazard type,
   severity, size, lane, road type, and whether the camera is pointed at a screen.
4. **Place matching.** A frame near an open 311 report becomes a photo on that report. Elsewhere it joins an existing
   volunteer-found hazard or creates one, with a radius that grows with GPS error so one pothole is not logged twice.
5. **Voice capture.** A "take a picture here" clip is transcribed by ElevenLabs; the frame is then sent immediately and
   skips the pacing rules, but Gemini still has the last word.
6. **Everything said aloud lives in the translation catalog.** One English file, nine generated dictionaries
   (`scripts/translate.mjs`). The voice endpoint only synthesizes catalog phrases.
7. **Privacy by design.** Frames with identifiable people or plates are dropped; people are anonymous labels; there is
   no account system.

## Project layout

```
src/app/            pages (home, map, ride, spots/[id], potholes/[id]) and API routes
src/components/     landing, map, ride (engine, HUD, overlay), photos, ui
src/lib/server/     database, detection, Gemini judge, 311 sync, routing, Mapillary, storage
src/lib/data/       the only way pages read data (server-only)
src/lib/i18n/       en.ts catalog and generated dictionaries
models/             the YOLO ONNX model
```

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in what you have
USE_LOCAL_DB=1 npm run dev   # embedded database and local photos; production data is never touched
```

| Name | Used for |
|---|---|
| `DATABASE_URL` | Postgres connection (production) |
| `USE_LOCAL_DB` | `1` to use the embedded database and local photo files |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob photo storage |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | the frame judge and translations |
| `ELEVENLABS_API_KEY` | voice cues and voice capture |
| `MAPILLARY_TOKEN` | street-level photos (optional) |
| `ADMIN_KEY`, `CRON_SECRET` | the 311 sync endpoint and maintenance |

## Credits and notes

- 311 data: NYC Open Data. Street photos: Mapillary contributors, CC BY-SA 4.0. Map: OpenStreetMap contributors, CyclOSM.
- Grades and sizes are AI estimates, not official city grades. spotholes does not file 311 reports.
- Translations are machine-generated and should be reviewed by native speakers.
