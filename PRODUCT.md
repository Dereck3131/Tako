# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive (iOS & Android via Expo / React Native)

## Users

- **The Dining Host**: Young adults, students, and roommates who pay the restaurant bill upfront and need to collect exact reimbursement from 3–10 tablemates before leaving.
- **The Social Diner / Light Eater**: Table participants who only had an appetizer or a drink and want to pay for their exact items without awkward group discussions.
- **The Sharer**: Friends sharing dishes (e.g. Nachos, Pizzas, Wine bottles) across 2–4 people who need proportional percentage sliders that always total 100%.

## Product Purpose

TabTogether transforms post-dinner bill splitting from stressful mental math into an instant, live, tactile collaborative experience. Friends join a room in seconds via QR/PIN, add orders in real time, claim their portions, and settle up cleanly before walking out of the restaurant.

## Positioning

Unlike Splitwise (which tracks running debts across months) or calculators (which require one person to do manual math), TabTogether is a **live, real-time shared room for single dining sessions**. It eliminates floating-point rounding errors and race conditions using integer cent arithmetic, the Largest Remainder Method, and server-synchronized slider redistribution.

## Workflows

1. **Host Room Creation**: Host creates room, sets tax/tip preferences, and displays large QR code with 4-digit PIN.
2. **Instant Table Join**: Friends point phone cameras to join without friction; their live presence immediately pops onto the table carousel.
3. **Live Item Entry & Claiming**: Any participant adds ordered dishes; users drag intuitive sliders to claim 25%, 33%, 50%, or custom shares.
4. **Instant Settlement**: Proportional tax & tip are calculated automatically. Each diner taps "Pay Now" to launch prefilled P2P payment links (Venmo, Cash App, Revolut, Apple Pay) or mark as paid.

## Key Terminology

- **Room**: An ephemeral 24-hour collaborative dining session.
- **Item**: A food/beverage bill item with title, quantity, and integer cent price.
- **Share**: A percentage claim measured in integer basis points ($1\% = 100\text{ bps}$, $100\% = 10,000\text{ bps}$).
- **Settlement**: The final dollar amount owed by each participant, factoring in proportional subtotal tax and tip.
