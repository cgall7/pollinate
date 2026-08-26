import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants/theme';
import { SPRINGS } from '../constants/motion';
import { TodayTab } from '../screens/TodayTab';
import { RecapTab } from '../screens/RecapTab';
import { HoneycombTab } from '../screens/HoneycombTab';
import { TabBarButton } from './TabBarButton';
import { AccountDoor } from './AccountDoor';
import { GlassBackground, useReduceTransparency } from './GlassBackground';
import { SIDE_INSET, BAR_HEIGHT, BAR_BOTTOM, DOOR_END_INSET, DOOR_TOP_GAP } from './tabBarLayout';

const Tab = createBottomTabNavigator();


// DES-27 (Pixel, 2026-08-26, Project 22 Slice 1): the bar is Today | Hive |
// Garden — the Wallet shell retires (it was never more than a "Coming Soon"
// placeholder, Project 10) and the capsule goes back to being symmetric.
// This is the only tab-name mapping left from Project 10's rename:
//
//   Honeycomb -> Hive    same screen, the ruling's name for it.
//   Recap     -> Garden  Garden is "where you reflect"; Recap is what it
//                        opens on, and Wrapped moved inside it (below).
//
// Every glyph name below was checked against the installed glyphmaps
// (@expo/vector-icons .../glyphmaps/{Ionicons,MaterialCommunityIcons}.json)
// rather than recalled — a missing name renders a blank square, not an error.
const TAB_ICONS = {
  Today: { active: 'sunny', inactive: 'sunny-outline' },
  Hive: { active: 'hexagon-multiple', inactive: 'hexagon-multiple-outline', set: MaterialCommunityIcons },
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
      {/* All three are direct children on purpose. Every screen below holds
          at least one `getParent()?.navigate(...)`, which resolves to the
          root stack only from this depth — Today→Lock, Hive→Seeds/Notes/
          Onboarding, Garden→Wrapped (and DevVersionTag's replay reset).
          Insert a navigator and those calls find no route and do nothing,
          silently. Enforced, not documented: `npm run check:nav-depth`. */}
      <Tab.Screen name="Today" component={TodayTab} />
      <Tab.Screen name="Hive" component={HoneycombTab} />
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
