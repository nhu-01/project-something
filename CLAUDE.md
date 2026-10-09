# spotholes

An interactive map website that tracks potholes around New York City. Each pin on
the map is one pothole. Visitors scroll through an introduction, explore the map,
and click a pin to open a view of that pothole with photos, status, and report
date. The site has smooth scroll animations, and it opens with a short animation
of a taxi driving over a pothole while a "bonk!" pops up.

@DESIGN.md

Visual reference: `docs/mockup.png`. Match its colors, layout, and feel. Where
DESIGN.md and the mockup differ (for example, the mockup shows numbered pins and
a route line and a taxi on the map), DESIGN.md wins.

## Scope: front end only, for now

We are building only the user interface. Other work (a backend, the Gemini API,
a live map feed, and datasets) will be connected later.

- Build no backend, database, authentication, or API routes.
- Do not call any external API or dataset. Do not add API keys anywhere.
- Never put an API key or secret in browser code. When Gemini is added later,
  its calls will go through server-side code only.
- All data flows through one data layer (see "Data" below), so the real sources
  can be swapped in later without changing any component.
- The map must take its potholes as input (a hook or props), so a live feed can
  replace the demo data later. Do not build live updates now.

## Stack

- Next.js (App Router) with TypeScript in strict mode
- Tailwind CSS
- Leaflet for the map and Leaflet.markercluster for grouping pins, both installed
  from npm (not a CDN)
- GSAP (ScrollTrigger) with `@gsap/react`, plus Lenis for smooth scrolling
- `next/image` for all photos

Do not add any other dependency without asking me first.

## Commands

```bash
npm run dev            # start the dev server
npm run build          # production build
npm run lint           # lint
npx tsc --noEmit       # type check (build may not catch type errors)
```

## Project layout

```
app/                       routes and layouts
components/
  map/                     map, pins, clusters, legend, controls
  pothole-panel/           the view that opens when a pin is clicked
  gallery/                 photo carousel and lightbox
  intro-scene/             the taxi, pothole, and "bonk!" intro animation
  sections/                page sections (hero, route strip, and so on)
data/mock-potholes.ts      demo data (the only file that holds fake records)
lib/
  data/                    the data layer: the only code that components use to get potholes
  tokens/                  design tokens from DESIGN.md
public/images/potholes/    photos, one folder per pothole id
docs/mockup.png            approved visual reference
```

## Data

Components never import `data/mock-potholes.ts` directly. They get potholes
from `lib/data/` (for example `getPotholes()` and a `usePotholes()` hook), which
returns typed `Pothole[]`. Today that layer reads the demo file. Later it will
read from real sources, and nothing else should need to change.

```ts
type Status = 'open' | 'in-progress' | 'repaired'

type Pothole = {
  id: string                // url-safe, matches the photo folder name
  status: Status
  address: string           // street address or intersection
  neighborhood: string
  borough: string
  lat: number
  lng: number
  reportedAt: string        // ISO date
  repairedAt?: string       // ISO date, only when repaired
  description?: string
  photos: { src: string; alt: string }[]
  assessment?: {            // reserved for later AI output
    severity: 1 | 2 | 3 | 4 | 5
    note?: string
  }
  mock?: boolean            // true on every demo record
}
```

Demo data rules:
- Create 30-60 demo potholes with plausible NYC coordinates, across all five
  boroughs, mixing the three statuses.
- Mark every demo record `mock: true` and add a comment at the top of the file
  saying the data is fake.
- Use clearly marked placeholder images until I provide real photos.
- Show the "Demo data" chip on the map while any record is mock (see DESIGN.md).
- Never present demo data as real. Never invent real addresses of real reports.

## Code rules

- Keep components small and single-purpose. Split anything over about 150 lines.
- No `any`. Type props and data explicitly.
- Use the color, spacing, and type tokens from DESIGN.md. No magic numbers or
  hard-coded colors.
- Put animation logic in dedicated hooks or files, not scattered through JSX.
  The intro animation's timeline lives in `components/intro-scene/`.
- Leaflet needs `window`, so load the map component client-side only
  (`dynamic` with `ssr: false`).
- The map container needs `data-lenis-prevent` while it is active, so Lenis does
  not fight the map's own scroll and zoom.
- In the intro scene, only the taxi, the impact lines, and the "bonk!" animate.
  Draw the skyline, street, and pothole as static elements and never animate them.
- Draw the taxi and all icons as original SVG. No real logos, transit marks, or
  copyrighted artwork.
- Comments explain why, not what.
- Accessibility is required: alt text, keyboard access, visible focus, status
  shown as text as well as color, and `prefers-reduced-motion`.

## Workflow

1. For any new feature, give me a short plan first and wait for my approval.
2. Build in this order, one step at a time:
   1. page structure and design tokens (nav, hero, route strip, checker strip)
   2. the data layer and demo data, then the map with pins, clusters, legend,
      and the pothole panel
   3. scroll animations
   4. the intro animation: the taxi, the pothole, and the "bonk!" (see DESIGN.md)
3. Before using a library API (Leaflet, markercluster, GSAP, Lenis, Next.js), look
   up the current docs with Context7. Do not rely on memory.
4. After each step, run `npm run lint` and `npx tsc --noEmit`. Fix problems.
5. Then check it in a real browser with Playwright: open the page at 1440px and
   390px wide, take screenshots, check the console for errors, and click a pin to
   confirm the panel opens. For the intro animation, also check that it plays
   once, that the page does not jump when it finishes, that the headline is
   visible immediately, and test with reduced motion turned on.
6. Summarize what changed and what to check by hand. Make small, focused commits.

## Never

- Never edit or delete files in `public/images/`.
- Never skip the reduced-motion handling to save time.
- Never leave console errors or lint warnings behind.
- Never connect to a real data source or API unless I ask for it.
