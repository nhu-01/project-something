# Design System: spotholes

## Purpose and feeling

spotholes is an interactive map that tracks potholes around New York City. Each
pin is one pothole. Visitors scroll through a short introduction, explore the map,
and click any pin to open a view of that pothole: photos, where it is, its status,
and when it was reported. (The name is "spot" plus "potholes": the site is about
spotting them.)

The feeling is New York wayfinding: bold, clear, fast, and a little playful.
Subway signage meets a taxi cab. Black, white, and one cab yellow. Photos are the
stars; the interface stays as simple and legible as a station sign.

Two motifs repeat across the whole site:
- **The route:** a line with stops that the visitor "rides" down the page.
- **The checker:** a black and yellow checkerboard strip, like the stripe on a cab.

The homepage opens with one animated scene: a taxi drives down a street, hits a
pothole, and a "bonk!" pops up. It is the site's joke and its mascot moment.

The site is front-end only for now and runs on demo data. Later it will connect
to datasets, a live map feed, and AI analysis (Gemini). The design reserves room
for those (see Map and Pothole view) but does not depend on them.

## Colors

Define these once as CSS variables. Never hard-code a hex value in a component.

| Token          | Value     | Use                                              |
| -------------- | --------- | ------------------------------------------------ |
| `--black`      | `#111111` | Text, headers, outlines, hero background         |
| `--white`      | `#FFFFFF` | Page and panel background, text on black         |
| `--paper`      | `#F2F2EE` | Alternate section background                     |
| `--yellow`     | `#FFC20E` | Fills and highlights only (never text on light)  |
| `--muted`      | `#5A5A55` | Secondary text on light backgrounds              |
| `--muted-dark` | `#A8A8A2` | Secondary text on black                          |
| `--track`      | `#3A3A37` | Inactive route line, and the road in the intro   |

Status colors, used for pins, the legend, and status chips:

| Status      | Color  | Value     | Text on it |
| ----------- | ------ | --------- | ---------- |
| Open        | Red    | `#D62E27` | white      |
| In progress | Orange | `#FF6319` | **black**  |
| Repaired    | Blue   | `#0039A6` | white      |

Green (`#00803A`) and purple (`#8A2A9A`) are reserved for future categories. Do
not use them yet.

Rules:
- Text on yellow and on orange is always black. Text on every other color is white.
- Yellow is never used as text on a white or light background. It is unreadable.
- Never rely on color alone. Status is always also written as text (in the
  panel, the name tag, and the legend).
- Red and green are never paired to mean bad and good. Some people cannot tell
  them apart. That is why "Repaired" is blue.
- No other colors. No gradients.
- The colors echo generic transit wayfinding. Never use the MTA logo, official
  line marks, or any real company's logo or artwork.

## Typography

- **Archivo** (weights 800 and 900): headlines, signs, buttons, cluster counts.
- **IBM Plex Mono** (400, 500): labels, stop codes, captions. Uppercase with
  0.08-0.12em letter-spacing.
- Load both with `next/font`. Never use a CDN stylesheet.
- The wordmark is "spotholes" in lowercase Archivo 800.

| Role        | Size                       | Weight  | Notes                               |
| ----------- | -------------------------- | ------- | ----------------------------------- |
| Display     | `clamp(56px, 10vw, 148px)` | 900     | line-height 0.95, tracking -0.045em |
| Heading     | `clamp(32px, 4vw, 52px)`   | 800     | tracking -0.03em                    |
| Panel title | 22px                       | 800     |                                     |
| Body        | 16-20px                    | 400     | line-height 1.5-1.6                 |
| Label       | 12-14px mono               | 400-500 | uppercase                           |

## Shapes and surfaces

- Circles for pins, stops, and bullets.
- Rectangles with a 4px radius for buttons and tags (like signs).
- 8px radius for cards and panels, each with a 3px solid black border.
- Flat. No blur, glass, soft shadows, or gradients.
- Page rhythm: black hero, then the checker strip, then paper and white sections.

## Layout and spacing

