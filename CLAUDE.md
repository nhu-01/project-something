# spotholes

Pothole photo record for NYC. Slogan: "find a pothole. snap it." A volunteer opens the site, finds the nearest reported
311 pothole (or a route past several) and adds pictures of it: filmed as they ride past (the camera judges frames) or a
photo submitted by hand. Each 311 report collects many photos over time, like Austin's and Boston's ticket pages.
Riders can also log hazards nobody reported; those are circles on the map, 311 reports are rounded squares.
There is no ridden-streets trace and no "pothole ahead" voice warning; a "pothole near you" Find-My-style arrow is the
only alert. Non-riders use the map, spot pages and stats to follow progress.
Domain: spotholes.nyc. See @DESIGN.md for the design system (cream paper, ink, Hanken Grotesk, pill shapes).

## Status
Live at spotholes.nyc (also spotholes.vercel.app). Deploys are manual: `npx vercel@63.1.0 deploy --prod --yes`. Everything shown is real:
there is no sample, demo or seed data anywhere, and none should be added.

## Stack
Next.js (App Router, TypeScript strict), Tailwind v4, Leaflet + markercluster (map), `motion` (UI animation).
Backend: Tiger Data (Postgres), Gemini (judges frames), a YOLO first pass (onnxruntime-web), ElevenLabs (voice), Vercel Blob (photos).
Read `node_modules/next/dist/docs/` before using Next APIs: this version differs from older ones.

## Rules
- Pages get data only through `src/lib/data/` (server-only, reads the database). Never add sample or placeholder records.
- NYC 311 pothole reports (real city open data, synced daily by `/api/cron/city-sync`) are the main thing. They are
  always labeled as 311 reports (rounded squares) and never styled as rider-found hazards (circles).
- Local dev uses an embedded database and local photo files (`USE_LOCAL_DB=1`), so tests never touch live data. Don't test
  against production by creating hazards; use refusal paths or the local database.
- All interface text lives in `src/lib/i18n/en.ts`; never hard-code visible strings in components. After changing it, run
  `node scripts/translate.mjs` to refresh the nine other languages (machine-translated; flag for native review). Use
  logical CSS (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`) so Arabic's right-to-left layout keeps working.
- Never put an API key or secret in browser code. Never commit `.env*`.
- Use design tokens; no hard-coded colors. Respect `prefers-reduced-motion`. Status/severity are text, not just color.
- Safety: the ride screen must tell riders to mount the phone before moving and never to handle it while moving.
- Keep components small. No `any`. Comments explain why.
- After changes run `npm run lint` and `npx tsc --noEmit`, then check in the browser at 390px and 1440px.
- Work straight on `main` (the owner's decision: no feature branches). Commit small, push, then deploy.
