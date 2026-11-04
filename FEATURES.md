# TabTogether - Screen-by-Screen Features & Acceptance Criteria (FEATURES.md)

> **Assumptions**:
> 1. Design specifications (colors `#F4F7FC`, `#2F65F6`, `#FFA800`, `#10B981`, 20-24px radii, pill buttons, ticket cards) are strictly adhered to across all screens.
> 2. Real-time updates propagate across all active clients within $< 300\text{ms}$.
> 3. Currency is rendered based on room locale (default `USD` with cent precision).

---

## Screen 1: Splash Screen
- **Visuals**: Cobalt blue background (`#2F65F6`), centered TabTogether logo, animated bill split icon, version number at bottom.
- **Features**:
  - Automatically checks stored session token (local secure storage).
  - Verifies network status.
  - Transitions to **Room Home** if user was in an active room within the last 24h, or **Onboarding** / **Log In** if no session exists.
- **Acceptance Criteria**:
  - [ ] App launches in under 1.5 seconds.
  - [ ] Valid session navigates directly to user's dashboard or last active room.
  - [ ] Expired or missing session routes to Onboarding (first run) or Log In.

---

## Screen 2: Onboarding (3 Slides)
- **Visuals**: Light background (`#F4F7FC`), high-contrast illustrations, dot progress indicator, pill action buttons.
- **Slides**:
  1. *Slide 1*: "Split live together" (Subtext: Real-time room sync, see orders live as they are placed).
  2. *Slide 2*: "Claim what you ate" (Subtext: Drag intuitive sliders; pay only for your exact share).
  3. *Slide 3*: "Pay in one tap" (Subtext: Zero math headaches; instant settlement tracking).
- **Features**:
  - Swipe gestures and tap on "Next" / "Skip".
  - Slide 3 displays "Get Started" pill button leading to Sign Up / Log In.
- **Acceptance Criteria**:
  - [ ] Smooth 60fps horizontal paging.
  - [ ] "Skip" skips directly to Sign Up.
  - [ ] First-time flag saved locally so onboarding is shown only once unless reset.

---

## Screen 3 & 4: Log In & Sign Up
- **Visuals**: Clean card interface, Inter font, pill input fields, Cobalt primary action buttons.
- **Features**:
  - Social Auth (Apple Sign-In, Google Sign-In) and Email/Password.
  - "Continue as Guest" option with rapid avatar + nickname generation for instant dining table onboarding.
  - Form validation with inline error messages (e.g. invalid email format, password $< 8$ chars).
- **Acceptance Criteria**:
  - [ ] Guest creation takes $< 5$ seconds (enter nickname, pick avatar, land on room).
  - [ ] Auth tokens stored securely in keychain / EncryptedSharedPreferences.
  - [ ] Seamless account upgrade from Guest to full account without losing room history.

---

## Screen 5: Room (Home Dashboard)
- **Visuals**: 
  - Hero Card: Total room spend in heavy bold currency font (e.g. **$248.50**), with small subtitle "Subtotal + Tax & Tip".
  - Quick Action: Pill button `"Invite via QR"` with badge showing current guest count.
  - People Carousel: Horizontal scroll of Memoji avatars with live online pulse indicators and current claimed subtotal.
  - Live Item Feed: Scrollable list of ordered items, displaying price, claimant avatar badges, and status.
- **Features**:
  - Floating Action Button (FAB) `+ Add Item` to quickly append new items.
  - Pull-to-refresh for manual sync fallback.
  - Tap on any item opens the **Claim & Adjust** sheet.
- **Acceptance Criteria**:
  - [ ] Whenever another user adds an item or adjusts a slider, the Total Spend and item list update without screen jitter.
  - [ ] People carousel highlights active users currently viewing the room.
  - [ ] Tapping `"Invite via QR"` opens the Join QR modal.

---

## Screen 6: Join via QR & PIN
- **Visuals**: Ticket-notched modal card, large scannable QR Code, distinct 4-digit PIN block (e.g. `[ 4 ] [ 8 ] [ 2 ] [ 1 ]`), Live Guest List at the bottom.
- **Features**:
  - **Host View**: Displays room QR, 4-digit PIN, "Copy Link" button, and live list of guests as they enter.
  - **Guest View**: Built-in QR camera scanner with auto-focus and 4-digit keypad fallback.
  - Live haptic feedback on successful join.
- **Acceptance Criteria**:
  - [ ] QR scan resolves in $< 500\text{ms}$ and routes directly to the room.
  - [ ] Entering 4-digit PIN automatically submits when the 4th digit is typed.
  - [ ] Rate limits prevent more than 5 incorrect PIN attempts within 5 minutes.

---

