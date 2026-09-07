import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants/theme';
import { SPRINGS } from '../constants/motion';
import { TodayTab } from '../screens/TodayTab';
import { RecapTab } from '../screens/RecapTab';
import { HoneycombTab } from '../screens/HoneycombTab';
import { NectarTab } from '../screens/NectarTab';
import { TabBarButton } from './TabBarButton';
import { AccountDoor } from './AccountDoor';
import { GlassBackground, useReduceTransparency } from './GlassBackground';
import { SIDE_INSET, BAR_HEIGHT, BAR_BOTTOM, DOOR_END_INSET, DOOR_TOP_GAP } from './tabBarLayout';

const Tab = createBottomTabNavigator();


// DES-27 (Pixel, 2026-08-26, Project 22 Slice 1): the bar was Today | Hive |
// Garden — the Wallet shell retired (it was never more than a "Coming Soon"
// placeholder, Project 10) and the capsule went back to being symmetric.
//
// R-NT-1 (Lumen, 2026-09-05, POLLINATE_OPENDAY_NECTAR_RECUT_SPEC.md Part 3)
// SUPERSEDED 2026-09-07: Colin ratified five tabs, Honeycomb first, at his
// co-founder meeting (Vector, thread f2c15b7d, ts 1788787805 — "Today
// demotes to slot 2 and gets renamed, Honeycomb promotes to home, one tab
// is net new"). "Today stays FIRST: landing trains writing, not checking"
// no longer holds; below still describes the four tabs actually declared
// today. The reorder itself is ENG-104's commit, not this one — it rides
// the compose-card build, since reordering before that card exists would
// land a brand-new account on an empty connection-acquisition prompt
// instead of a write door (Vector, same thread). Citation retargets to
// Lumen's DES-43 IA spec once it lands; this pointer is the placeholder
// she asked ENG-103 to carry in the meantime.
//
// FOUR icons, current state: Today | Hive | Nectar | Garden. Nectar is a
// tab and not a room on the Hive because Colin looked at the shipped
// header and could not find nectar at all; the owner failing to locate a
// surface is the legibility verdict on its placement. The old "centre
// slot = focal" note was an artifact of a 3-dock and dies with it.
//
// The tab-name mappings left from Project 10's rename:
//
//   Honeycomb -> Hive    same screen, the ruling's name for it.
//   Recap     -> Garden  Garden is "where you reflect"; Recap is what it
//                        opens on, and Wrapped moved inside it (below).
//
// Nectar needs no mapping: R-NT names the tab Nectar and the route is Nectar.
//
// Every glyph name below was checked against the installed glyphmaps
// (@expo/vector-icons .../glyphmaps/{Ionicons,MaterialCommunityIcons}.json)
// rather than recalled — a missing name renders a blank square, not an error.
const TAB_ICONS = {
  Today: { active: 'sunny', inactive: 'sunny-outline' },
  Hive: { active: 'hexagon-multiple', inactive: 'hexagon-multiple-outline', set: MaterialCommunityIcons },
  // R-NT-2 amendment: the DROP, not a hexagon and not a jar. The hexagon is
  // Honeycomb's glyph and the vessel on the tab itself is the own cell drawn
  // large, so the dock mark is the object a gift is made of.
  //
  // R-NT-6: no numeral, no badge, ever.
  Nectar: { active: 'water', inactive: 'water-outline' },
  // R-NT's mock drew Garden outline in both states; NOT ADOPTED. A mock does
  // not retune a shipped term, and the filled `flower` on active is what every
  // other tab's active glyph does. Pixel's observation that the petal disc
  // reads heavier than the other three active glyphs is logged for Colin's
  // device eye, not acted on here.
  Garden: { active: 'flower', inactive: 'flower-outline' },
};
// FIFTH ROW, RULED NOT YET MOUNTED: POLLINATE_FIVE_TAB_IA_SPEC.md §6 (design
// workspace, Lumen, 2026-09-07) fixes ENG-105's Friends tab as
// `Friends: { active: 'people', inactive: 'people-outline' }` (Ionicons,
// both names run-time verified in the installed glyphmap). Not added here:
// the TAB_ICONS gate rows in check-collector-null-class.mjs are
// bidirectional, so a key entered before the route mounts reds "no
// TAB_ICONS key names a route that is no longer a tab screen." The entry
// rides ENG-105's own commit; nothing about the value is open.

