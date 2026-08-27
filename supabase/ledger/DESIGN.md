---
title: "Pollinate — Nectar Ledger Architecture"
tags: [pollinate, ledger, architecture, strike, custody]
status: active
created: 2026-08-13
author: Bumble
---

Assigned by Sage (channel, 2026-08-13T00:52): design the internal Supabase ledger
assuming Strike-as-rails — double-entry, transactions keyed to idempotent Strike
IDs, continuous reconciliation invariant. Builds directly on
[[STRIKE_API_SPIKE]] and [[STRIKE_INVOICE_WEBHOOK_SPEC]] (Fizz) and the custody
findings in [[MDK_NEXTJS_SPIKE]].

**Artifacts** (all in `supabase/ledger/`):
- `../migrations/20260826000001_nectar_ledger.sql` — the schema (promoted from `schema.sql` here on 2026-08-26, simulated mode only)
- `verify/` — 48 assertions executed against real Postgres, plus the mutation
  harness proving they discriminate (`npm test`, `npm run mutate`)

**Status: designed and executed, deliberately not applied anywhere.** The schema
runs clean on Postgres 17.10 and 18.4 with 48/48 assertions passing. It sits in
`supabase/ledger/` rather than `supabase/migrations/` precisely so that
`supabase db push` does not apply it: this must not exist in a live database
until the agent-of-payee question Sage raised is answered. Promoting it is a
one-line move when that lands. See `README.md` in this directory.

---

## 1. The one-sentence version

Postgres is the system of record for who owns what; Strike is a rail we
*reconcile against*, never a source of truth we copy balances from. Every
movement of value is a balanced double-entry transaction, and the properties we
care about — no overdrafts, no double-credits, no money invented by a webhook —
are enforced by database constraints rather than by application discipline.

## 2. Unit of account: integer sats (OVERRIDDEN from micro-USD, 2026-08-26)

> **OVERRIDE, not a correction.** Colin ratified a full override of this
> section's original choice — CEO thread, event `4b3258dc`, routed by Sage
> (channel `b57ad406`, thread `f10c9a4a`, 2026-08-26) — because the real rail
> this is headed for is Spark, a self-custodial BTC-native path where a
> USD-quoted invoice never made sense to begin with. Landed as
> `../migrations/20260826000006_nectar_sats_override.sql`: every
> `*_microusd` column renamed to `*_sats` in place (no rescale — this schema
> had shipped no real balances, so a rename is honest), `nectar_drop_microusd()`
> dropped (1 drop = 1 sat, exact, no conversion left to hold), starter grant
> unchanged in magnitude (500) with its meaning updated in its own comment.
> The reasoning below is preserved, not deleted — it was correct when written
> and stays correct as the tradeoff Colin is now knowingly accepting: **a
> sats-denominated balance no longer drifts in sats terms while sitting
> still, but it now drifts in USD terms while sitting still.** That drift is
> out of scope for this pass — DES-28 has no dollar-equivalent display, and
> `nectar.js`'s word reserve still only ever surfaces "drops".
>
> **One structural consequence worth flagging, not just a rename:** this
> override flips which leg of §9's FX question carries the risk. Pre-override,
> holding `strike_btc` was the exposed leg (a volatile asset against a
> fixed-USD liability). Post-override, our liabilities ARE sats — if a paid
> invoice lands as BTC, there is no conversion left to drift; the schema's own
> unit already matches the asset. The exposure moves to `strike_cash`
> instead: USD fiat held against a sats-denominated liability now needs
> marking the other way (USD → sats) to catch a shortfall. §9 has not been
> rewritten for this — the mechanism (`fx_mark`/`fx_reserve`/`ledger_solvency()`)
> still detects *an* asset write-down either way, but which leg to actually
> mark, and how, is an open question this migration does not answer.

`bigint`, integer satoshis. Never a float, never `numeric`, never a
USD-denominated column anywhere in this schema.

- **Why sats, not USD (as of the override):** see the box above — Colin's call,
  full override, driven by the eventual self-custodial BTC rail.
- **Why USD, not sats (the original call, superseded but not wrong at the
  time):** the product promised dollars (PRD §5, "the crypto is invisible"),
  and per Fizz's spike Strike invoices are USD-quoted natively. Storing sats
  and converting for display would make every user's balance silently depend
  on the BTC price at read time — the balance would visibly drift while
  sitting still. This is still true; it is the accepted tradeoff now, not a
  refuted claim.
