# spotholes

Pothole Copilot for NYC: riders run a web app on an iPhone that spots potholes and warns by voice; every pass is saved so the
next rider on the same path is warned and updates what we know. Non-riders use the map and stats pages to follow progress.
Domain: spotholes.nyc. See @DESIGN.md for the design system (cream paper, ink, Hanken Grotesk, pill shapes).

## Status
Live at spotholes.vercel.app (domain spotholes.nyc still to be pointed at it). Everything shown is real rider data:
there is no sample, demo or seed data anywhere, and none should be added. An earlier attempt lives on `feat/initial-build`.

## Stack
Next.js (App Router, TypeScript strict), Tailwind v4, Leaflet + markercluster (map), `motion` (UI animation).
Backend: Tiger Data (Postgres), Gemini (judges frames), a YOLO first pass (onnxruntime-web), ElevenLabs (voice), Vercel Blob (photos).
Read `node_modules/next/dist/docs/` before using Next APIs: this version differs from older ones.

## Rules
- Pages get data only through `src/lib/data/` (server-only, reads the database). Never add sample or placeholder records.
- Local dev uses an embedded database and local photo files (`USE_LOCAL_DB=1`), so tests never touch live data. Don't test
  against production by creating hazards; use refusal paths or the local database.
- Never put an API key or secret in browser code. Never commit `.env*`.
- Use design tokens; no hard-coded colors. Respect `prefers-reduced-motion`. Status/severity are text, not just color.
- Safety: the ride screen must tell riders to mount the phone before moving and never to handle it while moving.
- Keep components small. No `any`. Comments explain why.
- After changes run `npm run lint` and `npx tsc --noEmit`, then check in the browser at 390px and 1440px.
- Work on feature branches, never on `main`.
