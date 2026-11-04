# TabTogether 📱💸

> **Real-time collaborative bill splitter for dining out with friends.**  
> Split items live, claim what you ate, adjust shares with intuitive sliders (always totaling 100%), and settle up in one tap.

---

## 🎨 Design & Visual Identity

TabTogether features a custom modern design matching the 13 designed screens:
- **Background**: Soft Canvas (`#F4F7FC`)
- **Cards**: Surface White (`#FFFFFF`) with ticket cutouts and perforated divider lines
- **Brand Primary**: Cobalt Blue (`#2F65F6`)
- **Settlement Hero**: Midnight Navy (`#0B1530`)
- **Accents & CTAs**: Amber Gold (`#FFA800`) for "Pay Now" and badges; Emerald (`#10B981`) for "Paid" and "Connected"
- **Typography**: Inter with heavy currency figures (e.g. **$310.00**, **$52.50**)
- **Avatars**: Memoji-style avatars with real-time network presence tags (`Live · Wi-Fi`, `Live · 5G`, `Joining…`)

---

## 📚 Complete Project Specifications & Architecture

Full architecture, product, and engineering documentation:

1. [**PRD.md**](./PRD.md) - Vision, target personas, user stories, MVP scope, non-goals.
2. [**FEATURES.md**](./FEATURES.md) - Acceptance criteria and edge cases for all 11 screens.
3. [**TECH_STACK.md**](./TECH_STACK.md) - Expo (React Native) + Supabase architecture decision & free-tier optimization.
4. [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Two-tier real-time sync (Broadcast + Postgres CDC) & conflict resolution.
5. [**DATA_MODEL.md**](./DATA_MODEL.md) - PostgreSQL DDL schemas (`rooms`, `items`, `item_shares`, `payments`).
6. [**SPLIT_LOGIC.md**](./SPLIT_LOGIC.md) - Exact integer cent arithmetic, Largest Remainder penny allocation, proportional tax/tip formulas.
7. [**API_REALTIME.md**](./API_REALTIME.md) - QR/PIN join protocol, Supabase RPC endpoints, and WebSocket channels.
8. [**SECURITY.md**](./SECURITY.md) - Row Level Security (RLS) policies, PIN rate-limiting, and P2P payment safety.
9. [**UI_PLAN.md**](./UI_PLAN.md) - Design tokens, screen-to-component mapping, ticket card specifications.
10. [**ROADMAP.md**](./ROADMAP.md) - 4-phase rollout plan starting from the thinnest working vertical slice.
11. [**TEST_PLAN.md**](./TEST_PLAN.md) - Math unit tests, dual-device real-time sync tests, and edge case matrix.
12. [**RISKS.md**](./RISKS.md) - Top technical risks and operational mitigations.

---

## 🚀 Mobile App Architecture

- **Client**: React Native / Expo SDK 51+ (TypeScript, Expo Router)
- **Styling**: Strict Design Tokens & `react-native-svg` (Ticket notch cards)
- **Backend / Realtime**: Supabase (PostgreSQL, Supabase Realtime Broadcast & Presence, Row Level Security)
- **State Management**: Zustand + TanStack Query

---

## 🛠️ Quickstart

### Prerequisites
- Node.js 18+
- Expo Go app on iOS or Android

### Installation
```bash
git clone https://github.com/Dereck3131/Tab-Together.git
cd Tab-Together
npm install
npx expo start
```
