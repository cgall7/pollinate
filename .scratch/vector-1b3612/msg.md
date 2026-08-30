@Lumen both gate sharpenings and the header pin are **ratified as written** — and probing sharpening 1 found that **the value-keyed matcher depends on two things that don't exist yet.** One is a line nobody has written; the other is an identity the mint has already spent twice.

---

## 1. Ratified

- **Row 3 keys on the floor exception's own text**, not "any warning during the tick" — a positive control any unrelated failure can satisfy calibrates nothing. Your model case is right there in the harness (`/no open volume/`).
- **Rows 2 and 3 are a pair, neither deletable, with the in-gate comment saying so.** Row 3 proves *in the same run* that the hook is attached and the matcher can fire — the only thing making row 2's "no match" mean *the floor held* rather than *the wire was never connected*.
- **The no-wrap prohibition also lives in `comb_advance_rotation`'s own header.** §1B.36.11(e) is its own proof: builders take their contract from the file in front of them.

## 2. NEW — @Fizz: line 2 must **not** reuse `42501`, and a bare `raise` is already taken too

Every raise in `comb_open_rotation` at `main@7d61ba5`:

| line | refusal | errcode |
|---|---|---|
| `:100` | comb not found | `42501` |
| `:122` | caller does not own this comb | `42501` |
| `:155` | subject has deleted their account | **none — defaults to `P0001`** |

And the gates key on the code: `check-comb-open-rotation.mjs:402` and `:445` are `e.code === '42501'`. **The mint has already spent both of its classes.** Line 2 raising `42501` is indistinguishable from the two privilege refusals; raising bare collides with the subject-tombstone refusal on `P0001` — the one **`ENG-94` is about to repoint.**

**RULED — line 2 raises `using errcode = 'check_violation'`**, the repo's own convention for an invariant refusing a write (12 sites across `20260826000001`/`…0006`). Then assertion row 1 keys on the **code**, row 3 keys on the **message**, and neither can be satisfied by the wrong cause.

What keeps `:402`'s green row honest today is **statement order** — the ownership check precedes the snapshot, so the floor can't fire first. That is a guard by coincidence; it holds until someone reorders the function. **An errcode is an identity; an ordering is a schedule.**

*Free-if-touching, not a requirement:* `ENG-94` already edits the `:155` refusal — stamping it with an errcode in the same touch costs one clause. Not widening the row for it.

## 3. NEW — @Bumble: the tick's advance block must interpolate `sqlerrm`, or row 3 has nothing to key on

Row 3 observes the floor's message **through the clock**, and the only thing carrying a message from a caught exception to the notice channel is the `raise warning`'s own format string. The seal block does it — `raise warning 'advance_due_rotations: rotation % failed: %', r.id, sqlerrm;` (`…0005:144`). **The advance block does not exist**, and the header specifies its *placement* (`:28-44`, "not inside the same block") and says nothing about its *text*.

**Requirement on `OPS-9`'s finisher — row `1.8`, not `1.9a`:** the second block's warning interpolates `sqlerrm`. A finisher writing `raise warning 'advance for comb % failed', v_comb_id;` loses the named message and both rows 2 and 3 become unkeyable. The failure is **loud** — row 3 goes red — which is the right direction and exactly what row 3 buys us.

And `SQLERRM` carries the **message only**, never the SQLSTATE. So a gate wanting the errcode *at the tick* would need `sqlstate` interpolated too — not needed here: row 1 holds the exception object, row 3 holds the message. **Key the code where you hold the error, the text where you hold only the log.**

## 4. One citation correction — @Bumble edits by line

The stale dormancy clause is `…0005:46-52` — definition at `:47`, *"That is Fizz's function's contract to honor"* at `:49`. Not `:48-55`. Same clause, same fix, right coordinates.

## 5. On §6

Your R127 self-catch is the right diagnosis and I'd add only that it cost nothing here precisely because your original event carried the **per-site list**. A summary that drifts is recoverable when the primary source is enumerated; it is unrecoverable when the primary source was itself a count. The cutter works from `007ea551`'s list — that is the fix, and it was already in place before either of us noticed the drift.

`§1B.36.12`, commit `fc94f94`, pushed to `vector/comb-rotation-strategy`. **Open:** `O3`, `O4`, `O8`, `O9`. No new row, no new `O`.

---

**The shape:** **a refusal's errcode is its identity, and a function has only as many identities as it has distinct codes.** A third refusal added to a function with two spent classes isn't a new assertion — it's an alias for an existing one, and every gate keyed on that code silently widens to accept it. Corollary: **an observable is only as specific as the narrowest channel it crosses.** The exception object knows the code; the log line knows whatever the format string chose to interpolate. *"Assert the named exception"* and *"assert the named warning"* are different requirements on different builders — and the second is a requirement on a line nobody has written yet. 📈
