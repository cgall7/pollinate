import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, initialsFor } from '../components/Avatar';
import { PressableScale } from '../components/PressableScale';
import { GlassBackground, useReduceTransparency } from './GlassBackground';

// Option C's second half (Colin, 2026-08-11): a detached circle beside the
// tab capsule, not a fifth tab. Everything behind it — sign out, the
// privacy policy, terms — is opened about twice a year, and a fifth tab
// would spend permanent prime real estate on that. A corner avatar is the
// affordance people already know from every other app.
//
// Placement is MainTabs' job (it owns the capsule/door row geometry); this
// only knows how big the circle is and what's inside it.
export const DOOR_SIZE = 52;
const DOOR_AVATAR_SIZE = 34;

// Colin, 2026-08-29, on the shipped door: *"this profile button needs to be
// full liquid glass. It looks boring right now."*
//
// **The material was already glass; the door was a disc inside a disc.** A
// 52pt glass circle with a 34pt `Avatar` circle centred in it is two
// concentric edges, and on Today both of them are cream: the glass veil is
// `surface`, the avatar's own rim is `glassRim` (`surface` at 0.65), and the
// initials sat on whichever of `AVATAR_WASHES` the name hashed to — for the
// name in his screenshot, `washYellow`, the palest one in the rotation, over a
// cream header. Nothing in that stack has a figure in it. Glass cannot read as
// glass when the only thing behind it is the same colour as the thing in front
// of it, and no amount of refraction fixes a pale disc on a pale disc.
//
// So: **the door is ONE object.** The glass IS the button's body, and the only
// thing inside it is the person. No inner fill, no second rim, initials
// straight onto the material at full `ink` — the strongest figure the palette
// has, on every ground the door floats over.
//
// **The identity rotation does not belong here, and that is the ruling, not a
// side effect of the layout.** `AVATAR_WASHES` exists to tell members of a hive
// apart from each other (`Avatar.js`: "so the hive reads as varied people
// rather than one repeated color"). Your own door has nobody to be told apart
// from. A hash over one element is not identity, it is a colour nobody chose.
//
// A real photo is the one thing that IS a figure, so it keeps its circle: the
// glass replaces the placeholder, never the person.
const DOOR_INITIALS_SIZE = 16;

// Whether the door exists at all. Signed out there is no account to open —
// every row behind it would be disabled — so the door simply isn't there
// yet, and MainTabs must not reserve the space beside the capsule for it.
// The two have to agree or the bar goes lopsided, so the condition lives
// here once and both read it rather than each testing `session` themselves.
export const useHasAccountDoor = () => !!useAuth().session;

export const AccountDoor = () => {
  const navigation = useNavigation();
  const { session } = useAuth();
  const hasDoor = useHasAccountDoor();
  const reduceTransparency = useReduceTransparency();

  if (!hasDoor) return null;

  const name = session.user?.user_metadata?.display_name ?? session.user?.email ?? '?';
  const avatarUrl = session.user?.user_metadata?.avatar_url;

  return (
    <PressableScale
      onPress={() => navigation.navigate('Account')}
      accessibilityLabel="Account"
      style={[styles.door, reduceTransparency ? theme.shadows.card : theme.shadows.glass]}
    >
      <GlassBackground radius={DOOR_SIZE / 2} />
      <View style={styles.avatarWrap}>
        {avatarUrl ? (
          <Avatar name={name} avatarUrl={avatarUrl} size={DOOR_AVATAR_SIZE} />
        ) : (
          <Text style={styles.initials} allowFontScaling={false}>
            {initialsFor(name)}
          </Text>
        )}
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  door: {
    width: DOOR_SIZE,
    height: DOOR_SIZE,
    borderRadius: DOOR_SIZE / 2,
    // Transparent for the same reason the capsule is: the glass layer below
    // is what paints, and it lives in its own clipped child so this view's
    // shadow survives (see GlassBackground).
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    // Above the glass layer, which fills the circle behind it.
    zIndex: 1,
  },
  initials: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: DOOR_INITIALS_SIZE,
    // Tracking, because two capitals with no counters between them read as one
    // shape at this size. Same treatment the type scale gives every other
    // all-caps pair.
    letterSpacing: 0.6,
    color: theme.colors.ink,
    // `allowFontScaling={false}` at the call site: this is a 52pt circle with a
    // fixed diameter that `tabBarLayout` reserves a column for, so initials that
    // grow with Dynamic Type would overflow a box nothing else can widen. It is
    // the one place in the app where that is the right call, and it is an
    // ABBREVIATION rather than content — the accessibility label ("Account") is
    // what a screen reader announces, and it does not scale either way.
  },
});