// The active marker is a soft tonal field one step off the bar, not a
// saturated marigold badge sitting on top of it. Marigold survives as the
// 1pt ring around the field — present, but no longer the loudest object on
// the whole screen. The glyph still springs in on the switch: landing on a
// tab should feel alive even when the marker is quiet. It no longer lifts —
// a tonal field that floats reads as a mistake; a filled badge could.
const TabIcon = ({ routeName, focused }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!focused) return;
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, ...SPRINGS.land, useNativeDriver: true }).start();
  }, [focused]);

  const IconComponent = TAB_ICONS[routeName].set ?? Ionicons;

  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <IconComponent
          name={focused ? TAB_ICONS[routeName].active : TAB_ICONS[routeName].inactive}
          size={24}
          color={focused ? theme.colors.ink : theme.colors.textSecondary}
        />
      </Animated.View>
    </View>
  );
};

// The capsule and the door are siblings, so the door has to be rendered
// outside the bar: React Native clips touches to a view's bounds, so a
// circle drawn past the capsule's edge would be visible and dead. This
// wrapper spans the screen (`box-none`, so it never eats a tap meant for
// content) and lets both halves position themselves against it.
//
// DES-27: the door's `top` depends on the safe-area inset, which is not a
// static value — `props.insets` is already handed to the tab-bar renderer
// by `BottomTabView` (do not add `useSafeAreaInsets()`), so it reads from
// there rather than a second inset source.
const TabDock = (props) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
    <BottomTabBar {...props} />
    <View
      style={[styles.doorAnchor, { top: props.insets.top + DOOR_TOP_GAP }]}
      pointerEvents="box-none"
    >
      <AccountDoor />
    </View>
  </View>
);

