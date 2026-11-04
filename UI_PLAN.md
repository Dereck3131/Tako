# TabTogether - Impeccable UI & Component Architecture (UI_PLAN.md)

> **Verified from Final Figma Designs (All 13 Screens)**:
> 1. Light background canvas (`#F4F7FC`), crisp white surface cards (`#FFFFFF`), Cobalt Blue (`#2F65F6`), Emerald Green (`#10B981`) for Connected/Paid, Amber/Gold (`#FFA800`) for Pay Now and Unclaimed/Pending, and Midnight Navy (`#0B1530`) for the Settle Up hero ticket.
> 2. Ticket notched cards with semicircular bite notches and dashed dividers, plus a simulated retail barcode on receipts.
> 3. Memoji avatars with live connection tags (`Live · Wi-Fi`, `Live · 5G`, `Joining…`).

---

## 1. Verified Design Tokens

### Color Palette
| Token Name | Hex Code | Purpose / Screen Location |
| :--- | :--- | :--- |
| `color-bg-app` | `#F4F7FC` | Canvas background across all screens |
| `color-surface-card` | `#FFFFFF` | Cards, modals, bottom sheets, ticket receipts |
| `color-primary-blue` | `#2F65F6` | Primary action buttons, active tab icons, brand squircle disc |
| `color-primary-blue-tint` | `#EEF3FF` | Active filter pill, `PIN: 4821` pill background |
| `color-hero-navy` | `#0B1530` | Settlement hero card & Onboarding slide 3 card |
| `color-accent-amber` | `#FFA800` | "Pay Now" CTA button, "NEW" badge, "Unclaimed" & "Pending" badges |
| `color-accent-amber-bg`| `#FFF8EC` | Background tint for amber badges |
| `color-status-emerald` | `#10B981` | "Paid" badge, "Connected" badge, live status pulse dot |
| `color-status-emerald-bg`| `#E7F9F3` | Background tint for emerald badges |
| `color-text-primary` | `#0F172A` | Primary headers, bold currency figures, card titles |
| `color-text-secondary`| `#64748B` | Subtitles, timestamps (`2m ago`, `just now`), connection indicators |
| `color-border-dashed` | `#CBD5E1` | Perforated receipt ticket dashed divider |

### Geometry & Radii
- `radius-pill`: `9999px` (Pill buttons: `Invite to Room via QR`, `Pay Now`, `Confirm split`, filter chips)
- `radius-card`: `24px` (Hero spend cards, item notched cards, bottom sheets)
- `radius-badge`: `10px` – `12px` (`Claimed`, `NEW`, `Unclaimed`, `Paid`, `Pending`)
- `radius-slider-track`: `6px` (Custom track with 24px thumb handle containing avatar)

### App Icon & Branding
- **Logo Mark**: White rounded squircle with two overlapping circular coins (left coin: Cobalt Blue `#2F65F6`, right coin: Amber Gold `#FFA800`).
- **Typography**: Inter (Weights: Regular 400, Medium 500, SemiBold 600, Bold 700, Black 900 for `$310.00` and `$52.50`).

---

## 2. Screen-by-Screen Component Breakdown (Figma Aligned)

### 1. Splash Screen (Page 8)
- Gradient Cobalt background with subtle radial watermarks.
- Center TabTogether overlapping coin logo + white bold typography.
- Floating Memoji avatars around canvas.
- Bottom 3-dot pagination indicator.

### 2. Onboarding (Pages 9, 10, 11)
- Top bar with blue `TabTogether` logotype and gray `Skip` action.
- Central preview cards:
  - *Slide 1*: Item ticket ("Truffle Burger x2", $36.00, "NEW") + live join pill ("• Aly joined the room Live"). Title: *"Split the bill, live and together"*.
  - *Slide 2*: Sliders card ("Burgers x4", $120.00, You 25% / Mia 25%). Title: *"Claim what you ate"*.
  - *Slide 3*: Midnight Navy hero card with bold `$52.50` and amber `Pay Now` button + "Mia Paid", "Jonas Paid". Title: *"Pay your share in one tap"*.
- Active indicator pill + two inactive dots.
- Bottom Cobalt pill button: `Next` / `Get started` + link `"I already have an account"`.

### 3. Log In & Create Account (Pages 12 & 13)
- Top header with coin logo mark.
- Card container with 24px top radius:
  - Text input pills with subtle borders and clear placeholders.
  - Checkbox with blue checkmark: "I agree to the Terms and Privacy Policy".
  - Primary button: Cobalt pill `Create account` / `Log in`.
  - Social Auth row: `Apple` (black pill) and `Google` (white pill with stroke).
  - Footer toggle: `Already have an account? Log in` / `New here? Create an account`.

### 4. Room Home (Page 1)
- Top bar: Room Title with chevron dropdown (`Friday Night Dinner ▾`), `4 in room` green live indicator, top-right Memoji stack.
- Hero Spend Card (Cobalt Blue):
  - Label: `Total spend`
  - Heavy Figure: `$310.00`
  - `Split with` avatar row (5 Memojis overlapping).
  - White inner pill button: `[QR Icon] Invite to Room via QR`.
- "In the Room Now" Carousel:
  - Horizontal scroll of vertical rounded cards:
  - Avatar, Name (`Mia`, `Jonas`, `Aly`, `Ken`), status (`Live · Wi-Fi`, `Live · 5G`, `Joining…`).
- "Live items" section with `See all` action:
  - Notched ticket cards with dashed perforated line.
  - Item title, creator, timestamp (`Added by Mia · just now`), price (`$36.00`), `NEW` badge.
  - Sub-row: `Split 3 ways` with avatar row.

