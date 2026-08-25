import { theme } from '../constants/theme';

// The gap every screen's top chrome keeps above the device's real safe-area
// inset (`useSafeAreaInsets().top`), so the total top clearance is
// `insets.top + CHROME_TOP_GAP` everywhere rather than a hand-picked total.
//
// R14 (Lumen, 2026-08-21, `PLANS/LUXURY_PASS_REGISTER.md`): fourteen screens
// hard-coded five different totals (48/60/64/72/100) that each already had
// *some* device inset baked in, so the space above first content differed
// screen to screen on one phone — the chrome visibly stepped down navigating
// between them. Account.js is the one screen that was already built right
// (`SafeAreaView` from `react-native-safe-area-context`, not the constants
// above), and its own topmost chrome (`topBar`, Account.js:220) sits
// `paddingTop: 8` past the inset it's handed — that's the value this token
// carries forward, so the fixed screens match the one screen that was never
// broken instead of inventing a new number.
export const CHROME_TOP_GAP = theme.spacing.sm; // 8