export const MainTabs = () => {
  // Glass floats on translucency; Reduce Transparency goes back to the old
  // solid pill's own shadow weight (spec §10) — read once here so the bar
  // and its background layer agree on which look is active.
  const reduceTransparency = useReduceTransparency();

  return (
    <Tab.Navigator
      // Explicit, not a restatement of the declaration-order fallback: this
      // is the SOLE mechanism deciding the tab every ordinary daily open
      // lands on (App.js:210's Stack initialRouteName only picks the Stack
      // route, 'Main' — it structurally cannot see inside this navigator).
      // Vector found both `App.js:224` and `:391` free-ride on whichever
      // Tab.Screen is declared first, silently, on any future reorder; this
      // prop is what makes the two call sites' own explicit screen
      // arguments (added in the same commit) a real pin rather than a
      // restatement of an accident. Flips to "Hive" only in the commit that
      // makes that premise true — ENG-104's compose card (Lumen, thread
      // f2c15b7d, 2026-09-07). Gated: scripts/check-eng103-tab-bar-pin.mjs.
      initialRouteName="Today"
      tabBar={(props) => <TabDock {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.textPrimary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: [styles.tabBar, reduceTransparency ? theme.shadows.card : theme.shadows.glass],
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => <GlassBackground radius={theme.borderRadius.large} />,
        tabBarButton: (props) => <TabBarButton {...props} />,
        tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
      })}
    >
      {/* All four are direct children on purpose. The screens below that call
          `getParent()?.navigate(...)` resolve to the root stack only from this
          depth — Today→Input, Hive→Notes/Onboarding, Garden→Wrapped.
          Insert a navigator and those calls find no route and do nothing,
          silently. Enforced, not documented: `npm run check:nav-depth`.
          (Nectar makes no such call — R-NT-5's amendment holds the give door
          back until a destination is ruled — so it is a direct child for
          consistency and for the day it does.) */}
      {/* R-NT ratification item 4 (Lumen, 2026-09-06, thread 160660d9;
          POLLINATE_OPENDAY_NECTAR_RECUT_SPEC.md Part 3): the dock's four
          destination names are AUTHORED WORDS — `Today`, `Honeycomb`,
          `Nectar`, `Garden`. Until this commit none of the four was
          declared anywhere, so both accessibility channels fell back to
          `route.name` and VoiceOver said "Hive" for a tab whose ruled name
          is Honeycomb.

          The prop is a STRING `tabBarLabel`, and it is the whole mechanism.
          Read out of the installed @react-navigation/bottom-tabs@7.18.15:

            BottomTabItem.tsx:218-226   labelString = getLabel(
                                          { label: typeof tabBarLabel ===
                                              'string' ? tabBarLabel : undefined,
                                            title }, route.name)
            BottomTabItem.tsx:349-350   accessibilityLargeContentTitle =
                                          labelString  (the iOS HUD DRAWS it)
            BottomTabBar.tsx:421-427    label = getLabel({ tabBarLabel, title },
                                          route.name)
            BottomTabBar.tsx:429-434    iOS accessibilityLabel =
                                          `${label}, tab, i of n`  (SPOKEN)

          One value, both channels. `tabBarAccessibilityLabel` is the half
          fix that looks done: BottomTabBar.tsx:430-431 is its only consumer,
          so it overrides the spoken string and leaves the Large Content
          Viewer HUD still drawing `route.name`.

          Declared on ALL FOUR, not only the one that differed. The other
          three were correct by the `route.name` fallback, which is a
          justification that expires the moment a route id moves — the exact
          shape this arc has now tripped over twice. With four explicit
          labels the fallback is never reached.

          Invisible, still: `renderLabel` (BottomTabItem.tsx:242-247) returns
          null before it touches the label whenever `tabBarShowLabel` is
          false and `labelVisibilityMode` is unset, which is this tree. The
          dock stays icons only per R-NT-1.

          Route ids are NOT renamed: they are navigation identity, and
          changing an identity to fix a label is paying in the wrong
          currency. The presentation lever is `tabBarLabel` above.

          WHICH callers depend on the ids, corrected in FU4 (Lumen's rider on
          FU2). `TabIcon` keying `TAB_ICONS` on `route.name` is true and
          indexes with no fallback. The second clause, `getParent()?.navigate`
          targets, was false: swept at FU4, all twelve such calls target STACK
          routes (`Input`, `HiveDetail`, `Wrapped`, ...) and not one names a
          tab, so it would have sent an editor grepping the wrong callers. The
          real resolvers were five nested `('Main', { screen: 'Today' })`
          calls, at `CreateComb.js:45`, `CombInvite.js:180` and `App.js`
          :171, :189, :262 — grown to SEVEN by ENG-103 (2026-09-07), which
          named the two that were still bare (`App.js:224`, `:391`; Vector's
          finding, thread f2c15b7d) rather than letting them free-ride on
          Tab.Screen declaration order. Gated:
          scripts/check-eng103-tab-bar-pin.mjs. */}
      <Tab.Screen
        name="Today"
        component={TodayTab}
        options={{ tabBarLabel: 'Today' }}
      />
      <Tab.Screen
        name="Hive"
        component={HoneycombTab}
        options={{ tabBarLabel: 'Honeycomb' }}
      />
      <Tab.Screen
        name="Nectar"
        component={NectarTab}
        options={{ tabBarLabel: 'Nectar' }}
      />
      {/* Garden's landing content is Recap — the ruling's solo-user
          description of this tab ("your entries, streak, monthly recap") is
          RecapTab's contents line for line. The file keeps its name because
          `scripts/check-streaks.mjs:197` reads `src/screens/RecapTab.js` by
          path; renaming it here would only move the mismatch into a gate. */}
      <Tab.Screen
        name="Garden"
        component={RecapTab}
        options={{ tabBarLabel: 'Garden' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    // `start`/`end`, NOT `left`/`right`. BottomTabBar's own base style
    // (`styles.bottom`) sets `start: 0, end: 0`, and Yoga gives the logical
    // properties precedence over the physical ones no matter which style
    // object lands later — so a `left`/`right` inset here is silently
    // dropped and the bar renders edge to edge. Measured on device before
    // the fix: the capsule spanned 0-393pt on a 393pt screen. The pair is
    // also what makes the split behave in RTL, where the door belongs on
    // the other side.
    start: SIDE_INSET,
    // DES-27: the door left this row, so the capsule is symmetric again —
    // `end` no longer depends on `useHasAccountDoor()`.
    end: SIDE_INSET,
    bottom: BAR_BOTTOM,
    height: BAR_HEIGHT,
    // BottomTabBar reserves `insets.bottom` (34pt here) inside its own
    // height for a bar flush to the screen edge. This one floats 28pt above
    // it, so that reservation is pure dead band — it's what pushed the old
    // bar's glyph row 17.4pt above centre, and at 60pt tall it squeezed the
    // content box to 26pt and pushed the active marker out through the top.
    paddingBottom: 0,
    borderRadius: theme.borderRadius.large,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  doorAnchor: {
    position: 'absolute',
    // DES-27: the door's own top-right column, on the content margin — not
    // the capsule's chrome inset. `top` is set per-instance above, since it
    // depends on the safe-area inset the tab-bar renderer hands down.
    end: DOOR_END_INSET,
  },
  tabBarItem: {
    paddingTop: 0,
  },
  iconPill: {
    width: 56,
    height: 44,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: theme.colors.washYellow,
    borderWidth: 1,
    // The accent is still the thing marking the tab, just as an edge rather
    // than a fill.
    borderColor: theme.colors.accentEdge,
  },
});