### 5. Join via QR Modal (Page 5)
- Bottom-sheet presentation with top grab handle.
- Title: *"Point your phone to join this bill"* / *"Scan the code or enter the PIN"*.
- QR Card: High-contrast stylized QR code with cobalt corner accents.
- PIN Badge: Light blue pill with bold cobalt text: `PIN: 4821`.
- "In the room • Live" list:
  - Rows with Avatar, Name, device/status (`Host · iPhone`, `Just joined`, `Scanning code…`), and status pill (`Connected` in Emerald, `Joining` in Amber).

### 6. Items Screen (Page 2)
- Header with bold `Items` and top-right Cobalt pill `+ Add item`.
- Filter row: `All` (Cobalt active pill), `Unclaimed` (White pill), `Mine` (White pill).
- Cobalt summary card: `12 items · Friday Night Dinner`, `$310.00`, and amber badge `2 unclaimed`.
- Ticket list:
  - Clean rows with item name, quantity, creator, price, and status badge (`Claimed` in Emerald, `Unclaimed` in Amber).

### 7. Claim & Adjust Modal (Page 6)
- Top chevron back button `<` with title `Claim & adjust`.
- Receipt Ticket Card:
  - Header: `RECEIPT · FRIDAY NIGHT DINNER #0412`
  - Itemized rows: `Burgers x4 ($120.00)`, `Drinks x6 ($60.00)`, `Fries x2 ($30.00)`.
  - Total line: `Total $210.00` in heavy black font.
  - Barcode graphic at bottom of ticket card.
- Section: *"Who is sharing Burgers • Live"*.
- Per-Person Slider Rows:
  - Circular Memoji avatar, Name (`You`, `Mia`, `Jonas`, `Aly`), current percentage (`25%`), dollar amount (`$30.00`).
  - Interactive slider track with Cobalt progress fill and white thumb.
- Sticky Bottom CTA: Cobalt pill button `Confirm split`.

### 8. Settle Up Screen (Page 7)
- Header: `Settle up • 4 in room`.
- Ticket Card:
  - Section `YOUR ITEMS · 25% EACH`: list of claimed items (`Burgers $30.00`, `Drinks $15.00`, `Fries $7.50`).
  - Section `THE ROOM`: live list of members with `Paid` (Emerald `#10B981`) and `Pending` (Amber `#FFA800`) badges.
- Bottom Sticky Hero Ticket:
  - Midnight Navy background (`#0B1530`).
  - Label: `Your share to pay`.
  - Heavy white currency: `$52.50`.
  - Subtitle: `Split 4 ways · Friday Night Dinner`.
  - Primary CTA: **Vibrant Amber/Gold pill button `Pay Now` (`#FFA800`)**.

### 9. Activity Feed (Page 3)
- Header: `Activity • Live`.
- Settlement Progress Card:
  - Label: `SETTLEMENT`, badge: `2 of 4 paid`.
  - Currency ratio: `$105.00 of $210.00`.
  - Progress bar: 50% emerald fill with rounded edges.
- Section `Today`:
  - Rich event items with avatar, bold action title, subtitle, status badge, and relative time (`2m`, `6m`, `9m`, `12m`, `15m`).

### 10. Me / Profile Screen (Page 4)
- Header `Me`.
- Centered Avatar with pink halo, name `Alex Santos`, email `alex@email.com`, and white pill button `Edit profile`.
- Settings list card with Chevron disclosure indicators (`Payment methods`, `Notifications`, `Currency USD $`, `Help & support`).
- Destructive text button: `Log out` in vibrant red.

---

## 3. Signature UI Components Specifications

### Component A: `NotchedTicketCard`
```tsx
// Uses react-native-svg for crisp vector cutouts on left and right edges
<View style={styles.ticketContainer}>
  <View style={styles.ticketTopSection}>
    {/* Item title, price, badges */}
  </View>
  <View style={styles.perforationRow}>
    <View style={styles.leftNotch} />
    <DashedLine stroke="#CBD5E1" strokeDasharray="6,4" />
    <View style={styles.rightNotch} />
  </View>
  <View style={styles.ticketBottomSection}>
    {/* Split avatars or barcode */}
  </View>
</View>
```

### Component B: `SettlementHeroCard`
```tsx
// Midnight Navy ticket with amber Pay Now button
<View style={styles.midnightCard}>
  <Text style={styles.whiteSubtext}>Your share to pay</Text>
  <Text style={styles.heavyCurrencyWhite}>${shareAmount}</Text>
  <Text style={styles.dimSubtext}>Split {splitCount} ways · {roomTitle}</Text>
  <TouchableOpacity style={styles.amberPillButton}>
    <Text style={styles.darkButtonText}>Pay Now</Text>
  </TouchableOpacity>
</View>
```

### Component C: `PercentageSliderRow`
```tsx
// 48px touch target with Memoji avatar, live % and live $ preview
<View style={styles.sliderRow}>
  <Avatar source={user.avatar} size={40} />
  <Text style={styles.userName}>{user.name}</Text>
  <View style={styles.sliderStats}>
    <Text style={styles.bluePercent}>{percentage}%</Text>
    <Text style={styles.boldAmount}>${amount.toFixed(2)}</Text>
  </View>
  <Slider
    value={percentage}
    minimumValue={0}
    maximumValue={100}
    minimumTrackTintColor="#2F65F6"
    maximumTrackTintColor="#E2E8F0"
    onValueChange={handleScrub}
    onSlidingComplete={handleCommit}
  />
</View>
```

