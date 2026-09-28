# CAMPNAV landing page — image generation prompts

Written for whoever is generating and placing the marketing photography.

Every prompt below is built for **one specific slot** on `src/app/(marketing)/page.tsx`.
Slots are listed in page order. Each entry gives the target file, aspect ratio,
pixel size, how it renders on the page, and the prompt.

---

## 0. Before you generate anything

### 0.1 The house style block

Prepend this to **every** prompt. It is what keeps twenty separately-generated
images looking like one photo shoot instead of a stock-library grab bag.

> Documentary editorial photograph, West Africa — Sierra Leone mining and energy
> work camp. Shot on a 35mm full-frame camera, 35mm or 50mm prime lens, f/2.8,
> natural available light, slight film grain, true-to-life colour. Warm neutral
> palette: laterite red earth, sun-bleached white and grey prefab panels, khaki
> and navy workwear, with occasional cobalt-blue accents (#2563EB). Restrained
> contrast, no HDR, no heavy vignette, no orange-and-teal grade. Candid working
> moment, not posed for camera. Predominantly Black West African people, real
> body types and ages, working expressions rather than stock-photo smiles.

### 0.2 The negative block

Append to every prompt (or paste into the negative prompt field):

> Negative: text, lettering, logos, watermarks, signage, readable UI, garbled
> screen content, fake app interfaces, extra fingers, distorted hands, plastic
> skin, beauty retouching, oversaturated HDR, teal-and-orange grade, lens flare,
> tilt-shift, fisheye, wide-angle face distortion, drone-toy look, staged
> handshake, thumbs up, white saviour framing, snow, pine trees, Western suburbia.

### 0.3 The screens rule — important

**Never let a generator render the CAMPNAV UI.** Every model produces garbled
fake interfaces that instantly read as AI. In each prompt below, phones and
tablets are described as *held at an angle where the screen is not legible* —
off-axis, glare-washed, or cropped. The real UI goes on top in code via the
existing `DeviceMock` component, or as a screenshot composited in Figma.

### 0.4 Model-specific switches

| Tool | Add |
| --- | --- |
| Midjourney v7 | `--style raw --ar <ratio> --q 2` — raw is essential, the default style is far too glossy for this |
| Flux 1.1 Pro / Flux dev | Nothing extra, it follows the prose well. Guidance 3.0–3.5 |
| Google Imagen / Nano Banana | Lead with `photorealistic, editorial photojournalism` |
| GPT-image / DALL·E | Drop the camera-spec sentence — it tends to render a visible camera |

### 0.5 Priority order

If you only generate six images, generate these — they carry the page:

1. `hero-backdrop` · 2. `impact-backdrop` · 3–5. the three `audience-*` portraits · 6. `og-cover`

---

## 1. Hero — background plate

| | |
| --- | --- |
| File | `public/marketing/hero-backdrop.jpg` |
| Size | 2400 × 1600 (3:2) |
| Renders in | `src/components/marketing/hero.tsx`, behind the existing `aurora` + `grid-lines` layers |
| Treatment | Full-bleed `object-cover`, `opacity-[0.14]` light / `opacity-[0.22]` dark, plus `mask-image: linear-gradient(to bottom, black 0%, transparent 85%)` so the copy stays legible. The `DeviceMock` phone stays on top — do not try to generate it. |

**Prompt**

> [house style block] Wide establishing shot of a modern modular work camp at
> early morning: two long rows of white and pale-grey prefab accommodation
> blocks with blue trim, raised on low concrete plinths, connected by covered
> walkways. Red laterite road running between them, still damp from overnight
> rain. Green tropical hills and low mist in the far background. Two or three
> workers in hi-vis vests walking between blocks, small in frame, slightly
> motion-blurred. Soft low-angle golden sunlight from camera left, long shadows.
> Composition deliberately open and uncluttered in the upper-left third so
> headline text can sit over it. Horizon low, sky occupying the top third.
> [negative block]

**Alt text** — `A modular work camp at sunrise, rows of accommodation blocks along a red laterite road.`

---

## 2. Hero — context card beside the phone *(optional)*

| | |
| --- | --- |
| File | `public/marketing/hero-context.jpg` |
| Size | 1200 × 1500 (4:5) |
| Renders in | `hero.tsx`, as a `rounded-3xl shadow-float` card tucked behind and right of `DeviceMock`, rotated ~4°, partially clipped by the phone |
| Treatment | `rounded-3xl`, `border`, `dark:brightness-90` |

**Prompt**

> [house style block] Vertical portrait-orientation photograph. A Sierra Leonean
> housekeeping supervisor in her thirties, navy polo uniform and a camp ID
> lanyard, standing in a bright corridor of a prefab accommodation block. She is
> looking down at a smartphone held at chest height, angled sharply away from
> camera so the screen is a pure white glare with no legible content. Natural
> light from a corridor window to her right. Shallow depth of field, corridor
> doors receding softly out of focus behind her. Calm, competent, mid-task
> expression. She fills the right two-thirds of the frame; the left third is
> clean out-of-focus corridor wall. [negative block]

**Alt text** — `A housekeeping supervisor checking an incoming request on her phone in a camp corridor.`

---

## 3. Platform section — before / after pair

These sit either side of, or directly above, the `Comparison` component in the
`#platform` section. Generate them as a **matched pair**: same room, same time of
day, same person where you can, so the contrast reads as *one camp before and
after* rather than two unrelated photos.

### 3a. Before

| | |
| --- | --- |
| File | `public/marketing/before-radio-paper.jpg` |
| Size | 1600 × 1200 (4:3) |
| Treatment | `rounded-2xl`, desaturated `grayscale-[0.35] saturate-75`, paired with the "Before CAMPNAV" column |

**Prompt**

> [house style block] Close-to-mid shot of a cluttered camp operations desk in a
> dim portacabin office. A worn handheld two-way radio lies next to a thick
> spiral-bound logbook filled with handwritten columns, a dog-eared clipboard, a
> chipped enamel mug and a scatter of loose carbon-copy job slips held down by a
> spanner. A whiteboard behind is covered in half-erased ghost writing. Single
> weak fluorescent tube overhead plus dull daylight through a dusty louvre
> window. Muted, slightly cool, tired atmosphere. No people, or at most an
> anonymous forearm reaching for the radio at the frame edge. [negative block]

**Alt text** — `A camp office desk with a two-way radio, paper logbook and loose job slips.`

### 3b. After

| | |
| --- | --- |
| File | `public/marketing/after-dispatch.jpg` |
| Size | 1600 × 1200 (4:3) |
| Treatment | `rounded-2xl`, full colour, paired with the "With CAMPNAV" column |

**Prompt**

> [house style block] The same portacabin office, now bright and ordered. A
> Sierra Leonean camp supervisor in a navy work shirt stands at a clean desk
> holding a tablet at a low angle so the screen is not readable — only a soft
> cool-blue glow reflecting up onto his face and the desk surface. The radio sits
> switched off and pushed to one side; the logbook is closed. Louvre window open,
> warm daylight flooding in from camera right. Calm, focused, in-control mood.
> Shallow depth of field on the supervisor, background softly out of focus.
> [negative block]

**Alt text** — `A camp supervisor coordinating the shift from a tablet at an organised operations desk.`

---

## 4. Module images — eight

| | |
| --- | --- |
| Files | `public/marketing/modules/<id>.jpg`, where `<id>` matches `MODULES[].id` in `content.ts` |
| Size | 1280 × 800 (16:10) |
| Renders in | `src/components/marketing/module-explorer.tsx` — as the header band of the active module's preview panel, or as a dimmed backdrop behind the preview rows |
| Treatment | `rounded-t-3xl object-cover`, with a `bg-gradient-to-t from-card` scrim at the bottom so the existing chips and rows stay readable |

> **Composition rule for all eight:** subject in the upper two-thirds, quiet
> uncluttered bottom third (that is where the scrim lands), horizontal rather
> than vertical emphasis.

### 4a. `requests.jpg` — Service requests

> [house style block] A resident's hand and forearm pushing open the door of a
> camp accommodation room from the inside, morning light spilling across a neatly
> made single bed, a folded towel stack and a small desk. A housekeeping trolley
> stacked with fresh linen waits just outside in the corridor. No faces visible.
> Quiet, early, un-rushed. Bottom third of frame is plain vinyl floor.
> [negative block]

### 4b. `dispatch.jpg` — Staff dispatch

> [house style block] Four Sierra Leonean camp staff in navy polos and hi-vis
> vests gathered in a loose semicircle at a shift handover outside a prefab
> block, shot slightly from the side. One is mid-sentence gesturing toward the
> accommodation rows; the others listen, one holding a phone down at his side,
> screen off. Early morning light, long shadows across red laterite ground.
> Natural group energy, nobody looking at camera. [negative block]

### 4c. `meals.jpg` — Meals & menus

> [house style block] Camp mess hall service line at dinner. A cook in white
> jacket, apron and hairnet ladles jollof rice and grilled chicken into a steel
> gastronorm tray under warming lamps, steam rising. Rows of long tables with
> stacked plastic trays recede softly out of focus behind. Warm tungsten and
> daylight mix. Shot from the diner's side of the counter at chest height.
> [negative block]

### 4d. `maintenance.jpg` — Maintenance

> [house style block] A camp maintenance technician in coveralls, ear defenders
> pushed up on his head and work gloves on, crouched beside a large diesel
> generator in an open-sided plant shed, checking a gauge. Clean, well-kept
> equipment — not a scrapyard. Strong directional daylight from the open side of
> the shed. Bottom third of frame is plain concrete floor. [negative block]

### 4e. `hse.jpg` — HSE & incidents

> [house style block] An HSE officer in a white hard hat and hi-vis vest with a
> reflective cross on the back, seen from behind at three-quarter angle, walking
> a safety inspection along a covered walkway between camp blocks. A yellow
> folding wet-floor cone stands in the mid-ground. Bright overcast light, even
> and shadowless. Serious, procedural mood. [negative block]

### 4f. `occupancy.jpg` — Rooms & occupancy

> [house style block] Exterior elevation of a two-storey prefab accommodation
> block shot straight-on and slightly telephoto, so the repeating rhythm of
> identical doors, windows and external staircases flattens into a graphic
> pattern. Pale grey and white panels, blue doors. A couple of windows lit from
> inside, most not. Late afternoon light raking across the facade. No people, or
> one tiny distant figure on a walkway for scale. [negative block]

### 4g. `updates.jpg` — Updates & activities

> [house style block] Camp recreation area at dusk: a group of residents and
> off-shift workers in casual clothes sitting on benches and plastic chairs
> around a covered outdoor deck, some talking, one checking a phone held low.
> String lights overhead just beginning to register against a deep blue-violet
> sky. Relaxed end-of-day atmosphere. Wide, warm, communal. [negative block]

### 4h. `reports.jpg` — Reports & billing

> [house style block] Over-the-shoulder shot of a camp manager in a light shirt
> at a desk in a bright site office, a laptop open in front of her at an angle
> where the screen is pure glare with no legible content. A printed spreadsheet
> and a pen sit beside it; a window behind shows the camp blocks softly out of
> focus. Cool daylight, clean uncluttered desk. [negative block]

---

## 5. How it works — three steps *(optional)*

| | |
| --- | --- |
| Files | `public/marketing/steps/step-1.jpg`, `step-2.jpg`, `step-3.jpg` |
| Size | 1200 × 675 (16:9) |
| Renders in | `sections.tsx` → `HowItWorks`, as a thin image band at the top of each numbered card, above the numeral |
| Treatment | `rounded-2xl h-32 object-cover`, numeral badge overlapping the bottom-left corner |

**step-1 — "We map your camp"**

> [house style block] Two people leaning over a large printed site plan spread on
> a table in a portacabin, one pointing at a block on the drawing with a pen. Only
> hands, forearms and the drawing are in frame — no faces. Daylight from a window
> to the left. The plan is a plausible abstract site layout of rectangles and
> access roads, with no readable text or dimensions. [negative block]

**step-2 — "Your people get access"**

> [house style block] Three camp staff in navy polos standing in a doorway, each
> holding their own phone at a natural downward angle, screens not legible. One
> is showing something to another who leans in to look. Warm daylight, informal
> training moment, easy body language. [negative block]

**step-3 — "Operations move online"**

> [house style block] A camp corridor in normal daily motion: a housekeeper
> pushing a linen trolley away from camera, a technician passing the other way
> with a toolbag, both slightly motion-blurred, the corridor itself sharp.
> Natural light from the far end. Everything running, nobody standing still.
> [negative block]

---

## 6. Audience cards — three portraits

| | |
| --- | --- |
| Files | `public/marketing/audiences/residents.jpg`, `staff.jpg`, `management.jpg` |
| Size | 1200 × 1600 (3:4) |
| Renders in | `sections.tsx` → `Audiences`, at the top of each of the three cards, above or replacing the current icon tile |
| Treatment | `rounded-2xl aspect-[3/4] object-cover`, with the existing `tile-3d` icon badge overlapping the bottom-left corner |

> Generate all three at the **same eye level and same subject distance** so the
> row reads as a triptych rather than three separate shoots.

### 6a. `residents.jpg` — Residents & guests

> [house style block] Vertical three-quarter portrait of a Sierra Leonean
> contract worker in his late thirties, off shift, wearing a plain t-shirt,
> seated on the edge of his bed in a tidy single camp room. Relaxed, one hand
> holding a phone loosely at his knee with the screen facing away from camera,
> looking off toward the window rather than at the lens. Soft late-afternoon
> window light from camera left. Room visible but softly out of focus: locker,
> desk, folded towel. Warm, human, unguarded. [negative block]

### 6b. `staff.jpg` — Camp staff

> [house style block] Vertical three-quarter portrait of a Sierra Leonean
> maintenance technician in her thirties, navy work shirt with sleeves rolled,
> gloves tucked into her belt, standing in an open-sided plant shed with a
> toolbag over one shoulder. Mid-task, glancing off camera to her right,
> confident and unposed. Strong natural side light. Equipment softly blurred
> behind her. [negative block]

### 6c. `management.jpg` — Camp management

> [house style block] Vertical three-quarter portrait of a Sierra Leonean camp
> manager in his forties, pressed light-blue shirt and a site ID lanyard,
> standing on an external walkway overlooking the accommodation blocks with one
> hand resting on the rail. Composed, thoughtful, looking out across the camp
> rather than at the lens. Early evening light. Camp rows softly out of focus
> below and behind him. [negative block]

---

## 7. Impact band — full-bleed backdrop

| | |
| --- | --- |
| File | `public/marketing/impact-backdrop.jpg` |
| Size | 2560 × 1100 (≈21:9) |
| Renders in | `src/components/marketing/impact-band.tsx`, behind the four counting stats |
| Treatment | Full-bleed `object-cover`, then a `bg-slate-950/70` scrim (light) / `bg-slate-950/80` (dark) so the heavy numerals hold contrast. This is the one image where **dark and quiet is the point** — the stats are the subject, the photo is texture. |

**Prompt**

> [house style block] Elevated wide shot of a work camp at blue hour, looking
> down the length of the accommodation rows from a slight height. Warm interior
> lights glowing in scattered windows and along the covered walkways, contrasting
> against a deep indigo-blue post-sunset sky. Red laterite roads reading almost
> black. Hills silhouetted behind. Very few visible people — one or two small
> figures under a walkway light. Panoramic, calm, low overall brightness with the
> light sources as the only bright points. Composition evenly weighted left to
> right with no single dominant subject, so overlaid text sits cleanly anywhere
> across it. [negative block]

**Alt text** — `A work camp at dusk with lit walkways between accommodation blocks.`

---

## 8. CTA band — backdrop

| | |
| --- | --- |
| File | `public/marketing/cta-backdrop.jpg` |
| Size | 2400 × 900 (8:3) |
| Renders in | `sections.tsx` → `CtaBand`, behind the aurora layer |
| Treatment | `opacity-[0.12]` light / `opacity-[0.20]` dark, radial mask fading from the edges so the centred headline and buttons sit on clean ground |

**Prompt**

> [house style block] Very wide, low-contrast shot of a camp access road at dawn,
> shot from ground level down its centre line. Prefab blocks fall away to both
> left and right in soft perspective. Light mist, pale sky, gentle warm light on
> the horizon. Deliberately empty and minimal — no people, no vehicles. The
> entire centre of the frame is open road and sky, quiet enough to place large
> text over. Airy, optimistic, forward-looking. [negative block]

**Alt text** — `An empty camp access road at dawn.`

---

## 9. Social share / OG image

| | |
| --- | --- |
| File | `public/marketing/og-cover.jpg` |
| Size | 1200 × 630 |
| Renders in | `openGraph.images` in the `src/app/(marketing)/page.tsx` metadata — currently not set, add it |
| Treatment | Photo plus the CAMPNAV wordmark and headline composited **in code or Figma**, never generated |

**Prompt**

> [house style block] Horizontal shot of a Sierra Leonean camp supervisor in a
> navy polo and hi-vis vest standing in an external walkway, phone held at waist
> height and angled away so the screen is not legible. He occupies the right
> third of the frame looking toward the left; the left two-thirds is open,
> softly-focused camp background — a clean area reserved for a logo and headline
> to be added later. Warm morning light, strong sense of depth. [negative block]

---

## 10. Implementation notes

1. **Store under `public/marketing/`.** Keep the folder structure above — the
   module filenames are keyed to `MODULES[].id`, so the explorer can resolve them
   as `/marketing/modules/${module.id}.jpg` with no extra mapping table.
2. **Use `next/image` with explicit `sizes`.** Backdrops are `fill` +
   `sizes="100vw"`, with `priority` on the hero only. Module and audience images
   are `sizes="(min-width: 768px) 33vw, 100vw"`.
3. **Compress before committing.** Target ≤ 200 KB for cards, ≤ 400 KB for
   full-bleed backdrops. Next will serve AVIF/WebP automatically at the default
   `next.config.ts` image settings.
4. **Dark mode.** Every backdrop needs a different opacity per theme (values are
   given per slot above). Card images want `dark:brightness-90` so they do not
   glare against the navy surface.
5. **Decorative vs meaningful.** Backdrops (hero, impact, CTA) are decorative:
   `alt=""` and `aria-hidden`. Module, audience and comparison images carry
   meaning — use the alt text supplied above.
6. **Generate 4 variants per slot, keep 1.** Especially the three audience
   portraits — hands and lanyards are where these models fail, and rerolling is
   faster than inpainting.
7. **Consistency check before committing.** Put all the finals side by side at
   thumbnail size. If one jumps out as brighter, cooler or glossier than the
   rest, regenerate rather than colour-correct — a drifted image usually means
   the house style block got dropped from that prompt.
