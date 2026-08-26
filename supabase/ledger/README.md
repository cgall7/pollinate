# Nectar ledger

**The schema now lives at `../migrations/20260826000001_nectar_ledger.sql`,
and the 19a simulated-nectar service layer (B0 consent, account provisioning,
the starter grant, `record_zap()`) at
`../migrations/20260826000005_nectar_sim_service.sql`.** In 19a there is no
separate payments service: the SECURITY DEFINER RPCs in that second migration
are the only write path into the ledger, and the two product numbers they
carry (drops→microUSD rate, starter-grant size) are placeholders pending
Colin's ratification — see that file's header.

It started life here as `schema.sql`, deliberately kept out of `migrations/`
while two real-money questions were open — whether Strike extends an
agent-of-payee arrangement to third-party API customers, and what currency a
paid USD-quoted invoice actually settles in (`DESIGN.md` §9 and §13). On
2026-08-26 both were deferred out of the milestone (simulated nectar ships
before real sats), and Sage ruled the promotion authorized **in simulated mode
only**: `ledger_settings.rails_mode` defaults to `simulated`, and the schema's
own mode-guard trigger rejects any real (non-simulated) Strike observation
while that holds.

## The gate that remains

**Flipping `rails_mode` to `'live'` is still embargoed.** It is a separate
decision from applying the migration, and it needs §9 and §13 answered first —
in every environment, production or not. The migration's header carries the
same warning at the point where someone would eventually flip it.

## Contents

| File | What it is |
|---|---|
| `../migrations/20260826000001_nectar_ledger.sql` | The double-entry ledger: accounts, transactions, postings, Strike observation tables, invariant triggers, RLS |
| `../migrations/20260826000005_nectar_sim_service.sql` | The 19a service layer: `consent_to_nectar()`, `record_zap()`, zap attribution, the simulated starter grant |
| `DESIGN.md` | Why every decision is what it is, and what's still open |
| `verify/` | The assertion suite (it prints its own count) executed against a real Postgres, plus a mutation harness |

## Running the verification

`npm test` at the repo root runs the suite as `check:nectar-ledger` — the
runner discovers `scripts/check-nectar-ledger.mjs` like every other gate, and
the deps (`embedded-postgres`, `pg`) are the repo's own devDependencies. No
Docker and no network calls at run time: `embedded-postgres` runs a real
Postgres binary locally (port 55433 — see the port map in
`.github/workflows/test.yml`).

To run it standalone, or to run the mutation harness (which drops each guard
in turn and confirms the suite fails without it — manual, like
`preflight:prod-schema`):

```bash
cd supabase/ledger/verify
npm test          # applies both migrations to a real PG, asserts the invariants
npm run mutate    # drops each guard in turn, confirms the suite fails without it
```

Three of the mutation runs (`overdraft`, `balanced`, `fundmatch`) go red by
crash rather than by count: the 19a RPCs `SET CONSTRAINTS … IMMEDIATE` on
those triggers by name, so with the guard dropped the layer refuses to run at
all. That refusal is deliberate — see the migration's own comment.

Verified against Postgres 17.10 and 18.4.

## For whoever builds the payments service

Read the migration SQL rather than re-deriving its rules from chat. Two
constraints shape the service directly:

- `ledger_transactions.source_poll_id` references `strike_invoice_polls` — a
  record of an actual `GET /v1/invoices/<id>` response — and `kind = 'funding'`
  requires it. `strike_webhook_deliveries` has no foreign-key path into the
  ledger at all. A webhook handler can record that a nudge arrived; to credit
  anyone it has to go poll.
- Funding transactions key on `'fund:' || correlation_id` (unique), so the
  reconciliation sweep can poll a paid invoice repeatedly and credit exactly once.

`DESIGN.md` §11 has the full scope of what the service has to do.
