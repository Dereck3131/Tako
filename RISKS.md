# TabTogether - Risk Analysis & Mitigation Matrix (RISKS.md)

> **Assumptions**:
> 1. Target operating environment includes busy restaurants, basement bars, and noisy cellular environments with intermittent packet loss.
> 2. Primary risk exposure centers on mathematical accuracy, real-time concurrency, and user trust.

---

## 1. Top Technical & Product Risks

```mermaid
quadrantChart
    title Risk Impact vs Likelihood Matrix
    x-axis Low Likelihood --> High Likelihood
    y-axis Low Impact --> High Impact
    quadrant-1 High Priority (Immediate Mitigation)
    quadrant-2 Critical Architecture Gates
    quadrant-3 Low Priority
    quadrant-4 Medium Priority (Operational)
    "Real-Time Slider Race Conditions": [0.75, 0.85]
    "Penny Rounding Discrepancies": [0.60, 0.90]
    "Spotty Restaurant Network Drops": [0.85, 0.70]
    "PIN Brute-Forcing": [0.45, 0.65]
    "Supabase Free Tier Quota Exhaustion": [0.35, 0.75]
    "Payment Reconciliation Friction": [0.55, 0.40]
```

---

## 2. In-Depth Risk Analysis & Mitigation Playbooks

### Risk 1: Real-Time Slider Race Conditions & Jitter
- **The Problem**: If Alice and Bob both attempt to adjust percentages on the same shared item simultaneously, their sliders could fight, causing rubber-banding, UI flicker, or invalid total shares ($\ne 100\%$).
- **Likelihood**: High (very common when groups split food live).
- **Impact**: High (ruins user confidence in the app's calculation).
- **Mitigations**:
  1. **Dual-Tier Transport**: Stream live scrubbing over low-latency WebSockets (ephemeral broadcast) and commit to PostgreSQL only on touch release (with 150ms debounce).
  2. **Presence Locking**: When Alice touches a slider, emit a `SLIDER_ACTIVE` presence lock that displays a subtle visual glow with Alice's avatar to Bob, temporarily disabling conflicting slider edits.
  3. **Optimistic Versioning**: The server-side RPC `adjust_item_shares()` verifies the version tag. If stale, it rejects the write and sends the latest canonical state.

---

### Risk 2: Financial Rounding Errors ("The Missing Penny")
- **The Problem**: Dividing numbers like $\$10.00$ by 3 yields $\$3.3333...$. If rounded naively to $\$3.33$, the total is $\$9.99$, losing 1 cent. In a large bill, multiple line items can accumulate several missing or phantom cents.
- **Likelihood**: High (inherent to fractional division).
- **Impact**: High (users will not trust an app where the sum of parts does not equal the receipt total).
- **Mitigations**:
  1. **Zero Floats Policy**: All amounts stored and computed as integer cents and basis points.
  2. **Largest Remainder Method (Hare-Niemeyer)**: Formally applied to every item split and tax/tip distribution. Leftover cents are allocated deterministically (see `SPLIT_LOGIC.md`).
  3. **Automated Unit Testing**: Comprehensive test suite testing all divisions from 1 to 20 people across 1 to 10,000 cents.

---

### Risk 3: Restaurant Wi-Fi / Poor Cellular Connectivity
- **The Problem**: Dining venues frequently have weak indoor cellular coverage and spotty public Wi-Fi.
- **Likelihood**: High.
- **Impact**: Medium to High.
- **Mitigations**:
  1. **Local State Caching**: Local room state is stored in memory via Zustand and persisted to AsyncStorage.
  2. **Graceful Status Banner**: A discreet amber badge *"Reconnecting..."* alerts the user without freezing the UI.
  3. **Atomic Rehydration**: When connection is re-established, the app fetches a fresh full room snapshot via `get_room_bundle()` to immediately synchronize state.

---

### Risk 4: Supabase Free-Tier Quota Exhaustion
- **The Problem**: If slider drags trigger direct database writes, free-tier quotas (or CPU limits) could be exceeded during peak dinner testing.
- **Likelihood**: Medium.
- **Impact**: High (service degradation).
- **Mitigations**:
  1. **Broadcast vs Database Separation**: Continuous finger movements stream through Supabase Realtime Broadcast (in-memory WebSocket messages, not counted as DB writes).
  2. **Debounced DB Writes**: Database writes are strictly throttled to 1 write per user action release.

---

### Risk 5: 4-Digit PIN Brute-Force Exploitation
- **The Problem**: A 4-digit PIN has only 10,000 permutations. An attacker could script attempts against active room codes.
- **Likelihood**: Medium.
- **Impact**: Medium (privacy exposure of dinner receipts).
- **Mitigations**:
  1. **Strict Rate Limiting**: Limit to 5 incorrect attempts per IP per 5 minutes.
  2. **24-Hour Expiration**: Rooms automatically close after 24 hours, preventing historical scraping.
  3. **Room Salt Hashing**: PINs are never stored in plain text.
