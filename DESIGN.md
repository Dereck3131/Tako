# Tako Design System

Derived from `design-reference/tako-splash.html` and `design-reference/tako-animated-mascot.html`.

**Brand**: `tako`
**Tagline**: *Split the bill. Keep the friends.*
**Currency**: Philippine Peso (`₱`)

## Color Tokens

### Light (`#FAFAF7`)
| Token | Hex | Usage |
| --- | --- | --- |
| `bg` | `#FAFAF7` | App background |
| `surface` | `#FFFFFF` | Cards & sheets |
| `surfaceAlt` | `#F3F1E9` | Inputs & nested rows |
| `ink` | `#2B2B2B` | Primary text & wordmark |
| `mute` | `#6A6A6A` | Secondary text & labels |
| `glow` | `#E6E3D5` | Radial ambient glow center |
| `chip` | `#EEECE3` | Inactive pills & chips |
| `chipOn` | `#2B2B2B` | Active pill background |
| `chipOnInk` | `#FAFAF7` | Active pill text |
| `border` | `#E5E1D5` | Card & divider borders |

### Dark (`#1B1424`)
| Token | Hex | Usage |
| --- | --- | --- |
| `bg` | `#1B1424` | App background |
| `surface` | `#241B30` | Cards & sheets |
| `surfaceAlt` | `#2C2139` | Inputs & nested rows |
| `ink` | `#FFF6EE` | Primary text & wordmark |
| `mute` | `#B9ABC9` | Secondary text & labels |
| `glow` | `#2E2042` | Radial ambient glow center |
| `chip` | `#2C2139` | Inactive pills & chips |
| `chipOn` | `#FFF6EE` | Active pill background |
| `chipOnInk` | `#1B1424` | Active pill text |
| `border` | `#3A2C4D` | Card & divider borders |

### Brand & Mascot Accents
- Coral head: `#FF7A8A` (highlight `#FF9AA6`, cheeks `#FF9FAA`)
- Coral tentacles: `#F0627A` (suction cups `#FFB3BC`)
- Coral CTA / owes: `#E5405E`
- Plum eyes & mouth: `#2B1B3D`
- Teal settled / owed to you: `#2EC4B6`
- Gold `₱` coins & confetti: `#FFC857`
- Lavender think dots & `Z`s: `#B9A5E8`

## Typography

Font family: **Nunito** (`@expo-google-fonts/nunito`)
- `Nunito_600SemiBold` — body copy, hints, inputs (`16px` minimum on inputs)
- `Nunito_800ExtraBold` — labels, pills, buttons, taglines
- `Nunito_900Black` — `tako` wordmark, headings, `₱` totals

## Tako Mascot States (`TakoMascot`)

| State | Motion & Visual | Used When |
| --- | --- | --- |
| `idle` | Gentle vertical bob, tentacle sway, periodic blink | Default / settled groups |
| `wave` | Rightmost tentacle (`t5`) waves, faster bob | Onboarding, auth, empty states |
| `celebrate` | Jump with squash & stretch, open mouth, 8 confetti particles | Tap Tako, settle debt, success |
| `think` | Pupils scan, 3 lavender thinking dots | Loading / submitting |
| `coins` | 4 gold `₱` coins burst outward, pupils track coins | Active balances / splitting |
| `peek` | Rises from behind a QR card | Join by code & Invite QR modal |
| `sleep` | Squished eyes (`scaleY: 0.1`), slow breathe, floating `Z`s | Mascot playground |