- Mobile-first. Breakpoints at 640px and 1024px.
- Maximum content width 1280px, with 40px side padding (20px on mobile).
- Spacing scale: 8, 16, 24, 32, 48, 96px. Use only these.
- Sections have 96px vertical padding on desktop and 64px on mobile.

## Components

- **Nav:** black, 72px tall. A yellow circle with a lowercase "s", the wordmark,
  and one yellow button, "Open the map".
- **Hero:** black background. At the very top, the intro scene (see Intro
  animation). Below it: a yellow mono eyebrow ("NEXT STOP"), a display headline
  with one word highlighted on a yellow block, and one call to action.
  Suggested headline: "Spot every pothole in the city." with "Spot" on the yellow
  block.
- **Route strip:** a horizontal line (10px thick) with four stops, 36px circles,
  one per page section. Done stops are yellow. The current stop is yellow with a
  double ring (black, then white). Upcoming stops are dark with a track-colored
  outline. Labels are mono, uppercase.
- **Checker strip:** 24px tall, 24px black and yellow squares. Divides the hero
  from the content.
- **Section header:** a 36px yellow circle with a 5px black border, then the
  heading, then a mono subtitle.
- **Buttons:** 4px radius, 2px black border, 44px minimum height. Primary is
  yellow with black text. Secondary is white. Arrows are inline SVG icons.
- **Status chip:** a small circle in the status color followed by the status
  written in mono uppercase text.

## Map

- Library: Leaflet, with clustering (Leaflet.markercluster).
- Tiles: muted grayscale, so the pins stand out. Always show the required
  attribution.
- **Pins:** one pin per pothole, a circle in its status color.
  - 44px tap target. Drawn as a 28px circle with a 3px white border and a 2px
    black outer ring.
  - **Selected pin:** 44px, same status color, 5px yellow border, 3px black ring,
    plus a black name tag below it (white text, 14px, weight 700, 4px radius)
    showing the street or intersection.
  - Each pin is a real `<button>`, keyboard focusable, with
    `aria-label="Pothole at [address], [status]"`.
  - Hover: scale to 1.1 over 180ms.
- **Clusters:** pins close together group into one 44px black circle with a white
  count in Archivo 900 and a yellow ring. Clicking it zooms in. There are likely
  hundreds of potholes, so clustering is always on.
- **No line between pins.** The pins are not a route.
- **Legend and filters:** three chips above the map (Open, In progress,
  Repaired), each a status circle plus text. Clicking a chip hides or shows pins
  of that status. All are on by default.
- **Controls:** white 44px squares with a 2px black border and 4px radius for
  zoom in and out. A black chip in the bottom-left reads "Click the map to
  explore".
- **Data chips (top-left):** while the site uses demo data, show a small black
  mono chip reading "Demo data". When a live feed is connected later, it is
  replaced by a "Live" chip with a small pulsing yellow dot.
- Scroll-wheel zoom is off until the visitor clicks or focuses the map, so the
  map never traps page scrolling.
- Clicking a pin: the map centers on it and the pothole view opens.

## Pothole view (what opens when a pin is clicked)

- Desktop: a panel next to the map, 340-440px wide, with a 3px black border.
- Mobile: a bottom sheet rising to 85% of the screen height.
- **Header bar:** black. A 40px circle in the status color, a mono "NOW VIEWING"
  label, the street address or intersection in white (22px, weight 800), and a
  44px close button with a 2px outline.
- **Body:** white, in this order:
  1. A mono "NEIGHBORHOOD · REPORTED DATE" line and the status chip.
  2. A large main photo (at least 220px tall) and three thumbnails (the selected
     one has a yellow outline).
  3. The description.
  4. An assessment block (severity and a short note). Reserved for later AI
     output: render it only when that data exists, otherwise show nothing.
  5. Two buttons: "Previous pothole" (white) and "Next pothole" (yellow). They
     step through the potholes currently shown, newest report first.
- Tapping the main photo opens a full-screen lightbox with arrow keys, swipe, and
  Esc to close.
- Photos use `next/image` with lazy loading and a placeholder. Every photo has
  meaningful alt text.
- Accessibility: focus moves into the panel when it opens and stays inside, Esc
  closes it, and focus returns to the pin that opened it.

