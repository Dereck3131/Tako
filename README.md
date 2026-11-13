# tako

**Split the bill. Keep the friends.**

A bill-splitting mobile & web app built with **Expo Router**, **React Native Reanimated + SVG**, and **Supabase**.

## Features

- **Animated Tako Mascot & Intro Splash** — Recreated from `design-reference/` in Reanimated + `react-native-svg`, featuring all 7 mascot states (`idle`, `wave`, `celebrate`, `think`, `coins`, `peek`, `sleep`), radial ambient glow, light/dark themes, and reduced-motion support.
- **Groups & Invite Codes** — Create expense groups with custom icons, add friends, or join existing groups via a 6-character invite code / QR card.
- **Equal & Exact Splits** — Log `₱` expenses with categories, payer selection, and equal (remainder-safe) or exact per-person splits.
- **Simplified Settle Up** — Automatically computes net balances and minimizes the number of transfers needed to settle a group, with 1-tap settlement recording.
- **Supabase Auth & RLS** — Email/password authentication and guest sign-in backed by Row Level Security.

## Project Structure

```text
src/
├── app/
│   ├── _layout.tsx            # Root layout, Nunito font loading, Splash & Auth gate
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Bottom tabs (Groups, Tako)
│   │   ├── index.tsx          # Groups list, Create Group & Join by Code modals
│   │   └── mascot.tsx         # Interactive Tako mascot playground, theme & profile
│   └── group/
│       ├── [id].tsx           # Group detail, balances, Settle Up, QR invite modal
│       └── add-expense.tsx    # Add expense modal (equal & exact splits)
├── components/
│   ├── AmbientGlow.tsx        # Radial SVG gradient glow
│   ├── AuthScreen.tsx         # Sign in / Sign up / Guest screen
│   ├── QRCodeCard.tsx         # Deterministic invite QR card
│   ├── TakoMascot.tsx         # 7-state animated SVG mascot
│   └── TakoSplash.tsx         # Animated "tako" splash sequence
├── constants/
│   └── theme.ts               # Light/Dark palettes, Nunito fonts, formatPeso()
├── context/
│   ├── AuthContext.tsx        # Supabase session & profile state
│   └── ThemeContext.tsx       # System / Light / Dark theme preference
├── lib/
│   ├── split.ts               # splitEqually, computeMemberBalances, computeSimplifiedDebts
│   └── supabase.ts            # Supabase client with safe AsyncStorage persistence
└── types/
    └── tako.ts                # TypeScript domain types
```

## Supabase Setup

Connected to Supabase project `jdwoszkyonkzxhgzfgnb` via `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://jdwoszkyonkzxhgzfgnb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_eYxe9Ek9ojWEJZoX1ewJcw_EvCtQAlE
```

Database tables (`public` schema, RLS enabled):
- `profiles` (auto-created via `handle_new_user` trigger)
- `groups`
- `group_members`
- `expenses`
- `expense_splits`
- `settlements`

RPCs & helpers:
- `is_group_member(gid uuid)`
- `join_group_by_code(p_code text, p_member_name text)`

## Running Locally

```powershell
npm start
```

- **Phone (Expo Go):** Scan the terminal QR code (or run `npx expo start --tunnel` if LAN is blocked).
- **Web:** Press `w` or run `npm run web`.
- **Android Emulator:** Press `a` or run `npm run android`.

## Checks

```powershell
npx tsc --noEmit
npx eslint src
```
