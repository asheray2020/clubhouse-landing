# The Club House — landing page

## What this is

The **marketing landing page** for The Club House: a two-sided marketplace that
matches college athletes with summer employment at country clubs, tennis
academies, golf resorts, pickleball clubs, and camps. Launch target is
**Summer 2027**.

Positioning line, used verbatim in the copy: *"Not a job board. A matching
platform."* The three pillars are intelligent matching (skill, coaching style,
personality, housing needs, culture), a **two-way reputation score** that
follows both athletes and clubs across seasons, and verified profiles
(references, video intros, SafeSport).

## This repo is NOT the product app

There are two separate codebases:

| | Where | What | Owner |
|---|---|---|---|
| **This repo** | `theclubhouse.io` (marketing) | Static landing page + waitlist | here |
| **The app** | `app.clubhouseplacement.com` | The actual product | a separate **Bolt**-built project |

**The app is out of scope for this repo.** Do not try to change product
behaviour here. The only link between them is the `Sign in` anchor in the nav
and footer, which points at `https://app.clubhouseplacement.com/login`.

If asked about migrating that app off Bolt, see
[docs/MIGRATING-OFF-BOLT.md](docs/MIGRATING-OFF-BOLT.md).

> **Unresolved:** the brand uses two domains — `theclubhouse.io` for the
> marketing site and contact email, `clubhouseplacement.com` for the app.
> `index.html` currently assumes `theclubhouse.io` is canonical in
> `<link rel="canonical">`, the OpenGraph tags, and the Twitter tags.
> Confirm before launch and update all three together.

## Constraints

- **No build step. No dependencies. No framework.** Hand-written HTML/CSS/JS.
  This is deliberate: the site is a static deploy and must stay one.
- The only external requests are **Google Fonts** (Cormorant Garamond, Outfit)
  and — once configured — the **Supabase REST endpoint**.
- Keep it deployable by dropping the directory on any static host.

## Layout

```
index.html               the whole page — one file, no templating
assets/css/main.css      design system + all styles (tokens at the top)
assets/js/config.js      runtime config — Supabase keys go here
assets/js/main.js        nav, anchor scrolling, reveal, form submission
assets/img/logo-mask.webp  the logo, as a single alpha mask (see below)
assets/img/logo-mask.png   same mask as PNG — kept as a source asset,
                           NOT referenced by the CSS and never served
assets/img/favicon.png     crest only, no wordmark
assets/img/og.png          1200x630 social card
docs/DESIGN.md           design tokens, scales, and the performance budget
docs/MIGRATING-OFF-BOLT.md  handoff for moving the product app to GitHub
.claude/launch.json      local preview server config
```

## Running it locally

```bash
python3 -m http.server 8765
```

Then open `http://localhost:8765`. It must be served over HTTP, not opened as a
`file://` URL — the CSS mask, the relative asset paths, and the form all depend
on a real origin.

## The logo is a CSS mask, not an image

`assets/img/logo-mask.webp` is a **white bitmap with a real alpha channel**. It
is applied with `mask` + `background-color: var(--logo-ink)`, so the mark
recolours itself for light and dark themes from **one** asset and one decode,
shared by all three placements (nav, hero, footer).

Two things to know if you touch it:

- **CSS `mask-mode` keys on alpha, not luminance.** A greyscale image with no
  alpha channel renders as a solid filled rectangle. If the logo ever shows up
  as a block of colour, this is why.
- The source art the mask was recovered from is **navy on solid black**, and it
  was originally hacked onto a dark background with `mix-blend-mode: screen`.
  Do not reintroduce that. The mask has true transparency now.

## Waitlist backend

The forms are **not** wired to anything until you fill in
`assets/js/config.js`. Until then they fall back to the existing Tally links —
so no lead is lost, and **no one is ever shown a false confirmation**.

To turn on real capture: Supabase dashboard → Project Settings → API, then copy
the Project URL and the **anon/public** key into `config.js`.

The anon key is designed to be public and shipped in client code. **Never put
the `service_role` key in this repo** — it bypasses every RLS policy and
`config.js` is served to every visitor.

### Required table and security

Run this **before** going live. Without it the waitlist is world-readable and
every signup's name, email, and university leaks:

```sql
create table if not exists public.waitlist (
  id           uuid primary key default gen_random_uuid(),
  role         text not null check (role in ('athlete','club')),
  name         text not null,
  email        text not null,
  organization text not null,
  category     text not null,
  created_at   timestamptz not null default now(),
  unique (email, role)
);

alter table public.waitlist enable row level security;

-- Anonymous visitors may INSERT and nothing else.
create policy "anon can join the waitlist"
  on public.waitlist for insert to anon with check (true);

-- Deliberately NO select/update/delete policy for anon.
-- Read the list with the service role or from the dashboard.
```

Verify it worked by confirming a read is refused:

```bash
curl "$SUPABASE_URL/rest/v1/waitlist?select=email" \
  -H "apikey: $SUPABASE_ANON_KEY"
# must NOT return rows
```

The `unique (email, role)` constraint makes a repeat signup return `23505` /
HTTP 409, which `main.js` deliberately treats as success — from the visitor's
point of view they are already on the list.

## Never reintroduce these

Each of these was measured in the browser on the previous build. Together they
produced the iOS Safari *"A problem repeatedly occurred"* tab reload that users
were reporting.

1. **Oversized bitmaps.** The old build inlined the same **1024×1024** JPEG
   three times as base64 and rendered it at 48px, 110px, and 52px — about
   **12.6 MB** of decoded RGBA for three thumbnails. It is now **0.37 MB**.
   Size rasters to their rendered size.
2. **`mix-blend-mode`.** Three elements had it; each forces its own composited
   layer that must be re-blended against the backdrop every frame. Now zero.
3. **A fixed full-viewport SVG `feTurbulence` overlay.** `numOctaves=4`,
   `position: fixed`, never scrolled away. Expensive to rasterize. Removed.
4. **`backdrop-filter` on mobile.** Continuous GPU readback. It is now behind
   `@media (min-width: 769px)` and an `@supports` check — desktop only.
5. **Permanently running animations.** The old marquee animated a track
   **10.9× the viewport width** on an infinite loop, forever, at 2.61:1
   contrast — a GPU cost *and* unreadable while moving. Now zero infinite
   animations.
6. **`overflow-x: hidden` on `body`** used to paper over a decorative element
   that overflowed. Fix the overflowing element instead; the page now has no
   horizontal overflow with `overflow-x: visible`.

Also avoid:

- **Text below `font-weight: 400`.** Light weights halate on dark backgrounds
  and turn to mush on phones. 300 is reserved for display type ≥ 32px.
- **Any text colour below 4.5:1.** The old build's `--text-dim` was **2.61:1**
  and was used for stat labels, the marquee, footer links, form notes, *and
  input placeholders*.
- **Hiding nav links with no replacement.** The old build set
  `.nav-links { display: none }` under 768px with no menu, so `Sign in` and
  `Join Waitlist` were unreachable on a phone.
- **Content that depends on JS to become visible.** The reveal animation adds
  `.reveal-ready` from JS and has a 1.6s failsafe that reveals everything
  unconditionally, so content can never be stranded at `opacity: 0`.

## Cascade traps in this stylesheet

Three real bugs came from element+class selectors outranking single-class
component selectors. If a component's colour or size looks wrong, check for this
before anything else:

- `.nav-links a` (0,2,0) beat `.btn-primary` (0,1,0) and repainted the CTA
  label in body-text colour against the green fill — **1.21:1**. Hence
  `.nav-links a:not(.btn)`.
- `.form-card > p` (0,1,1) beat `.label` (0,1,0) and stripped the eyebrow's
  gold and size. Hence `.form-card > p:not(.label):not(.form-note):not(.form-status)`.

## Verifying changes

Run the contrast audit and the crash-vector inventory in the browser after any
visual change. Both are scripted in the session notes; the checks that matter:

- Every text element ≥ 4.5:1 (≥ 3:1 for large display) in **both** themes.
- `mix-blend-mode` count is 0; infinite animation count is 0.
- `backdrop-filter` is `none` at 375px wide.
- No horizontal overflow at 375px.
- Clicking the nav logo produces **no** console error. `href="#"` used to throw
  a `DOMException` on every click because `document.querySelector('#')` is
  invalid; `main.js` now guards it and treats it as scroll-to-top.
- Submitting a form with a forced server error shows an error and does **not**
  show the success state.

## Deploying

Static host, no build. The repo currently has no CI and no deploy config —
GitHub Pages serving `main` at the repo root works as-is. Confirm the canonical
domain question above before pointing DNS.