## Motion

Motion guides attention. It never decorates. Each section gets at most one
standout moment.

| Kind                     | Duration     | Easing                           |
| ------------------------ | ------------ | -------------------------------- |
| Hover, press             | 150-200ms    | ease-out                         |
| Panel, sheet, lightbox   | 300-400ms    | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Scroll reveals           | 600-900ms    | `power3.out`                     |
| Staggered items          | 80ms between | `power3.out`                     |

- Smooth scrolling with Lenis, driving GSAP ScrollTrigger.
- **Hero:** the headline reveals line by line on load.
- **Route strip:** the yellow progress line fills as the visitor scrolls (tied to
  scroll position), and each stop lights up as it is reached.
- **Pins:** the first 20 pins in view drop onto the map one after another (80ms
  apart) the first time the map scrolls into view. The rest appear at once.
- **Section headings:** fade in and rise 24px as they enter the viewport.
- Optional, if it feels right: titles flip like a departure board before settling.
- Rules:
  - Animate only `transform` and `opacity`. Never width, height, top, or left.
  - Reveals play once.
  - Respect `prefers-reduced-motion`: turn off smooth scroll, parallax, and
    movement, and use simple fades instead.
  - Clean up every animation when its component unmounts.
  - Pause or skip heavy animation when offscreen or when the tab is hidden.

## Intro animation (the taxi and the pothole)

One animation, at the top of the homepage, above the headline. It plays once when
the page loads and tells the site's joke in a few seconds. It is the only taxi
animation on the site.

- **Scene:** a full-width band at the top of the hero (240px tall on desktop,
  160px on mobile). Inside it: a faint skyline silhouette, a street (a
  `--track` gray road with a yellow dashed center line), and one pothole in the
  road, about 62% of the way across.
- **Sequence** (about 4 seconds, plays once):
  1. The taxi drives in from the left edge and cruises toward the pothole
     (about 1.8s, ease-in).
  2. Its front wheel drops into the pothole and the taxi jolts: the body lifts
     and tilts nose-up a few degrees, with short white impact lines beside the
     wheel (about 0.3s).
  3. "BONK!" pops up above the taxi: a cab-yellow starburst with a 4px black
     outline and black Archivo 900 text, tilted -8 degrees. It scales in with a
     slight overshoot, holds for about 0.8s, then fades.
  4. The taxi settles and drives off the right edge (about 1.2s, ease-out).
  When it ends, the street and pothole stay as a still scene, with no taxi.
- **What moves:** only the taxi, the impact lines, and the "BONK!" pop animate.
  The skyline, the street, the dashed line, and the pothole are static and never
  move or change.
- **Taxi look:** a flat side-view SVG, drawn from scratch. Cab yellow body, black
  outline matching the UI, a roof light, a checker stripe along the door, and
  spinning wheels. About 168px wide on desktop and 112px on mobile. No real taxi
  company logos, medallions, or copyrighted artwork.
- **Rules:**
  - Plays once per visit. No looping.
  - Reserve the band's height from the first paint so nothing jumps. The headline
    and the call to action are visible immediately and never wait for the
    animation.
  - Build it as one GSAP timeline. Animate `transform` and `opacity` only.
  - It is decorative: `aria-hidden="true"`, no interaction (`pointer-events: none`),
    and no sound.
  - Pause it if the tab is hidden, and clean it up when the page unmounts.
  - Reduced motion: no driving and no bonk. Show the still street with the taxi
    parked at the right side of the scene.

## Voice

Short and direct, in wayfinding language: "Open the map", "Scroll to ride the
route", "Next pothole". Sentence case. The wordmark is lowercase. Street names
keep their capitalization. Never present demo data as real.

## Do and don't

- Do keep photos large. They are the content.
- Do keep the interface flat, high-contrast, and sign-like.
- Do reuse the route and checker motifs instead of inventing new decorations.
- Don't use more than one accent (yellow) outside the status colors.
- Don't use glass, blur, soft shadows, or gradients.
- Don't use more than two typefaces.
- Don't use motion that blocks reading or clicking.
- Don't use real logos, transit marks, or taxi company branding.
