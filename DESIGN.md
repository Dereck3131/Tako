---
name: TabTogether Design System
description: Impeccable real-time collaborative mobile dining & bill splitting interface.
colors:
  bg-app: "#F4F7FC"
  surface-card: "#FFFFFF"
  card-midnight: "#0B1530"
  primary: "#2F65F6"
  primary-light: "#EEF3FF"
  amber: "#FFA800"
  amber-text: "#B45309"
  amber-bg: "#FFF8EC"
  emerald: "#10B981"
  emerald-bg: "#E7F9F3"
  text-primary: "#0F172A"
  text-secondary: "#64748B"
  text-muted: "#94A3B8"
  text-white: "#FFFFFF"
  border: "#E2E8F0"
  border-dashed: "#CBD5E1"
typography:
  hero-currency:
    fontFamily: "Inter"
    fontSize: "40px"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-1.2px"
  card-title:
    fontFamily: "Inter"
    fontSize: "20px"
    fontWeight: 800
    letterSpacing: "-0.5px"
  body-bold:
    fontFamily: "Inter"
    fontSize: "15px"
    fontWeight: 700
  body-regular:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 500
  caption:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 700
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  card: "24px"
  sheet: "32px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-white}"
    rounded: "{rounded.pill}"
    padding: "16px 24px"
  button-pay-now:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "16px 24px"
  card-ticket:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.card}"
    padding: "20px"
  badge-emerald:
    backgroundColor: "{colors.emerald-bg}"
    textColor: "{colors.emerald}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  badge-amber:
    backgroundColor: "{colors.amber-bg}"
    textColor: "{colors.amber-text}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System

## Overview

TabTogether is designed for social group dining. Its visual world pairs clean modern fintech precision with paper-receipt tactile nostalgia. Interfaces are crisp, high-contrast, and optimized for loud, dimly lit restaurant environments.

## Colors

- **Canvas (`#F4F7FC`)**: Soft, clean background that gives high contrast to surface cards without visual fatigue.
- **Surface Cards (`#FFFFFF`)**: Pure white cards with soft ambient drop shadows (`0 4px 12px rgba(0, 0, 0, 0.05)`).
- **Brand Primary (`#2F65F6`)**: Cobalt blue conveying trust, speed, and active interaction.
- **Midnight Navy (`#0B1530`)**: Used on the Settlement hero ticket and modal overlays to create a powerful sense of finality and resolution.
- **Amber Gold (`#FFA800` & `#B45309`)**: High-energy accent reserved for the primary `"Pay Now"` CTA and pending/unclaimed warning states. Text uses `#B45309` for WCAG AA contrast.
- **Emerald Green (`#10B981`)**: Used exclusively for successful states (`Paid`, `Connected`, and live presence pulse dots).

## Typography

Typography relies on **Inter**, emphasizing extreme weight contrast:
- Currency numbers are set in `Inter-Black (900)` with tight negative letter tracking (`-1.2px`), making amounts instantly recognizable at arm's length.
- Body labels use `Inter-Bold (700)` and `Inter-Medium (500)`.
- Numeric prices in line items use tabular figures where supported to ensure clean decimal alignment.

## Layout

- **Ergonomic Thumb Zones**: Primary action buttons (`Confirm split`, `Pay Now`, `+ Add item`) are pinned to comfortable thumb reach zones at the bottom of the screen.
- **Minimum Touch Target**: Every interactive element (avatar, slider thumb, tab pill, checkbox) maintains a minimum bounding box of **$48 \times 48\text{px}$**.
- **Perforated Ticket Notches**: Cards use 10px semicircular edge cutouts and dashed lines (`#CBD5E1`) to separate line items from member claims.

## Elevation & Depth

- **Level 1 (Surface Cards)**: `shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8`
- **Level 2 (Hero & Floating Action Cards)**: `shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16`
- **Level 3 (Modal Sheets)**: Dark backdrop `#0B1530` with a 32px top-radius white sheet card.

## Shapes

- **Ticket Cards**: White rectangular cards with 24px corner radii and perforated side bite cutouts.
- **Pill Buttons**: Full pill radii (`9999px`) across all primary CTAs, filter tabs, and status badges.
- **Brand Mark**: Rounded squircle icon with interlocking circular discs (Cobalt & Amber).

## Components

### 1. `TicketCard`
Tactile card with top section, dashed perforation divider with semicircular bite notches, and bottom breakdown.

### 2. `SettlementHero`
Midnight Navy hero card with large white currency figure, split metadata, and high-visibility Amber `"Pay Now"` button.

### 3. `PercentageSlider`
Custom track with avatar handle, floating percentage tooltip on drag, and magnetic snapping at $20\%, 25\%, 33.3\%, 50\%, 100\%$.

### 4. `PeopleCarousel`
Horizontal scroll of table guests with live connection status dots and claimed subtotal pills.

## Do's and Don'ts

### Do's:
- **DO** use the Midnight Navy card (`#0B1530`) only for the Settlement summary to maintain its visual punch.
- **DO** use haptic ticks (`expo-haptics`) when sliders snap to standard fractions.
- **DO** ensure the sum of all shares on a line item strictly equals $100.00\%$.

### Don'ts:
- **DON'T** use light yellow text on light yellow backgrounds; always use `#B45309` on `#FFF8EC`.
- **DON'T** let slider handles cover the percentage or dollar amount while dragging.
- **DON'T** let users settle if unclaimed items remain without explicitly prompting a resolution.
