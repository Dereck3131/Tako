---
name: Tako
description: Split bills, not friendships — warm thermal paper, bold plum ink, and coral octopus warmth for Philippine peso bill splitting.
colors:
  coral-cta: "#D92D4B"
  coral-cta-dark: "#E5405E"
  coral-mascot: "#FF7A8A"
  coral-tentacle: "#F0627A"
  coral-soft: "#FFE6EA"
  coin-gold: "#FFC857"
  coin-gold-soft: "#FFF4D4"
  plum-ink: "#2B1B3D"
  plum-deep: "#150C20"
  plum-bg-dark: "#1B1424"
  plum-surface-dark: "#211630"
  plum-mute: "#574B66"
  plum-mute-dark: "#C8BBD9"
  cream-paper: "#FAFAF7"
  cream-block: "#F5EFE2"
  surface-white: "#FFFFFF"
  border-paper: "#D9D0BE"
  border-plum: "#433259"
  settled-teal: "#2EC4B6"
typography:
  display:
    fontFamily: "Nunito, ui-rounded, 'SF Pro Rounded', system-ui, sans-serif"
    fontSize: "5.4rem"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Nunito, ui-rounded, 'SF Pro Rounded', system-ui, sans-serif"
    fontSize: "3.6rem"
    fontWeight: 900
    lineHeight: 1.03
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Nunito, ui-rounded, 'SF Pro Rounded', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "0em"
  handwritten:
    fontFamily: "Caveat, cursive"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0em"
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  sm: "8px"
  md: "16px"
  lg: "24px"
  phone: "40px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.coral-cta}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.plum-ink}"
    rounded: "{rounded.pill}"
    padding: "14px 20px"
    height: "52px"
  card-receipt:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.plum-ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  nav-pill:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.plum-mute}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
  input-field:
    backgroundColor: "{colors.cream-block}"
    textColor: "{colors.plum-ink}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
    height: "44px"
---

# Design System: Tako

## Overview

**Creative North Star: "The Barkada Receipt"**

Tako treats bill splitting like a friendly, tangible table artifact rather than a sterile finance dashboard. Warm thermal-paper creams meet deep midnight plum ink, anchored by a playful coral octopus mascot (`Tako`) and handwritten Taglish margin notes. Every screen and marketing stage feels printed, stamped, and passed across a dinner table—never assembled from generic SaaS templates.

Across both the Expo mobile app (`src/constants/theme.ts`) and the Next.js marketing site (`website/src/app/globals.css`), the palette stays intentionally tight: cream paper by lunch, deep plum by midnight, coral for action and mascot warmth, and coin gold for accents. Surfaces rely on crisp 2px ink borders and hard-offset ink shadows instead of blurry multi-layer drop shadows or neon pastel mesh blobs.

**Key Characteristics:**
- Warm thermal-paper light mode and deep plum dark mode with AA+ contrast in both themes
- Heavy rounded display typography (`Nunito`) paired with clean UI sans (`Plus Jakarta Sans`), handwritten `Caveat` margin notes, and tabular monospace receipt metadata
- Narrowed brand palette (coral, plum, cream, coin gold) with teal reserved strictly for settled/positive states in the mobile app
- Tactile hard-offset ink shadows and subtle paper grain texture on color blocks
- Centered stage compositions on the web and zero-latency, spring-driven micro-interactions (`transform` and `opacity` only)

## Colors

Tako's palette is built around four core voices—coral, plum, cream, and coin gold—with semantic teal reserved for settled balances in the app.

### Primary
- **Coral Action** (`colors.coral-cta` light / `colors.coral-cta-dark` dark): Primary download buttons, active indicators, owes-money badges, and primary emphasis on headlines.
- **Coral Mascot** (`colors.coral-mascot`) & **Tentacle Coral** (`colors.coral-tentacle`): Tako's body, tentacles, and the single soft ambient sun glow behind the mascot.
- **Coral Soft Tint** (`colors.coral-soft`): Subtle icon containers and soft badge backgrounds.

### Secondary
- **Coin Gold** (`colors.coin-gold`) & **Gold Soft** (`colors.coin-gold-soft`): Peso (`₱`) coin illustration, hand-drawn headline underline, and dark-mode receipt line codes.

### Tertiary
- **Settled Teal** (`colors.settled-teal`): Used exclusively inside the mobile app for settled bills and "you're owed" balances—kept out of marketing decoration.

### Neutral
- **Cream Paper** (`colors.cream-paper`) & **Warm Cream Block** (`colors.cream-block`): Light-mode page ground and textured hero/feature color blocks.
- **Pure Surface** (`colors.surface-white`): Elevated cards, receipts, QR frames, and pill containers in light mode.
- **Plum Ink** (`colors.plum-ink`): Primary text, mascot eyes/mouth, 2px borders, and hard-offset shadows in light mode.
- **Deep Plum** (`colors.plum-deep`), **Dark App Ground** (`colors.plum-bg-dark`), & **Dark Surface** (`colors.plum-surface-dark`): Dark-mode grounds and full-bleed dark closing sections.
- **Muted Plum** (`colors.plum-mute` light / `colors.plum-mute-dark` dark): Secondary copy, receipt timestamps, and inactive labels.
- **Paper Border** (`colors.border-paper` light / `colors.border-plum` dark): Dashed receipt dividers and card outlines.

