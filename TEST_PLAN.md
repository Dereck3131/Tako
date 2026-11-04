# TabTogether - Quality Assurance & Test Plan (TEST_PLAN.md)

> **Assumptions**:
> 1. Unit tests run via Jest / Vitest.
> 2. Database constraints and RPCs are tested via Supabase pgTAP or Node.js integration tests.
> 3. Real-time multi-device tests run via automated integration scripts (simulated WebSocket clients) and physical dual-device manual testing.

---

## 1. Unit Test Suite: Split Logic & Math Precision

### Test Suite 1: Penny Allocation (Largest Remainder Method)
- **TC-1.1: Clean Equal Split**
  - *Input*: `$210.00` ($21,000$ cents) across 4 people ($25\%$ each).
  - *Expected*: Each gets exactly `$52.50` ($5,250$ cents). Sum $= 21,000$ cents.
- **TC-1.2: 3-Way Uneven Penny Split**
  - *Input*: `$100.00` ($10,000$ cents) across 3 people ($33.34\%$, $33.33\%$, $33.33\%$).
  - *Expected*: Shares are `$33.34`, `$33.33`, `$33.33`. Sum strictly equals `$100.00`.
- **TC-1.3: 7-Way Prime Split with Residual Cents**
  - *Input*: `$50.00` ($5,000$ cents) across 7 people equal share.
  - *Expected*: 5 people pay `$7.14`, 2 people pay `$7.15`. Total equals `$50.00` ($7.14 \times 5 + 7.15 \times 2 = 35.70 + 14.30 = 50.00$).

### Test Suite 2: Slider Delta Redistribution Invariant
- **TC-2.1: Two-Person Rebalancing**
  - *Scenario*: Alice and Bob share an item 50/50. Alice drags her slider to $70\%$.
  - *Expected*: Bob's slider immediately drops to $30\%$. Total is $100\%$.
- **TC-2.2: Locked User Preservation**
  - *Scenario*: Alice ($40\%$), Bob ($40\%$), Charlie ($20\%$, locked). Alice drags to $50\%$.
  - *Expected*: Charlie remains locked at $20\%$. Bob absorbs the full difference and drops to $30\%$.
- **TC-2.3: Boundary Clamping**
  - *Scenario*: Alice and Bob are locked at $50\%$ and $50\%$. Charlie attempts to increase his slider from $0\%$.
  - *Expected*: Slider rejects movement or alerts user to unlock another participant first.

### Test Suite 3: Proportional Tax & Tip Calculation
- **TC-3.1: Zero Consumption Attendee**
  - *Scenario*: Room subtotal is `$100`, Tax `$10`, Tip `$20`. User D claimed `$0.00` of food items.
  - *Expected*: User D owes `$0.00` food, `$0.00` tax, `$0.00` tip. Total owed $= \$0.00$.
- **TC-3.2: Unequal Subtotals**
  - *Scenario*: Alice has `$80` food, Sam has `$40` food. Total tax `$12`, tip `$21.60`.
  - *Expected*: Alice owes `$102.40`, Sam owes `$51.20`. Combined sum equals grand total `$153.60`.

---

## 2. Real-Time Synchronization & Concurrency Tests

| Test Case ID | Test Scenario | Execution Method | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **RT-CON-01** | **Concurrent Item Insertion** | Two clients click "Add Item" simultaneously at the same second. | Both items appear in the feed on both clients without duplicates or dropped records. |
| **RT-CON-02** | **Simultaneous Slider Contention** | Client A and Client B drag sliders for the same item at the same time. | Optimistic version check resolves gracefully; UI smoothly converges to the last valid committed state without infinite loops. |
| **RT-CON-03** | **Network Disconnect & Reconnect** | Client disconnects for 15 seconds during item claims, then reconnects. | Client re-subscribes, fetches the room bundle delta, and re-renders with 100% accurate state. |
| **RT-CON-04** | **Ephemeral Scrub vs DB Commit** | Client rapidly scrubs slider 50 times in 3 seconds. | 50 broadcast messages sent; only 1 debounced RPC write committed to PostgreSQL. |

---

## 3. End-to-End User Flow Acceptance Script

```mermaid
sequenceDiagram
    autonumber
    actor Host as 📱 Host (Alex)
    participant App as TabTogether System
    actor Guest as 📱 Guest (Sam)

    Host->>App: Creates room "Friday Pizza" (8.875% tax, 18% tip)
    App-->>Host: Generates QR & PIN: 4821
    Guest->>App: Scans QR code with camera
    App-->>Guest: Joins room; avatar appears in Host's People Carousel
    Host->>App: Adds "Pepperoni Pizza" ($24.00)
    App-->>Guest: Item appears live in feed
    Guest->>App: Adds "Caesar Salad" ($12.00)
    App-->>Host: Item appears live in feed
    Host->>App: Claims 100% of Salad
    Guest->>App: Splits Pizza 50/50 with Host
    Host->>App: Host taps "Review Settlement"
    App-->>Host: Total bill verified with tax & tip
    Guest->>App: Taps "Pay Now ($15.22)" via Venmo
    Guest->>App: Marks status "Paid"
    App-->>Host: Guest badge turns Emerald #10B981 "PAID"
    Host->>App: Host clicks "Close Room"
```

---

## 4. Edge Case Matrix

| Edge Case | Potential Failure | Enforced Mitigation |
| :--- | :--- | :--- |
| **Single Item, $0.01 Price** | Rounding to zero for split users. | Minimum item price is $0.01; if split, minimum allocation unit is 1 cent. |
| **Room With 0 Items** | Division by zero in tax/tip apportionment. | Apportionment guard: if `subtotal == 0`, return `$0.00` for all members without NaN errors. |
| **Host Closes App During Dinner** | Room lost or disconnected for guests. | Supabase database is cloud-persisted; room remains fully active even if host phone battery dies. |
| **Guest Exits Room Before Settling** | Abandoned unclaimed claims. | Host can remove member; shares automatically reset to unclaimed pool. |