- **Why micro-, not cents (moot post-override):** the minimum tip is ~$0.10
  (PRD §3.4). A 1% fee on a $0.10 tip is 0.1¢ — unrepresentable in cents, so
  fee math would round to zero or round the user's money away. Micro-USD gave
  4 decimal places of headroom below a cent. Sats have no sub-unit at all —
  they're already the smallest denomination — so this rationale has no
  referent anymore; kept here as the historical reason micro- was chosen over
  cents, not as live guidance.
- **Why integers at all (still true):** floats cannot represent money, and
  `numeric` invites rounding that silently breaks the sum-zero invariant. With
  integers, any rounding decision is *forced to be explicit* — a remainder has
  to be posted somewhere or the transaction won't commit. Sats being already
  integral removes the rounding problem entirely rather than just bounding it.

## 3. Sign convention

`amount_sats > 0` is a debit, `< 0` is a credit (`amount_microusd` before the
2026-08-26 sats override, §2), and every transaction's
postings sum to exactly zero. Assets therefore carry positive balances,
liabilities negative. A user's spendable nectar is a liability to them, so it is
stored negative; the `user_nectar_balances` view flips the sign so nothing
outside the schema ever sees a negative balance for a user in good standing.

One signed column rather than a debit/credit pair, because it makes the central
invariant a `sum() = 0` check instead of a comparison between two aggregates.

## 4. Account model

Bounded, not per-object. Two accounts per user (`user_available`,
`user_seed_escrow`) plus seven house accounts. In particular **there is no
account per seed** — seed identity lives on the *posting* (`seed_id`), and
`seed_escrow_balances` derives per-seed holdings from that. Per-seed accounts
would mean unbounded account growth for something the PRD expects users to do
twice a month, for no auditability gain: per-seed escrow is still provable to the
cent, it's just a filtered sum.

| Class | Accounts | Meaning |
|---|---|---|
| Asset | `strike_cash`, `strike_btc` | what we actually hold at Strike |
| Liability | `user_available`, `user_seed_escrow`, `withdrawal_pending` | what we owe users |
| Equity | `fee_income`, `fx_reserve` | our own money, and the buffer that absorbs FX drift |

## 5. The flows, in postings

| Flow | Debit | Credit |
|---|---|---|
| Funding ($10 in) | `strike_cash` +10 | `user_available:alice` −10 |
| Funding with fee | `strike_cash` +10 | `user_available:alice` −9.75, `fee_income` −0.25 |
| Tip | `user_available:alice` +1 | `user_available:bob` −1 |
| Seed plant | `user_available:alice` +5 | `user_seed_escrow:alice` −5 *(seed_id)* |
| Seed bloom | `user_seed_escrow:alice` +5 | `user_available:bob` −5 *(seed_id)* |
| Seed refund | `user_seed_escrow:alice` +5 | `user_available:alice` −5 |
| Withdrawal reserve | `user_available:bob` +3 | `withdrawal_pending` −3 |
| Withdrawal settle | `withdrawal_pending` +3 | `strike_cash` −3 |

Two things worth noting. **Escrowed seed funds stay a liability to the sender**,
not the recipient — a seed that never blooms is refundable, which answers PRD
open question §8.4 at the ledger level (the refund is just the reversing flow).
And **withdrawal is reserve-then-settle, never settle-then-debit**: the user is
debited *before* we ask Strike to send anything, so a duplicated or retried
payout call cannot overdraw them. The test suite asserts that reserved funds
become unspendable immediately.

## 6. Invariants

### I1 — every transaction balances *(hard, enforced)*
Deferred constraint trigger, fires at `COMMIT` rather than per-statement, because
a transaction is only balanced once all its legs are written. Also requires ≥2
postings, so a single-legged "transaction" can't exist.

### I2 — no user account ever carries a debit balance *(hard, enforced)*
No overdraft, and escrow cannot release more than was committed to it. This is
also what makes concurrent spending safe: the balance-cache upsert takes a row
lock, so a second spender blocks on the first rather than reading a stale
balance, and is then rejected at `COMMIT`. **Verified with two real concurrent
connections** — and mutation-tested: with the guard removed, two simultaneous $6
spends against a $10 balance both commit and the user ends holding a debit
balance. That's the double-spend, reproduced on demand.