## Screen 7: Items Screen
- **Visuals**: Header with Segmented Filter Pills (`All` / `Unclaimed` / `Mine`), search bar, ticket-style item cards.
- **Badges**:
  - Amber badge (`#FFA800`): `Unclaimed` or `Partially Claimed (65%)`.
  - Emerald badge (`#10B981`): `Fully Claimed (100%)`.
  - Blue badge (`#2F65F6`): `Claimed by You`.
- **Features**:
  - Filter items dynamically by status.
  - Quick-claim toggle: tap checkbox or avatar to instantly claim 100% if unclaimed.
  - Swipe-to-delete / edit (host or item creator only).
- **Acceptance Criteria**:
  - [ ] Filter tab changes render instantly ($< 16\text{ms}$).
  - [ ] If an item is 100% claimed, its status changes to Emerald badge immediately on all connected devices.
  - [ ] Empty state appears when filter returns no items (e.g. "No unclaimed items! All dishes are taken 🎉").

---

## Screen 8: Claim & Adjust Screen
- **Visuals**: 
  - Top ticket card: Header `RECEIPT · FRIDAY NIGHT DINNER #0412`, itemized list (`Burgers x4 $120.00`, `Drinks x6 $60.00`, `Fries x2 $30.00`), heavy `Total $210.00`, notched divider with bottom retail barcode graphic.
  - Middle: Section *"Who is sharing Burgers • Live"*. Per-person % sliders with person avatar, name (`You`, `Mia`, `Jonas`, `Aly`), current percentage (`25%`), and dollar share (`$30.00`).
  - Bottom: Sticky cobalt pill button `"Confirm split"`.
- **Features**:
  - Dragging a slider updates the percentage and recalculates others' shares in real time so the total always equals 100%.
  - Locked sliders hold their percentage while others adjust.
  - Ephemeral slider presence broadcast: other users see a subtle glow or indicator showing who is currently adjusting the item.
- **Acceptance Criteria**:
  - [ ] The sum of all shares on an item strictly equals 100.00% (or 10,000 basis points).
  - [ ] Leftover cents are allocated deterministically (see `SPLIT_LOGIC.md`).
  - [ ] Sliders debounce real-time database commits (150ms) while sending local broadcast frames at 60fps.

---

## Screen 9: Settlement ("Settle up") Screen
- **Visuals**:
  - Top Ticket Card: Section `YOUR ITEMS · 25% EACH` (`Burgers $30.00`, `Drinks $15.00`, `Fries $7.50`), perforated divider line, section `THE ROOM` with live member payment status (`Mia Paid` in Emerald `#10B981`, `Jonas Paid` in Emerald, `Aly Pending` in Amber `#FFA800`).
  - Bottom Hero Ticket Card (Midnight Navy `#0B1530`): Label *"Your share to pay"*, heavy white currency **$52.50**, subtitle *"Split 4 ways · Friday Night Dinner"*.
  - Primary CTA: **Vibrant Amber/Gold pill button `"Pay Now"` (`#FFA800`)**.
- **Features**:
  - Tap `"Pay Now"` triggers payment deep links (Venmo, Cash App, Apple Pay, Revolut) or in-app mock settlement sheet.
  - Real-time updates as members pay; guest status switches instantly from Amber `Pending` to Emerald `Paid`.
- **Acceptance Criteria**:
  - [ ] Sum of all member settlement shares equals the grand total bill (down to the exact cent).
  - [ ] Tapping "Pay Now" marks user as paid or opens the selected payment provider.
  - [ ] Host receives real-time visual indicator and activity event log entry.

---

## Screen 10: Activity Feed
- **Visuals**: 
  - Top: Settlement Progress Bar (`75% Settled - $180 / $240`).
  - Feed: Chronological reverse-sorted event stream with avatar badges and timestamps.
- **Event Types**:
  - `Item Added`: "Alex added 'Truffle Fries ($14.00)'"
  - `Item Claimed`: "Sam claimed 50% of 'Margherita Pizza'"
  - `Member Joined`: "Maya joined the room"
  - `Payment Made`: "Leo paid his share of $34.50"
- **Acceptance Criteria**:
  - [ ] Live incoming events animate smoothly into the top of the feed.
  - [ ] Progress bar updates reactively as members mark their shares as paid.

---

## Screen 11: Me (Profile & Settings)
- **Visuals**: User avatar with edit picker, display name, default payment handle settings (Venmo, Cash App, Revolut, Zelle).
- **Features**:
  - Set default tip percentage preference (15%, 18%, 20%, Custom).
  - Manage payment handles (saved to profile so hosts can be paid directly).
  - Room History archive (view past settled rooms).
  - App settings (haptic feedback toggle, dark mode preview placeholder, logout).
- **Acceptance Criteria**:
  - [ ] Updating payment handle syncs immediately across all active rooms where user is host.
  - [ ] Toggling haptic feedback toggles device vibration on slider and action snaps.
