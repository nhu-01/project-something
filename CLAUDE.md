# spotholes

Pothole Copilot for NYC: riders run a web app on an iPhone that spots potholes and warns by voice; every pass is saved so the
next rider on the same path is warned and updates what we know. Non-riders use the map and stats pages to follow progress.
Domain: spotholes.nyc. See @DESIGN.md for the design system (cream paper, ink, Hanken Grotesk, pill shapes).

## Status
Frontend first. Screens run on typed sample data behind `src/lib/data/`; the backend (Tiger Data, Gemini, ElevenLabs, YOLO)
gets wired in later, then deployment. An earlier full-backend attempt lives on branch `feat/initial-build` (YOLO model, pipeline).

## Stack
Next.js (App Router, TypeScript strict), Tailwind v4, Leaflet + markercluster (map), `motion` (UI animation).
Read `node_modules/next/dist/docs/` before using Next APIs: this version differs from older ones.

## Rules
- Components get data only through `src/lib/data/`. Sample data lives in `src/data/sample.ts` and is labeled "sample data" in the UI.
- Never put an API key or secret in browser code. Never commit `.env*`.
- Use design tokens; no hard-coded colors. Respect `prefers-reduced-motion`. Status/severity are text, not just color.
- Safety: the ride screen must tell riders to mount the phone before moving and never to handle it while moving.
- Keep components small. No `any`. Comments explain why.
- After changes run `npm run lint` and `npx tsc --noEmit`, then check in the browser at 390px and 1440px.
- Work on feature branches, never on `main`.
