# ENG-78 link substrate (part a)

Repo artifacts for the comb-invite universal link, scoped to iOS per
Vector's split (Android has no `android.package` in `app.json` and has
never been buildable on this repo — out of scope here). This directory is
not built or deployed by anything in this repo yet; hosting is a separate
step (see below).

## What's here

- `.well-known/apple-app-site-association.template.json` — TEMPLATE. Needs
  `PENDING_APPLE_TEAM_ID` replaced with the Apple Developer Team ID before
  it can be renamed to `apple-app-site-association` (no extension) and
  deployed.
- `comb-invite.html` — the re-tap landing page for someone who taps the
  link without the app installed. No SDK, no analytics, no tracking —
  install Pollinate, then tap the same link again.

## Two values only Colin can fill

1. **Apple Developer Team ID** — lives in Colin's Apple Developer account,
   not in this repo. Fills `PENDING_APPLE_TEAM_ID` in the AASA template.
2. **App Store URL** — the app has no public App Store listing yet. Fills
   `PENDING_APP_STORE_URL` in `comb-invite.html`.

## Hosting requirements (whoever deploys this)

- `apple-app-site-association` must be served at exactly
  `https://pollinateapp.xyz/.well-known/apple-app-site-association`, over
  HTTPS, `Content-Type: application/json`, **no redirects** — iOS will not
  follow a redirect when fetching it.
- `comb-invite.html` must resolve at exactly `https://pollinateapp.xyz/comb-invite`
  (no trailing slash, no redirect) — this is a strict equality check in
  `src/services/combInviteLinking.js` (`COMB_INVITE_PATH = 'comb-invite'`),
  asserted by `check-comb-invite-client.mjs`. Configure the host's routing
  explicitly (e.g. a rewrite rule mapping `/comb-invite` to this file)
  rather than relying on directory-index conventions, which typically
  serve a file at `/comb-invite/` (trailing slash) instead.
- DNS for `pollinateapp.xyz` is Colin's domain (registrar access) — not
  delegable. Going live needs Colin to point it at wherever this ends up
  hosted.

## Not verified yet

`Linking.parse()` on an `https://` universal link has only been exercised
against the `pollinate://` custom scheme in this codebase (Expo Go). Run
one real TestFlight/internal build with the deployed AASA before treating
the parse path as equivalent — a five-minute check that protects this
whole item (flagged by Vector).

## Deliberately out of scope here

- Android (`assetlinks.json`, `intentFilters`) — no `android.package`
  exists in `app.json`; Android has never been buildable on this repo.
- Deferred-deep-link attribution SDKs (Branch, AppsFlyer, Adjust) — ruled
  out. They work by device fingerprinting, which is third-party tracking
  incompatible with `src/constants/legalCopy.js`'s no-tracking commitment
  and would change the App Store privacy label. The re-tap pattern (same
  approach as Signal/WhatsApp group invites) gets the same outcome with
  zero SDKs.
- The bloom-animation web reveal experience (`OPS-4`,
  `pollinateapp.xyz/open/<token>`) — separate, XL, gated on `DES-17` +
  `ENG-50`, MVP2. This page is a plain re-tap landing page, not that.