### I3 — funding must match the invoice it claims *(hard, enforced)*
This one wasn't in the assignment and is the hole I found reviewing my own first
draft. "Funding requires a poll" only proves that *some* observed payment exists.
A bug that passed the wrong `user_id`, or credited $100 against a $10 invoice,
would satisfy every other constraint in the file and balance perfectly. The
trigger now ties the credit to the payer on the invoice and to the observed
amount: no account other than the payer's may appear in a funding transaction,
and what the user gets plus what we keep in fees must equal what actually
arrived.

### I4 — observations must match the rails mode *(hard, enforced)*
`ledger_settings.rails_mode` defaults to `simulated`, and recording a real Strike
observation while in that mode is a constraint violation. Sage's instruction was
"don't wire it to real money until the legal question is answered" — this makes
that a property of the database rather than something we have to remember.

### I5 — solvency *(continuous, monitored)*
**This is where I'd push back on the invariant as assigned.** Sage proposed
`sum of user balances == our actual Strike balance`. That equality is not
achievable and alerting on it would produce constant false positives, for three
reasons: money in flight between payment and sweep breaks it transiently;
escrowed seed funds are user-attributed but not in any user's spendable balance;
and any fee we ever take breaks it permanently.

The correct form is an *inequality*, and it collapses to something much simpler.
Because every transaction sums to zero, assets + liabilities + equity is
identically zero — so solvency reduces to **the sign of one number: our equity
must stay credit-normal (≤ 0)**. The moment it goes positive we owe users more
than we hold. `ledger_solvency()` returns assets, user liabilities, equity, the
coverage buffer, and a boolean — data rather than just a flag, so an alert can
say *how far* off we are.

External truth is a separate check: `custody_reconciliations` records our
`strike_cash` ledger balance against `GET /balances`, with the delta as a stored
column. Any nonzero delta is unrecorded money in either direction.

## 7. Webhooks cannot move money — structurally, not by convention

Fizz's spec makes the point that the `invoice.updated` payload says only *what
changed*, not the new value, so the authoritative read is
`GET /v1/invoices/<id>`. I've made that a schema property rather than a coding
rule:

- `strike_invoice_polls` records actual GET response bodies. Append-only.
- `ledger_transactions.source_poll_id` references **that table only**, and
  `kind = 'funding'` requires it to be non-null.
- `strike_webhook_deliveries` has **no foreign-key path into the ledger at all.**
  That absence is the design. The test suite asserts it against
  `information_schema` so a future migration can't quietly add one.

A webhook handler in this system can do exactly one thing: mark that a nudge
arrived. To move money it has to go poll.

Symmetrically, `internal_kinds_have_no_poll` stops a tip or a bloom from claiming
external authority it doesn't have.

## 8. Exactly-once crediting

Per Fizz: `correlationId` is **ours**, generated before the API call, and is
distinct from Strike's `invoiceId`. Two consequences in the schema:

- `strike_invoices` is written **before** `POST /v1/invoices`, with
  `strike_invoice_id` null until the response lands. A crash mid-call therefore
  leaves a claim we can reconcile, not an invoice at Strike we have no record of.
  The `strike_invoices_id_implies_confirmed` constraint keeps that state honest.
- Funding transactions use `idempotency_key = 'fund:' || correlation_id`, which
  is `unique`. The reconciliation sweep can poll the same paid invoice a hundred
  times and the user is credited exactly once — asserted in the suite.

Withdrawals get the same treatment: the `strike_payouts.id` we generate *before*
calling Strike is our idempotency key for the payout.

## 9. The FX question — the thing I'd most want answered

**Flagging this as an open question, not a finding — I have not verified it and
neither spike answers it.**

**Updated by the 2026-08-26 sats override (§2): this section's framing below is
pre-override and names the wrong leg.** Liabilities are sats now, not
USD — if a paid invoice lands as BTC, our sats-denominated liability and the
sats we hold no longer diverge on a price move, so `strike_btc` is no longer
the exposed side. `strike_cash` is: USD fiat held against a sats-denominated
liability is the leg that now needs a BTC-price mark to catch a shortfall.
Not re-litigated here — left as the open question this override created.

