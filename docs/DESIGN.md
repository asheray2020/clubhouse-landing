# Design system — "The Scorecard"

## The idea

The visual language is **club print culture**: scorecards, tournament programs,
letterpress member stationery, locker-room plaques. Warm paper, navy ink, a
hunter green for action, gold as ornament.

This replaced a dark-navy-and-gold treatment that read as generic dark-mode SaaS
wearing a country-club logo. Two reasons for the flip, in order of importance:

1. **Readability.** The primary user is an athlete on a phone, frequently
   outdoors in daylight. A near-black page with 300-weight text is the worst
   case for that. Paper is the best case.
2. **Positioning.** Country-club luxury reads as cream, navy, and green —
   Augusta, a tournament program, engraved stationery. Dark navy with gold
   buttons reads as crypto.

A full dark theme is still provided via `prefers-color-scheme: dark`, on **warm
charcoal** rather than near-black navy.

## The two hard rules

Both come from measured failures in the previous build.

### 1. Every text colour clears 4.5:1 — in both themes

Large display type (≥ 24px, or ≥ 18.66px at weight ≥ 700) may sit at ≥ 3:1.

The old build's `--text-dim` measured **2.61:1** and was used for stat labels,
the marquee, footer links, footer copy, form notes, **and input placeholders**.
Its step numerals measured **1.31:1** — effectively invisible.

### 2. Body text never goes below `font-weight: 400`

Light weights **halate** on dark backgrounds: the bright text blooms into the
dark field, thickening apparent stroke gaps and mushing thin letterforms. It is
worst on OLED phones at low brightness. The old build set body copy at weight
300 and 14–15px, which is why it felt unreadable even where contrast passed.

Weight 300 is reserved for display type ≥ 32px, where stroke width carries it.

## Tokens

All tokens live at the top of `assets/css/main.css`. Contrast ratios below are
measured against the surface each token is actually painted on.

### Light (default)

| Token | Value | Role | Ratio |
|---|---|---|---|
| `--paper` | `#faf6ec` | page surface — warm ivory | — |
| `--paper-2` | `#f4eee0` | tinted sections, inputs | — |
| `--paper-3` | `#ece4d2` | the clubs band | — |
| `--ink` | `#16233a` | primary text — deep navy, never pure black | **14.61:1** |
| `--ink-2` | `#4a5670` | secondary text | **6.83:1** |
| `--green` | `#1d5340` | primary action | **8.25:1** |
| `--on-green` | `#faf6ec` | label on a green fill | **8.25:1** |
| `--gold` | `#8a6528` | ornament + small caps | **4.91:1** |

### Dark

| Token | Value | Role | Ratio |
|---|---|---|---|
| `--paper` | `#151a21` | warm charcoal | — |
| `--ink` | `#ede7da` | primary text | high |
| `--ink-2` | `#a7b0bf` | secondary text | **7.99:1** |
| `--green` | `#5fa783` | primary action | **6.11:1** |
| `--gold` | `#cfa95e` | ornament | **7.90:1** |

### About the gold

`--gold` is deliberately **darker than a decorative gold would be**, because it
is used for real text (the small-caps eyebrows) and has to clear 4.5:1 on paper.

**Gold is ornament only.** Never a button fill, never a large field. It works as
a hairline, a small-caps label, a left border, a diamond bullet. The previous
build used `#c8a96e` as the primary button fill; that colour cannot carry a
button on a light surface.

## Type

| | Family | Weights |
|---|---|---|
| Display | Cormorant Garamond | 500, 600 (+ italics) |
| Body | Outfit | 400, 500, 600 |

The fonts were never the problem and are unchanged from the previous build. Only
the weights and colours changed.

### Lining figures

Cormorant ships **old-style (text) figures** by default, which makes `01` read
as `oI` and mangles any number used as data. `.step-num`, `.stat-num`, and
`.rep-score` force lining + tabular figures:

```css
font-variant-numeric: lining-nums tabular-nums;
font-feature-settings: 'lnum' 1, 'tnum' 1;
```

### Scale

Fluid via `clamp()`. **The floors are tuned for a 375px phone** — the previous
build's floors resolved to desktop sizes on mobile (its hero computed to 48px at
375px wide, producing a four-line headline that pushed the CTA below the fold).