### Named Rules
**The Four-Color Discipline Rule.** Stick to coral, plum, cream, and coin gold across marketing surfaces; never introduce unmotivated mint or lavender blobs.

**The Single Glow Rule.** At most one soft coral radial glow may sit behind Tako or the phone—never stack multi-color ambient blobs, and never let a glow cross readable body copy.

## Typography

**Display Font:** Nunito (fallback: `ui-rounded, "SF Pro Rounded", system-ui, sans-serif`)
**Body Font:** Plus Jakarta Sans on web; Nunito SemiBold (`Nunito_600SemiBold`) in the Expo mobile app
**Handwritten Accent Font:** Caveat (web marketing margin notes only)
**Label / Receipt Mono Font:** System monospace (`ui-monospace, SFMono-Regular, Menlo, monospace`) with `tabular-nums`

**Character:** Heavy, rounded Nunito headlines give Tako warmth and table-side friendliness, while crisp monospace receipt line items and handwritten `Caveat` Taglish notes add unmistakable human authorship.

### Hierarchy
- **Display** (`900` black, `clamp(2.55rem, 7.2vw, 5.4rem)`, line-height `0.98`, tracking `-0.035em`): Hero centerpiece headlines only, always `text-wrap: balance`.
- **Headline** (`900` black, `clamp(2rem, 5vw, 3.6rem)`, line-height `1.03`, tracking `-0.03em`): Centered section headings.
- **Title** (`800`–`900`, `1.125rem`–`1.5rem`, line-height `1.25`): Step cards, FAQ questions, and modal headers.
- **Body** (`500`–`600`, `1rem`–`1.125rem`, line-height `1.6`): Sublines and explanations, constrained to `44ch`–`56ch` for scanability; minimum `16px` on mobile inputs to prevent iOS zoom.
- **Handwritten Note** (`700`, `1.25rem`–`1.625rem`, line-height `1.1`): Short Taglish annotations (`<4` words) in Tako's voice (`"scan mo 'to"`, `"kahit sa basement"`, `"less chaos, more barkada."`).
- **Label / Receipt Line** (`700` mono, `0.75rem`, tracking `0.06em`, uppercase, `tabular-nums`): Receipt section headers, version metadata, and peso amounts.

### Named Rules
**The Tabular Peso Rule.** Every currency amount (`₱`) and version/size string uses `font-variant-numeric: tabular-nums` and integer cents (`amount_cents`) in app state.

**The Short-Note Rule.** Handwritten `Caveat` annotations stay under 4–5 words and never replace real body copy or UI labels.

## Layout

Marketing pages follow a **Centered Stages** vertical axis (`max-w-7xl` outer bounds, `max-w-3xl`–`max-w-5xl` centered focal stages, `max-w-[760px]` single-column FAQ) rather than repeated 50/50 left/right splits. Sections transition with subtle zigzag receipt-paper dividers and receipt line-item headers (`code · LABEL ······· amount`).

- **Desktop (`>= 1024px`):** Centered focal centerpiece (Tako + tilted phone, centered thermal receipt, centered interactive phone, or Eight Arms radial stage) flanked by tilted annotation cards on dashed curved SVG connectors.
- **Mobile (`< 768px`):** Everything stacks vertically on a single axis with zero horizontal overflow (`overflow-x: clip`), no sticky/pinned sections, hidden connector lines, and horizontal scroll-snap rows for multi-card previews. All interactive targets maintain a minimum `44px × 44px` hit area.

## Elevation & Depth

Tako uses a **crisp hard-offset ink shadow** vocabulary paired with subtle CSS paper grain (`.tako-grain`) on color blocks. Depth comes from clean ink offsets, 2px borders, and selective 3D perspective (`perspective: 1100px`) on the 4 hero orbit cards—never muddy drop shadows.

### Shadow Vocabulary
- **Card / CTA Offset** (`box-shadow: 4px 4px 0px #2B1B3D` light / `4px 4px 0px #09040F` dark): Primary CTAs, thermal receipts, and active step cards.
- **Compact Control Offset** (`box-shadow: 3px 3px 0px #2B1B3D` light / `3px 3px 0px #09040F` dark): Secondary buttons, tilted note cards, QR cards, and centered nav pill.
- **Phone Frame Offset** (`box-shadow: 8px 10px 0px #2B1B3D` light / `8px 10px 0px #09040F` dark): Device mockups on marketing stages.
- **Glass Orbit Surface** (`.tako-glass`): Semi-transparent surface with solid fallback and `backdrop-filter: blur(14px)` enabled only on desktop (`>= 768px`, max 4 elements per viewport).

### Named Rules
**The One-Shadow-Family Rule.** Use hard-offset ink shadows consistently across buttons, cards, and receipts; do not mix generic blurry SaaS card shadows on the same surface.