Per Fizz's spike, a Strike business account holds one balance that is *both* cash
and BTC, and our invoices are USD-quoted but paid in BTC. What I could not
determine from either spike: **when a USD-quoted Strike invoice is paid in BTC,
does the value land in our USD cash balance or our BTC balance?**

It matters a great deal, because our liability to users is USD-denominated by
design:

- If it lands as **USD cash**, there is no currency exposure and `strike_btc`
  stays empty. Good outcome.
- If it lands as **BTC**, we are holding a volatile asset against a fixed-dollar
  liability. A 30% drawdown doesn't reduce what we owe users by a cent — it makes
  us undercollateralized by 30% of the float, through no action of our own.

The schema is built to survive either answer: `strike_btc` and `fx_reserve`
exist, mark-to-market is an ordinary `fx_mark` transaction, and the solvency
function detects the shortfall. The test suite includes exactly this scenario —
$100 funded into BTC, BTC drops 30%, and the ledger reports insolvency with the
shortfall quantified at $30 rather than silently absorbing it.

This is a question for the same conversation as the licensing one: if the answer
is "it lands as BTC," someone needs to own a sweep-to-cash policy before real
money moves, and that's a business decision about who carries the risk, not an
engineering one.

## 10. Security posture

No client role may write to the ledger. Ever. RLS is on for all ten tables,
`anon`/`authenticated` are revoked from everything and granted only `select` on
their own rows, and every write goes through the payments service using the
service-role key.

Because Supabase's service-role key **bypasses RLS entirely**, the immutability
guarantee is enforced by table-level triggers rather than policies: postings and
transactions reject `UPDATE` and `DELETE` outright, for every role. A leaked or
misused service key can append a fraudulent transaction — which is detectable and
reversible — but cannot rewrite history to hide it. Corrections are reversing
transactions, never edits.

Views are pinned `security_invoker = true` so the policies actually apply to
reads through them (a `security_definer` view is the classic Supabase RLS
bypass).

## 11. What this means for Sage's "who owns the server" blocker

Confirming the shape from the ledger side, since it narrows the ask. The service
needs to do exactly four things:

1. Create invoices (write our row first, then call Strike).
2. Receive webhooks — verify HMAC over the **raw pre-parse body**, record, and
   nothing else.
3. Poll `GET /v1/invoices/<id>` for open invoices and write the resulting ledger
   transactions.
4. Run the reconciliation sweep: `ledger_solvency()`, cache verification, and
   `GET /balances` against `strike_cash`.

That's one HTTP endpoint and one cron job. It is genuinely small — but it is
stateful, holds the Strike API key and the service-role key, and cannot be
Supabase Edge Functions (raw-body HMAC) or the RN app. Fizz's 30-second
cross-currency quote expiry also lands here: quote regeneration is a server
concern, and the funding screen just re-renders what it's handed.

Worth noting the ledger is fully buildable and testable **before** any of that
exists — everything above was verified with zero network calls, and `rails_mode`
keeps it that way until someone deliberately flips it.

## 12. Verification

48 assertions, executed against real Postgres (17.10 and 18.4), covering every
invariant claimed above: balance enforcement, overdraft rejection, the concurrent
double-spend, idempotent replay, the funding/payer/amount binding, append-only
history, the full seed plant→bloom→refund lifecycle, reserve-before-send
withdrawal, the rails-mode tripwire, cache-vs-postings drift, and the FX
insolvency scenario.

Each guard was then **mutation-tested** — dropped one at a time to confirm the
suite actually fails without it (overdraft → 11 failures including a real double
spend; balanced → 2; funding-match → 2; immutability → 4; mode guard → 2). A test
that cannot fail proves nothing.

```bash
cd supabase/ledger/verify
npm install       # pulls a real Postgres binary; no Docker, no network calls at run time
npm test          # 48 assertions against the schema
npm run mutate    # drops each guard in turn, confirms the suite catches it
```

## 13. What I did not do

- **No legal opinion.** Nothing here changes whether we're allowed to operate this
  ledger; it's the same open question Sage flagged. The schema is the same either
  way, which is why it was safe to build now.
- **No live Strike calls.** Every Strike behaviour referenced is from Fizz's
  spikes, not independently re-verified by me. The create-subscription endpoint
  path is still the known gap in that spec.
- **Not applied to any database.** Deliberate — see the status note at the top.
- **No app-side integration.** No RN code, no service code, no repo changes.
