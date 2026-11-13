# AGENTS.md — Tako

Guidelines for working on the **Tako** Expo + Supabase codebase.

## Design & Styling

- **Theme tokens**: Always use `useTakoTheme()` (`palette`) and constants from `src/constants/theme.ts` (`TakoColors`, `TakoFonts`, `Radii`, `MemberPalette`, `formatPeso`).
- **Fonts**: Use `TakoFonts.regular` (`Nunito_600SemiBold`), `TakoFonts.bold` (`Nunito_800ExtraBold`), and `TakoFonts.black` (`Nunito_900Black`).
- **Currency**: Amounts are stored in integer cents (`amount_cents`) and formatted with `formatPeso(cents)` (`₱`). Never use floating-point arithmetic for stored balances or splits; use `splitEqually` / `computeMemberBalances` / `computeSimplifiedDebts` in `src/lib/split.ts`.
- **Ambient glow**: Use `<AmbientGlow />` (`src/components/AmbientGlow.tsx`) for the background radial glow—never a solid-colored `<View>` circle.

## Animation & SVG Rules (iOS, Android & Web)

- **Use Reanimated 4** (`react-native-reanimated`), not core `Animated`.
- **Respect reduced motion**: Check `useReducedMotion()` in animated components (`TakoMascot`, `TakoSplash`).
- **No `origin` / `originX` / `originY` on `react-native-svg` elements**: On React 19 + Web, `react-native-svg` emits `transform-origin` as a kebab-case DOM prop and triggers a console error. Always apply pivot transforms directly inside `useAnimatedProps` (`translateX(ox) -> translateY(oy) -> transform -> translateX(-ox) -> translateY(-oy)`).
- **Tab transitions**: Keep `animation: 'none'` on bottom tabs (`src/app/(tabs)/_layout.tsx`).
- **Haptics**: Wrap `expo-haptics` calls in `if (Platform.OS !== 'web')` with `.catch(() => {})`.

## Supabase Conventions

- Project ref: `jdwoszkyonkzxhgzfgnb`.
- Client: `src/lib/supabase.ts` (uses SSR-safe `AsyncStorage` wrapper).
- Never expose a `service_role` key in client code—only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- All `public` tables have RLS enabled. Group access is gated by `public.is_group_member(gid uuid)`. Joining by invite code goes through `public.join_group_by_code(p_code, p_member_name)`.

## Verification

Before finishing changes, run:

```powershell
npx tsc --noEmit
npx eslint src
```