**The Composite-Only Motion Rule.** Continuous idle loops (Tako float, blink, wave, orbit drift, circular badge spin) run on pure CSS `@keyframes` using `transform` and `opacity` only, pausing off-screen and disabling completely under `prefers-reduced-motion: reduce`.

## Shapes

- **Pills (`9999px`):** Primary/secondary buttons, centered desktop nav container, and theme toggle.
- **Cards & Notes (`16px`):** Step cards, annotation notes, QR cards, and glass orbit frames—always framed with a `2px` ink border.
- **Thermal Receipts (`0px` corners + zigzag SVG dividers):** Sharp-cornered receipt slips with dashed horizontal rules (`border-dashed`) and subtle `1°–2°` editorial tilt.
- **Device Mockup (`40px` outer bezel, `32px` inner screen):** Held at a `4°` tilt in the hero stage.

## Components

### Buttons
- **Shape:** Full pill (`9999px`), minimum height `52px` (`min-h-13`) on hero CTAs and `44px` (`min-h-11`) on utility controls.
- **Primary:** `Coral Action` fill, white bold text, `2px` plum border, `4px 4px 0px` ink shadow, tactile scale-down (`scale(0.97)`) on `:active`.
- **Secondary:** Pure white (or dark surface) fill, `Plum Ink` bold text, `2px` border, `3px 3px 0px` ink shadow.
- **Focus:** `2px solid` coral outline with `3px` offset (`:focus-visible`).

### Glass Orbit Cards
- **Style:** `.tako-glass` (`16px` radius), `124px–136px` wide on desktop, cropping real app screenshots (`new-split`, `scan-to-join`, `activity`, `profile`) with descriptive `alt` text and an `11px` Nunito black label.
- **Behavior:** 2 cards behind (`translateZ(-36px)`), 2 in front (`translateZ(34px)`), gentle CSS vertical drift, collapsing into a native horizontal scroll-snap strip on mobile.

### Receipt Line Headers & Notes
- **Receipt Header:** Monospace `code · LABEL` + flexible dotted leader (`border-b-2 border-dotted`) + right-aligned tabular amount.
- **Annotation Notes:** `16px` radius, `2px` border, `3px 3px 0px` offset shadow, `±2°` tilt, combining a crisp Nunito line with a `Caveat` Taglish accent, joined to the centerpiece by dashed SVG curves on desktop.

### Navigation
- **Desktop:** Sticky `64px` bar with Tako mark + wordmark left, centered pill link container (`How it works · Features · FAQ`), theme toggle and `Get Tako` pill right.
- **Mobile:** Logo left, theme toggle + `Get Tako` + `44px` menu trigger right opening a spring bottom sheet with focus trap and Escape handling.

### Inputs / Fields
- **Style:** `44px` minimum height, `16px` base font size, `Cream Block` / dark alt fill, `1px` paper/plum border, `12px` radius, coral caret.

### TakoMascot States (Mobile App & Web)
| State | Motion & Visual | Used When |
| --- | --- | --- |
| `idle` | Gentle vertical bob, tentacle sway, periodic blink | Default / settled groups & hero centerpiece |
| `wave` | Rightmost tentacle waves, faster bob | Onboarding, auth, empty states |
| `celebrate` | Jump with squash & stretch, open mouth, coral/cream/gold confetti | Tap Tako, settle debt, Final CTA |
| `think` | Pupils scan, thinking dots | Loading / submitting |
| `coins` | Gold `₱` coins burst outward, pupils track coins | Active balances / splitting |
| `peek` | Rises from behind a QR card | Join by code & Invite QR |
| `sleep` | Squished eyes (`scaleY: 0.1`), slow breathe | Empty state / playground |

## Do's and Don'ts

### Do:
- **Do** keep copy strictly factual: offline applies only to split calculations; never invent ratings, user counts, auto-sync, in-app payments, or unconfirmed pricing claims.
- **Do** use `transform` and `opacity` only for animations, with pure CSS keyframes for idle loops and full `prefers-reduced-motion` static fallbacks.
- **Do** keep real DOM text visible from first paint on headlines, sublines, and CTAs so LCP stays fast and accessible.
- **Do** verify AA contrast (`>= 4.5:1` body, `>= 3:1` large text) in both light cream and dark plum modes, including over watermarks and glass cards.
- **Do** store and calculate currency in integer cents (`amount_cents`) and render with `tabular-nums`.

### Don't:
- **Don't** fall back to symmetric 50/50 left-text / right-phone SaaS layouts on marketing sections.
- **Don't** stack multi-color ambient gradient blobs or add unmotivated mint/lavender decoration outside the app's settled-state semantics.
- **Don't** apply `backdrop-filter` to more than 4 elements or leave it enabled on low-end mobile devices without a solid fallback.
- **Don't** use `origin`, `originX`, or `originY` props on `react-native-svg` elements in the Expo app (apply pivot transforms inside `useAnimatedProps` instead).
- **Don't** show QR download codes on phone viewports where the visitor cannot scan their own screen.
