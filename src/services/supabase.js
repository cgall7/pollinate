import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Expo inlines EXPO_PUBLIC_* vars into the bundle at build time — set them in
// .env (see .env.example). The anon key is safe to ship in the client; it can
// only do what the database's Row Level Security policies allow (see
// supabase/migrations/20260808000001_honeycombs_core_schema.sql).
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase env vars missing — Honeycomb features are disabled until ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // ENG-83 — magic-link sign-in. PKCE (not the 'implicit' default) is
        // what puts the callback's token in a `?code=` query param instead
        // of a `#access_token=` URL fragment: React Native has no browser
        // location bar to read a fragment from, so `src/services/
        // authLinking.js` and `HoneycombStore.completeSessionFromUrl` are
        // written against the `code` shape. `detectSessionInUrl` stays
        // false either way — that flag is GoTrue's own browser-only
        // auto-parse, meaningless with no DOM `window.location`, and RN's
        // deep-link event is what feeds the callback URL to this client
        // instead (AuthContext.js).
        flowType: 'pkce',
      },
    })
  : null;
