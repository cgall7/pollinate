import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { HoneycombStore } from '../services/HoneycombStore';
import { isAuthCallbackUrl } from '../services/authLinking';
import { migrateLegacyJournal } from '../services/legacyJournalMigration';
import { PendingOnboardingWrites } from '../services/pendingOnboardingWrites';

const AuthContext = createContext({ session: null, loading: true });

// Single source of truth for the Supabase auth session so any screen can
// read it without re-subscribing to onAuthStateChange itself.
// Everything that has been waiting for a session to exist, fired from the
// one place that knows a session just started existing.
//
// PendingOnboardingWrites is here for a reason that is easy to lose: the
// confirm-your-email exit of onboarding navigates away with the buffer
// unwritten, and the session that can write it arrives LATER — after the
// user has opened an email client, followed a link, and come back, possibly
// into a fresh process. There is no screen still mounted to do it. So the
// flush belongs to the session's arrival, not to the screen that collected
// the buffer (C6, Sage 2026-08-17). The account screen calls it too, so the
// happy path still writes before "Keep it." finishes; this is the leg that
// catches every other way a session can appear.
//
// Failures are swallowed HERE and only here: this is the retry leg, it has
// no user standing in front of it, and the buffer survives a failed flush
// to be retried on the next session. The surfacing obligation for a failed
// hive write lives at the account screen, which does have one.
const onSessionAvailable = (nextSession) => {
  // The one-time orphaned-journal recovery (thread ba3783a7) needs a
  // signed-in user before EntryStore's reads/writes will do anything but
  // throw, so it's fired from here rather than unconditionally on boot.
  // Both the user id and the account's own created_at are passed
  // explicitly: the migration claims the legacy key to exactly this
  // identity (since nothing in that key records who it actually belongs
  // to), but only after `created_at` clears a one-sided sanity check —
  // an account created after the newest legacy entry's savedAt cannot
  // have written it, and is refused rather than handed the claim.
  // migrateLegacyJournal() cannot itself reject (its whole body is one
  // try/catch), but this call site is handled anyway rather than resting
  // on that internal guarantee — the same standard check-entry-writes
  // holds every other EntryStore-adjacent call site to.
  migrateLegacyJournal(nextSession.user.id, nextSession.user.created_at).catch(() => {});
  PendingOnboardingWrites.flush().catch(() => {});
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) onSessionAvailable(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) onSessionAvailable(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // ENG-83 — the other end of the magic-link email. A tap on the emailed
  // link reopens THIS app via its `pollinate://auth-callback` scheme
  // (`app.json`'s `expo.scheme`, resolved by `Linking.createURL` in
  // src/services/authLinking.js); this effect is what notices that reopen
  // and turns it into a session.
  //
  // Both listeners are needed, not either: `addEventListener('url', …)`
  // fires only while a JS process is already running to receive it (a warm
  // background→foreground reopen). A user who followed the link from a
  // cold start — the app was never running, or was killed while they were
  // in their mail client — launches straight into a NEW process with the
  // callback URL as its *launch* URL, which `addEventListener` cannot see;
  // `getInitialURL()` is the one-shot read for exactly that case. Skipping
  // either one silently strands the coldest and warmest ends of the same
  // flow.
  //
  // `exchangeCodeForSession`/`setSession` inside `completeSessionFromUrl`
  // update the client's own session, which is what fires the
  // `onAuthStateChange` listener above — so this effect does not call
  // `setSession` itself; it only hands the URL off and lets the existing
  // single path pick up the result, same as every other sign-in method.
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    const handleUrl = (url) => {
      if (!isAuthCallbackUrl(url)) return;
      HoneycombStore.completeSessionFromUrl(url).catch((err) => {
        console.warn('Magic-link session exchange failed', err);
      });
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
