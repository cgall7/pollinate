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
// R-NT-1 (Lumen, 2026-09-05, POLLINATE_OPENDAY_NECTAR_RECUT_SPEC.md Part 3):
// FOUR icons now — Today | Hive | Nectar | Garden. Nectar is a tab and not a
// room on the Hive because Colin looked at the shipped header and could not
// find nectar at all; the owner failing to locate a surface is the legibility
// verdict on its placement. Today stays FIRST: landing trains writing, not
// checking. The old "centre slot = focal" note was an artifact of a 3-dock
// and dies with it.
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
      <Tab.Screen name="Today" component={TodayTab} />
      <Tab.Screen name="Hive" component={HoneycombTab} />
      <Tab.Screen name="Nectar" component={NectarTab} />
      {/* Garden's landing content is Recap — the ruling's solo-user
          description of this tab ("your entries, streak, monthly recap") is
          RecapTab's contents line for line. The file keeps its name because
          `scripts/check-streaks.mjs:197` reads `src/screens/RecapTab.js` by
          path; renaming it here would only move the mismatch into a gate. */}
      <Tab.Screen name="Garden" component={RecapTab} />
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
