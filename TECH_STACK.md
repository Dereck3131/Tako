# TabTogether - Technology Stack Recommendation (TECH_STACK.md)

> **Student Developer Priorities**:
> 1. **Zero / Ultra-Low Cost**: Generous, permanent free tiers with no surprise billing.
> 2. **High Developer Velocity**: Minimal boilerplate, strong typing, single codebase for iOS and Android.
> 3. **First-Class Real-Time Sync**: Sub-second multi-client synchronization with presence and conflict resolution.
> 4. **Relational Math Integrity**: Bill splitting is relational data with exact integer arithmetic, foreign keys, and transactions.

---

## 1. Stack Comparison Matrix

| Evaluation Dimension | Option A: React Native (Expo) + Supabase | Option B: Flutter + Firebase | Winner |
| :--- | :--- | :--- | :--- |
| **Data Integrity & Relational Queries** | **PostgreSQL (ACID transactions, constraints, atomic RPCs)**. Items, shares, and rooms have strict relationships. | NoSQL (Firestore). Denormalized document tree; tricky transaction locks across multi-document splits. | **Option A** |
| **Real-Time Engine** | Supabase Realtime (Postgres CDC replication + WebSocket Broadcast & Presence channels). | Firestore Realtime listeners (`snapshots()`). Works well, but can cause rapid document read spikes. | **Tie** |
| **Free Tier Generosity** | **Supabase Free Tier**: 500MB database, 50,000 monthly active users, 200 concurrent real-time connections, unlimited API requests. | **Firebase Free (Spark)**: 50k reads/day, 20k writes/day. Collaborative slider drags can exhaust daily quotas quickly. | **Option A** |
| **Mobile Development Speed** | **Expo (React Native)**: Fast Refresh, Expo Go on physical device (no Mac required for Android / iOS testing via Expo Go), TypeScript ecosystem. | **Flutter (Dart)**: Fast compiled UI, but requires full local SDK setup, Gradle / CocoaPods management, and learning Dart. | **Option A** |
| **Figma to Code Translation** | NativeWind (Tailwind CSS for React Native) or StyleSheet maps 1:1 with Figma layout tokens, hex codes, and border radii. | Flutter layout widgets (`Container`, `Row`, `Column`, `BoxDecoration`) are verbose for custom ticket notched shapes. | **Option A** |
| **Offline & Reconnection** | TanStack Query + Zustand with AsyncStorage persistence; handles optimistic updates seamlessly. | Offline caching built into Firestore SDK. | **Tie** |

---

## 2. Final Stack Decision: Option A (Expo + React Native + Supabase)

### Why Option A is the Superior Choice for TabTogether:
1. **Financial Precision with SQL**: Bill splitting inherently requires strict consistency. If 4 people adjust shares simultaneously, PostgreSQL transactions (`SERIALIZABLE` or atomic RPC functions) prevent mathematically impossible states (like shares totaling 103%). Firestore NoSQL transactions on deeply nested documents are prone to contention failures.
2. **Firestore Free-Tier Quota Risk**: Dragging a percentage slider at 60fps emits dozens of state events per second. If each write hits Firestore, a single dinner party of 5 people could consume thousands of billable document writes in 10 minutes, burning through Firebase's 20,000 free daily writes. Supabase provides **Broadcast Channels** that stream ephemeral slider positions over WebSockets at zero database write cost, committing to Postgres only upon touch release.
3. **Expo Go for Fast Physical Device Testing**: As a student developer, you can immediately test the real-time two-phone experience by opening Expo Go on your phone and a friend's phone using a single QR code.

---

## 3. Detailed Component & Library Breakdown

### Client Application (Mobile)
- **Framework**: [Expo](https://expo.dev) SDK 51+ (React Native with TypeScript).
- **Navigation & Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing, native tab bar, ticket modals).
- **State Management**:
  - **Zustand**: Fast, lightweight global state for the active room session and local ephemeral UI states.
  - **TanStack Query (React Query v5)**: Server-state synchronization, cache invalidation, and optimistic mutations.
- **Styling & Design System**:
  - **StyleSheet with Strict Design Tokens**: Exact mapping to `#F4F7FC`, `#2F65F6`, `#FFA800`, `#10B981`, and `20-24px` radii.
  - **react-native-svg**: For custom ticket-style notched cards, QR codes, and custom icons.
- **Device Capabilities**:
  - `expo-camera` / `expo-barcode-scanner`: For scanning room QR codes.
  - `expo-haptics`: Tactical physical feedback when sliders snap to 25%, 33%, 50%, or 100%.
  - `expo-sharing` & `expo-clipboard`: For sharing room links and copying PINs.

### Backend & Cloud Services (Supabase Free Tier)
- **Database**: Managed PostgreSQL with Row Level Security (RLS) enabled.
- **Realtime**:
  - `postgres_changes`: Triggers client updates whenever `items`, `item_shares`, or `payments` rows change.
  - `Broadcast`: Low-latency peer-to-peer WebSocket messages for slider drag previews.
  - `Presence`: Real-time tracking of active room guests and who is viewing which item.
- **Auth**: Supabase Auth (Anonymous Guest Auth + Email / OAuth for permanent accounts).
- **Backend Logic / RPC**: PostgreSQL functions (PL/pgSQL) for atomic split recalculation and leftover cent distribution.
- **Hosting**: Supabase Cloud (Free tier hosted in AWS region close to you).
