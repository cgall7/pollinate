# Pollinate Architecture Review — 2026-09-10

## Executive assessment

Pollinate has a coherent product model and unusually strong executable checks for database policy, copy, motion, and visual invariants. The main architectural risk is not missing intent; it is concentration. Feature orchestration, data fetching, animation, and rendering have accumulated in a small number of very large modules, while most tests inspect source structure rather than executing user flows.

The safest path is incremental: preserve the existing stores and database invariants, make boot and error boundaries reliable, then extract one feature seam at a time behind behavioral tests. A broad rewrite would discard more verified behavior than it removes debt.

## Current shape

- 162 JavaScript files and 36,130 lines under `src/`.
- 99 executable `scripts/check-*.mjs` gates and 56 ordered Supabase migrations.
- Supabase access is limited to the auth context and eight store modules. This is a good boundary worth preserving.
- Local persistence is limited to ten service modules. Screens do not access AsyncStorage directly.
- GitHub Actions installs from the lockfile and runs the complete gate suite on pushes and pull requests.

The largest production modules are:

| Module | Lines | Risk |
|---|---:|---|
| `src/screens/HoneycombTab.js` | 1,627 | Network orchestration, navigation, animation, and rendering share one lifecycle |
| `src/components/HoneycombGrid.js` | 1,368 | Geometry, gesture behavior, animation, and visual composition are coupled |
| `src/components/pollinationFlight.js` | 1,304 | Dense mathematical domain code with a large change surface |
| `src/components/FlyingBee.js` | 1,185 | Animation engine and React host responsibilities are intertwined |
| `src/screens/PackageOpen.js` | 1,075 | Reveal state machine, nectar actions, and presentation share one component |
| `src/services/HiveStore.js` | 933 | Several hive/rotation use cases share one static namespace |

## Findings

### 1. Bootstrap failures could strand the app

`App.js` previously advanced past the splash only when custom font loading fulfilled. `AuthContext.js` independently called `getSession()` and subscribed to `onAuthStateChange`, creating two session writers that could resolve out of order. Initial URL reads and the cold-start notification read also had no rejection handling, outside the render error boundary.

This review fixes that seam: font failure now falls back to system fonts, auth has one session source, cold-start reads are handled locally, and invite routing still runs when notification lookup fails. Supabase documents `INITIAL_SESSION` as the event for handling the initially loaded session in [`onAuthStateChange`](https://supabase.com/docs/reference/javascript/auth-onauthstatechange). `scripts/check-bootstrap-resilience.mjs` guards the failure paths.

### 2. Feature modules have crossed the maintainability threshold

The large modules above are not merely long style files. They combine state machines, I/O, navigation, calculations, and render trees. That makes safe reuse difficult and forces structural gates to depend on exact source placement.

Do not split by arbitrary line count. Extract in this order:

1. Pure selectors and transition functions.
2. Feature-specific hooks that own effects and cancellation.
3. Presentational sections with explicit input/output props.
4. Store modules by use case only after callers are covered behaviorally.

The first candidates are `HoneycombTab` loading/actions, `PackageOpen` reveal transitions, and `HoneycombGrid` geometry versus rendering.

### 3. The test pyramid is inverted

The 99 gates are valuable, but many parse source or enforce token-level structure. They catch drift in governed copy and design rules, yet they cannot prove React lifecycle behavior, navigation outcomes, cancellation, loading/error states, or a complete user journey.

Add a small behavioral layer before major extraction:

- React Native Testing Library for screen state and interaction tests.
- Store contract tests with a fake Supabase client.
- One navigation-level test each for onboarding, auth callback, entry save, comb invite, and package reveal.
- Keep structural gates only where source shape is itself the governed contract.

### 4. JavaScript boundaries are implicit

`tsconfig.json` extends Expo defaults, but nearly all production code is JavaScript and CI does not run `tsc`. Store payloads, navigation params, RPC results, and state-machine events therefore rely on comments and tests rather than compiler-checked contracts.

Adopt TypeScript at boundaries first: navigation param lists, store result types, RPC payloads, and pure state machines. Avoid a repository-wide conversion. New extracted modules should be TypeScript; touched legacy UI can remain JavaScript until its boundary is stable.

### 5. Dependency findings need framework-aligned remediation

`npm audit --omit=dev --json` reports 26 advisories: 7 high and 19 moderate, with no critical advisories. The high-severity paths are transitive through Expo/Metro build tooling (`metro`, `image-size`, `@xmldom/xmldom`, and `js-yaml`); React Navigation also has moderate advisories without a currently offered fix in this dependency graph.

Do not run `npm audit fix --force`: its suggested Expo downgrade is incompatible with the current Expo 57 / React Native 0.86 stack. Re-run the audit during each Expo patch upgrade and take only versions accepted by `npx expo install --check` and a native build.

### 6. Repository organization is horizontal, not feature-scalable

Global `screens/`, `components/`, and `services/` directories are understandable at the current size, but feature changes now span all three. New work should move toward feature folders with public entry points while shared visual primitives remain global. Existing files should move only when actively extracted, preserving blame and avoiding a disruptive tree rewrite.

## Target architecture

```text
src/
  app/                  navigation, providers, bootstrap
  features/
    journal/            screens, hooks, store facade, pure domain logic
    combs/
    hives/
    nectar/
    onboarding/
  shared/
    components/         visual primitives only
    services/           Supabase client, local storage, notifications
    theme/
    utils/
```

Dependencies should point inward: app composes features; features may use shared modules; shared modules never import a feature. Supabase and AsyncStorage remain behind service/store boundaries. Components should not initiate domain mutations unless they are explicitly feature controllers.

## Prioritized debt register

| Priority | Work | Exit condition |
|---|---|---|
| P0 | Bootstrap resilience | Land this review's fix and gate |
| P1 | Behavioral test foundation | Five critical flows execute through public interfaces in CI |
| P1 | Honeycomb screen extraction | Effects/actions live in a feature hook; render sections are isolated |
| P1 | Package reveal state machine | Transitions are pure, typed, and behaviorally tested |
| P2 | Honeycomb grid split | Geometry/animation planning is independent from React rendering |
| P2 | Store contracts | Shared auth/client helpers and typed RPC results remove repeated boundary code |
| P2 | Type and lint gates | `tsc --noEmit` and lint run in CI for migrated/new modules |
| P2 | Dependency maintenance | Expo-aligned audit has no actionable runtime high advisories |
| P3 | Feature-folder migration | New work follows inward dependency rules; old files move only when touched |

## Validation notes

- Targeted bootstrap, legacy migration, comb-invite, and initial-route gates pass after the fix.
- The full local suite was attempted from `github/main` plus this patch. Non-Postgres gates progressed normally, but concurrent local embedded-Postgres runs exhausted the machine's shared-memory segment limit. This is an environment collision, not a green suite claim; a clean full-suite run is still required before merge.
- Production dependency audit is reproducible with `npm audit --omit=dev --json`.
