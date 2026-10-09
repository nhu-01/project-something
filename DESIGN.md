# Design system: spotholes

## Feeling
Calm, clean, and quietly clever. A warm paper background, near-black ink, lots of white space, soft pill shapes.
Lowercase voice. The interface stays out of the way; the road and the data are the stars. Reference feel: Julia's Time Machine
(juliastimemachine.tech), used with permission as a style reference. We build our own animations.

The product: **Pothole Copilot**. Riders mount a phone and tap start; the app spots potholes, warns by voice, and remembers
them so the next rider on the same path is warned (and their pass updates what we know). Everyone else follows progress on
a map. Tagline: *ride. the city remembers.*

## Tokens (define once in `globals.css`; never hard-code in components)
| Token | Value | Use |
|---|---|---|
| `--paper` | `#FAFAF7` | page background |
| `--ink` | `#20211E` | text, primary button |
| `--muted` | `#696B63` | secondary text |
| `--line` | `#E4E3DC` | hairlines, borders |
| `--sage` | `#D6DFCF` | selection, soft fills |
| `--moss` | `#42644C` | focus ring, "repaired" |
| `--card` | `#FFFFFF` | cards, sheets |

### Subway colors
The city's subway line colors are the only color on the site, used sparingly as small **bullets** (a colored circle with a
number), never as backgrounds or large fills:

| Use | Color |
|---|---|
| Severity 1 minor | lime `#6CBE45` (dark number) |
| Severity 2 light | yellow `#FCCC0A` (dark number) |
| Severity 3 moderate | orange `#FF6319` |
| Severity 4 serious | red `#EE352E` |
| Severity 5 severe | purple `#B933AD` |
| Repaired | blue `#0039A6` |
| Accent (wordmark dot, step and rider bullets) | red `#EE352E` |

Also defined as tokens: green `#00933C`, brown `#996633`, gray `#A7A9AC`, slate `#808183`, teal `#00ADD0`.
Rules: a bullet always carries its number or sits beside the word, so color is never the only signal. Repaired is blue,
not green, so it is never confused with a severity. These are plain colored circles; never use MTA logos or line letters.

## Type
Hanken Grotesk everywhere (via `next/font`). Mostly lowercase. Display `clamp(40px, 7vw, 84px)`, weight 500, tracking -0.03em.
Body 15 to 17px, line-height 1.6. Labels 12px, uppercase off, tracking 0.02em.

## Shapes and surfaces
Pill buttons and chips (radius 9999). Cards 24px radius, 1px `--line` border, no heavy shadows (one soft shadow allowed on floating sheets).
Primary button: ink fill, paper text. Secondary: outline. Hover lifts 2px over 180ms.

## Motion
Ease: `cubic-bezier(0.16, 1, 0.3, 1)` (expo out). Sheets rise ~14px and fade. Reveals once on scroll. Hero is an SVG route scene:
two riders pass along one street; the first leaves potholes behind, the second gets warned. Everything respects
`prefers-reduced-motion` (static scene, fades only). Animate only transform and opacity.

## Accessibility
Visible focus (moss ring), 44px minimum targets, status and severity always written as text, alt text on photos,
captions/voice never the only channel, safe-use warnings on the ride screen.

## Voice
Short, lowercase, calm: "start a ride", "pothole ahead, right lane", "looks repaired". Never present sample data as real.