| Token | Value |
|---|---|
| `--fs-hero` | `clamp(2.25rem, 7.5vw, 4.25rem)` |
| `--fs-h2` | `clamp(1.75rem, 4.4vw, 2.75rem)` |
| `--fs-h3` | `clamp(1.125rem, 2vw, 1.3125rem)` |
| `--fs-lead` | `clamp(1rem, 1.6vw, 1.1875rem)` |
| `--fs-body` | `1rem` |
| `--fs-sm` | `0.9375rem` (15px) |
| `--fs-label` | `0.75rem` (12px) — small caps only, always ≥ 600 weight |

12px is the floor, and only for letterspaced small caps at weight 600 with a
high-contrast colour. No 11px text anywhere.

## Space

| Token | Value |
|---|---|
| `--sp-section` | `clamp(3rem, 8vw, 6.5rem)` |
| `--sp-gutter` | `clamp(1.25rem, 4vw, 2.5rem)` |
| `--measure` | `1120px` |
| `--nav-h` | `74px` |

`--nav-h` is a token because the logo is a **stacked lockup** (crest over
wordmark) at a 399:245 ratio. At the original 64px bar height it was cropped.
Three other rules derive from it — `scroll-padding-top`, the mobile menu's `top`,
and the hero's `padding-top` — so it must stay a single source of truth.

## Structure

The page treats athletes and clubs as **different people**, not mirrored
columns:

- **Athletes** — 18–22, phone, outdoors. Want money, housing, a good summer.
  Scam-wary, comparing this to Handshake and a group chat.
- **Clubs** — 35–65, desktop/iPad, conservative. Want to not get burned by a
  no-show hire. Trust signals are the entire sell.

Consequences:

- **One primary CTA in the hero**, not two competing equal buttons. Athletes are
  the volume side and get the primary; clubs get a clearly-styled secondary
  door plus their own full band with its own CTA.
- The clubs band gets its **own surface** (`--paper-3`) rather than a mirrored
  column, and leads with credentials rather than features.
- **"What does it cost" is answered prominently.** It is a top-two objection for
  a student. The old build buried "No fees. Ever." in 11px text at 2.61:1 beside
  the form; it now has a bordered callout of its own.
- The crawling marquee became a **static trust row**. It was 2.61:1, animated
  forever over a track 10.9× the viewport width, and unreadable while moving —
  worse on every axis than standing still.

## Performance budget

Enforce these on every change. See the "Never reintroduce these" section of
[../CLAUDE.md](../CLAUDE.md) for why each one exists.

| Budget | Limit | Now |
|---|---|---|
| Decoded bitmap, whole page | < 1 MB | **0.37 MB** |
| Same-origin transfer | < 100 KB | **~45 KB** across 5 requests |
| Elements with `mix-blend-mode` | **0** | 0 |
| Infinite animations | **0** | 0 |
| `backdrop-filter` at ≤ 768px | **none** | none |
| Raster larger than 2× its rendered size | **0** | 0 |
| Horizontal overflow at 375px | **none** | none |

For reference, the previous build was a single 166 KB HTML file carrying
**~12.6 MB** of decoded bitmap.

## Motion

- Everything is behind `prefers-reduced-motion`.
- The reveal animation is **additive**: JS adds `.reveal-ready`, so with JS
  disabled or broken the content is simply visible.
- A **1.6 s failsafe** reveals everything unconditionally. A hidden or throttled
  tab freezes transitions, and anything the IntersectionObserver never reported
  on would otherwise stay at `opacity: 0` forever. Content being visible always
  beats content being animated.

## Accessibility floors

- Skip link to `#main`.
- Every input has a real `<label>` — never placeholder-only.
- Form status regions are `role="alert"` + `aria-live="polite"`.
- The mobile menu button carries `aria-expanded` and `aria-controls`; Escape
  closes it and returns focus.
- Visible `:focus-visible` ring on everything interactive.
- The logo is a decorative `<span>`; its accessible name comes from the parent
  link's `aria-label`.
- The reputation bars are decorative — the numeric score is real text beside
  them, so the meaning does not depend on the bar.
