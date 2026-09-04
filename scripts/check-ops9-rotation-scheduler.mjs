// Gate for OPS-9's rotation-sweep function
// (supabase/migrations/20260830000012_ops9_rotation_scheduler.sql).
//
//   npm run check:ops9-rotation-scheduler
//
// What this gate can and cannot prove: nothing in this repo's toolchain can
// start pg_cron's background worker, so this never exercises the schedule
// itself — that half is documented as an assumption in the migration's own
// header (Supabase-managed Postgres ships pg_cron preloaded; this build's
// embedded-postgres genuinely does not have the extension available at
// all, confirmed below rather than assumed). What IS proven against a real
// Postgres:
//
//   advance_due_rotations() finds every rotation whose closes_at has
//   passed and is still unresolved, across more than one comb in the same
//   sweep, and calls seal_and_send_rotation on each — reusing that
//   function's own deliver/void logic rather than re-deriving it.
//   A rotation whose window has not closed yet is left completely
//   untouched by a sweep — not an error, just skipped.
//   An already-resolved rotation (sealed+sent, or voided) is left alone by
//   a second sweep — batch-level idempotency, riding on
//   seal_and_send_rotation's own row-level idempotency check.
//   One rotation raising inside the loop does not stop the sweep from
//   advancing the others in the same call — the per-rotation subtransaction
//   this function wraps each iteration in is load-bearing, not decorative.
//   Grant boundary: advance_due_rotations is service_role-only, same
//   posture as seal_and_send_rotation and for the same reason (no
//   auth.uid() anywhere in either function's body).
//   The pg_cron guard blocks in the migration actually took their no-op
//   branch here (extension genuinely absent), which is the only way this
//   gate's own successful migration replay is evidence the guard works
//   rather than evidence pg_cron happened to be present.
//
// Modeled on check-comb-rotation-seal-send.mjs for the harness shape: real
// migrations off disk in full chronological order, the same mintRotation
// fixture shape, service_role called with no session at all.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-ops9-rotation-scheduler: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-ops9-rotation-scheduler: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

const OWNER = '11111111-1111-1111-1111-111111111111';
const SUBJECT = '22222222-2222-2222-2222-222222222222';
const CONTRIBUTOR = '33333333-3333-3333-3333-333333333333';
const OWNER2 = '66666666-6666-6666-6666-666666666666';
const SUBJECT2 = '77777777-7777-7777-7777-777777777777';
const CONTRIBUTOR2 = '88888888-8888-8888-8888-888888888888';
const SUBJECT_BROKEN = '99999999-9999-9999-9999-999999999998';
const CONTRIBUTOR_BROKEN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OWNER3 = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const SUBJECT3 = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const CONTRIBUTOR3 = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
const OWNER4 = 'ffffffff-ffff-ffff-ffff-fffffffffffe';
const SUBJECT4 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const CONTRIBUTOR4 = 'cbcbcbcb-cbcb-cbcb-cbcb-cbcbcbcbcbcb';

let pass = 0;
const failures = [];
const ok = (name) => {
  pass += 1;
  console.log(`  ok   ${name}`);
};
const bad = (name, detail) => {
  failures.push(`${name} — ${detail}`);
  console.log(`  FAIL ${name}\n         ${detail}`);
};
const firstLine = (e) => e.message.split('\n')[0].slice(0, 120);

const SUPABASE_ENV = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant anon, authenticated, service_role to postgres;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    )::uuid;
  $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text,
    owner uuid
  );
  alter table storage.objects enable row level security;
  create function storage.foldername(n text) returns text[] language sql immutable as $$
    select string_to_array(n, '/');
  $$;
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

async function main() {
  const dataDir = path.join(ROOT, '.ops9-rotation-scheduler-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // Distinct from every other gate's port (54329-54336) so this can run
    // concurrently with the rest of the suite.
    port: 54337,
    persistent: false,
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase('app');
  const client = pg.getPgClient('app');
  await client.connect();
  const warnings = [];
  client.on('notice', (n) => warnings.push(n.message || String(n)));

  try {
    await client.query(SUPABASE_ENV);
    for (const file of APPLY) {
      const sql = fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');
      try {
        await client.query(sql);
      } catch (e) {
        throw new Error(`replaying ${file}: ${e.message}`);
      }
    }

    // 0. The guard's premise, checked rather than assumed: this build
    // genuinely has no pg_cron, so the migration's DO-block guards took
    // their no-op branch, not their real one. If this ever reads
    // otherwise, the gates above (which replay every migration
    // unconditionally) would already be evidence the guard's OTHER branch
    // works; this row exists so a green suite here can't be silently
    // mistaken for that proof.
    {
      const { rows } = await client.query(
        "select exists (select 1 from pg_available_extensions where name = 'pg_cron') as available, " +
          "exists (select 1 from pg_extension where extname = 'pg_cron') as installed"
      );
      if (rows[0].available === false && rows[0].installed === false) {
        ok('pg_cron is genuinely unavailable in this build — the migration guard took its no-op branch, not its real one');
      } else {
        bad(
          'pg_cron is genuinely unavailable in this build — the migration guard took its no-op branch, not its real one',
          JSON.stringify(rows[0])
        );
      }
    }

    await client.query(
      'insert into auth.users (id, raw_user_meta_data) values ' +
        Array.from({ length: 14 }, (_, i) => `($${2 * i + 1}, $${2 * i + 2})`).join(', '),
      [
        OWNER, JSON.stringify({ display_name: 'Owner' }),
        SUBJECT, JSON.stringify({ display_name: 'Subject' }),
        CONTRIBUTOR, JSON.stringify({ display_name: 'Contributor' }),
        OWNER2, JSON.stringify({ display_name: 'Owner Two' }),
        SUBJECT2, JSON.stringify({ display_name: 'Subject Two' }),
        CONTRIBUTOR2, JSON.stringify({ display_name: 'Contributor Two' }),
        SUBJECT_BROKEN, JSON.stringify({ display_name: 'Subject Broken' }),
        CONTRIBUTOR_BROKEN, JSON.stringify({ display_name: 'Contributor Broken' }),
        OWNER3, JSON.stringify({ display_name: 'Owner Three' }),
        SUBJECT3, JSON.stringify({ display_name: 'Subject Three' }),
        CONTRIBUTOR3, JSON.stringify({ display_name: 'Contributor Three' }),
        OWNER4, JSON.stringify({ display_name: 'Owner Four' }),
        SUBJECT4, JSON.stringify({ display_name: 'Subject Four' }),
        CONTRIBUTOR4, JSON.stringify({ display_name: 'Contributor Four' }),
      ]
    );

    const asPostgres = async (fn) => {
      await client.query("select set_config('role', 'postgres', true)");
      return fn();
    };
    const asUser = async (uid, fn) => {
      await client.query('begin');
      try {
        await client.query("select set_config('role', 'authenticated', true)");
        await client.query("select set_config('request.jwt.claims', $1, true)", [
          JSON.stringify({ sub: uid, role: 'authenticated' }),
        ]);
        const result = await fn();
        await client.query('commit');
        return result;
      } catch (e) {
        await client.query('rollback');
        throw e;
      }
    };
    // The real caller shape for both functions under test: service_role,
    // no request.jwt.claims at all — matching a headless scheduler, not
    // "authenticated with sub=null".
    const asService = async (fn) => {
      await client.query('begin');
      try {
        await client.query("select set_config('role', 'service_role', true)");
        await client.query("select set_config('request.jwt.claims', '', true)");
        const result = await fn();
        await client.query('commit');
        return result;
      } catch (e) {
        await client.query('rollback');
        throw e;
      }
    };

    async function mintRotation({ owner, subject, contributors, closesAt = "now() - interval '1 hour'" }) {
      const { rows: combRows } = await asUser(owner, () =>
        client.query("insert into public.combs (owner_id, name) values ($1, 'Test Comb') returning id", [owner])
      );
      const combId = combRows[0].id;

      await asPostgres(() =>
        client.query(
          'insert into public.comb_members (comb_id, profile_id) values ($1, $2), ($1, $3) on conflict do nothing',
          [combId, subject, contributors[0]]
        )
      );

      const { rows: hiveRows } = await asUser(owner, () =>
        client.query(
          "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Rotation', $2, true) returning id",
          [owner, subject]
        )
      );
      const hiveId = hiveRows[0].id;

      for (const c of contributors) {
        await asUser(owner, () =>
          client.query(
            'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)',
            [hiveId, c, owner]
          )
        );
      }

      const { rows: rotRows } = await asUser(owner, () =>
        client.query(
          `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
           values ($1, 1, $2, $3, ${closesAt}) returning id`,
          [combId, hiveId, subject]
        )
      );
      return { combId, hiveId, rotationId: rotRows[0].id };
    }

    async function volumeIdFor(hiveId) {
      const { rows } = await asPostgres(() =>
        client.query('select id from public.hive_volumes where hive_id = $1 and sealed_at is null', [hiveId])
      );
      return rows[0]?.id;
    }

    async function rotationState(id) {
      const { rows } = await client.query(
        'select sealed_at, sent_at, voided_at, voided_reason, seal_attempts, seal_dead_lettered_at ' +
          'from public.comb_rotations where id = $1',
        [id]
      );
      return rows[0];
    }

    // ---------------------------------------------------------------
    // 1/2. Two due rotations, two different combs, one sweep call — proves
    // the sweep is a real batch, not a single-row convenience wrapper.
    const due1 = await mintRotation({ owner: OWNER, subject: SUBJECT, contributors: [CONTRIBUTOR] });
    const due1Volume = await volumeIdFor(due1.hiveId);
    await asUser(CONTRIBUTOR, () =>
      client.query(
        "insert into public.entries (user_id, hive_id, volume_id, content, entry_date) values ($1, $2, $3, 'For Subject', current_date)",
        [CONTRIBUTOR, due1.hiveId, due1Volume]
      )
    );
    const due2 = await mintRotation({ owner: OWNER2, subject: SUBJECT2, contributors: [CONTRIBUTOR2] });
    // due2 gets no entries — it should void-quiet, still counting as
    // "advanced" (resolved), just not delivered.

    // 3. A rotation whose window has not closed yet — must be untouched.
    const notYet = await mintRotation({
      owner: OWNER,
      subject: SUBJECT,
      contributors: [CONTRIBUTOR],
      closesAt: "now() + interval '1 day'",
    });

    await asService(() => client.query('select public.advance_due_rotations()'));

    {
      const r = await rotationState(due1.rotationId);
      if (r.sealed_at && r.sent_at && !r.voided_at) {
        ok('sweep: due rotation with entries is delivered (sealed + sent)');
      } else {
        bad('sweep: due rotation with entries is delivered (sealed + sent)', JSON.stringify(r));
      }
    }
    {
      const r = await rotationState(due2.rotationId);
      if (!r.sealed_at && !r.sent_at && r.voided_at && r.voided_reason === 'quiet') {
        ok('sweep: second due rotation, different comb, same sweep call, correctly void-quiet');
      } else {
        bad('sweep: second due rotation, different comb, same sweep call, correctly void-quiet', JSON.stringify(r));
      }
    }
    {
      const r = await rotationState(notYet.rotationId);
      if (!r.sealed_at && !r.sent_at && !r.voided_at) {
        ok('sweep: a rotation whose window has not closed is left completely untouched');
      } else {
        bad('sweep: a rotation whose window has not closed is left completely untouched', JSON.stringify(r));
      }
    }

    // ---------------------------------------------------------------
    // 4. Batch-level idempotency: sweeping again after everything already
    // resolved changes nothing (riding on seal_and_send_rotation's own row
    // lock + idempotency check, proven here at the sweep's caller level).
    {
      const before = [await rotationState(due1.rotationId), await rotationState(due2.rotationId)];
      await asService(() => client.query('select public.advance_due_rotations()'));
      const after = [await rotationState(due1.rotationId), await rotationState(due2.rotationId)];
      if (JSON.stringify(before) === JSON.stringify(after)) {
        ok('sweep: re-running after everything resolved changes nothing');
      } else {
        bad('sweep: re-running after everything resolved changes nothing', `before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
      }
    }

    // ---------------------------------------------------------------
    // 5. Error isolation: one rotation whose underlying hive has no open
    // volume (seal_and_send_rotation's own defensive, "should be
    // unreachable under any path this migration creates" raise — forced
    // here by sealing the volume out from under it directly, bypassing the
    // RPC) must not stop a healthy rotation in the SAME sweep call from
    // advancing. Both minted before the sweep, one sweep call, one broken.
    const healthy = await mintRotation({ owner: OWNER, subject: SUBJECT2, contributors: [CONTRIBUTOR2] });
    const healthyVolume = await volumeIdFor(healthy.hiveId);
    await asUser(CONTRIBUTOR2, () =>
      client.query(
        "insert into public.entries (user_id, hive_id, volume_id, content, entry_date) values ($1, $2, $3, 'For Subject Two', current_date)",
        [CONTRIBUTOR2, healthy.hiveId, healthyVolume]
      )
    );
    const broken = await mintRotation({
      owner: OWNER2,
      subject: SUBJECT_BROKEN,
      contributors: [CONTRIBUTOR_BROKEN],
    });
    await asPostgres(() =>
      // Directly seal the volume out from under the rotation, without going
      // through seal_and_send_rotation — the one way to reach its "hive has
      // no open volume" branch, since that function is otherwise the only
      // thing that can ever seal a rotation hive's volume.
      client.query('update public.hive_volumes set sealed_at = now() where hive_id = $1', [broken.hiveId])
    );

    warnings.length = 0;
    await asService(() => client.query('select public.advance_due_rotations()'));

    {
      const r = await rotationState(healthy.rotationId);
      if (r.sealed_at && r.sent_at && !r.voided_at) {
        ok('sweep: a broken rotation in the same call does not block a healthy one from advancing');
      } else {
        bad('sweep: a broken rotation in the same call does not block a healthy one from advancing', JSON.stringify(r));
      }
    }
    {
      const r = await rotationState(broken.rotationId);
      if (!r.sealed_at && !r.sent_at && !r.voided_at) {
        ok('sweep: the broken rotation itself stays unresolved (its failure did not silently mark it done)');
      } else {
        bad('sweep: the broken rotation itself stays unresolved (its failure did not silently mark it done)', JSON.stringify(r));
      }
    }
    {
      const surfaced = warnings.some((w) => /advance_due_rotations/.test(w) && /no open volume/.test(w));
      if (surfaced) {
        ok('sweep: the broken rotation\'s failure is surfaced as a WARNING (not swallowed silently)');
      } else {
        bad(
          "sweep: the broken rotation's failure is surfaced as a WARNING (not swallowed silently)",
          `captured notices: ${JSON.stringify(warnings)}`
        );
      }
    }

    // ---------------------------------------------------------------
    // 5b. Terminal exit (20260904000001, filed against Vector's finding —
    // any permanently-failing seal re-matches the tick's own WHERE clause
    // forever). Reuses `broken` from section 5 above: its underlying hive
    // has no open volume, so seal_and_send_rotation raises identically on
    // every sweep — the exact "same failure class nobody has imagined
    // yet" shape the ruling asked this row to survive, not the
    // now-withdrawn null-subject one. `broken` already carries one failed
    // attempt from section 5's sweep; four more reach the cap of 5.
    for (let i = 0; i < 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await asService(() => client.query('select public.advance_due_rotations()'));
    }
    {
      const r = await rotationState(broken.rotationId);
      if (r.seal_attempts === 5 && r.seal_dead_lettered_at && !r.sealed_at && !r.voided_at) {
        ok('dead letter: cap reached at attempt 5 — seal_dead_lettered_at set, still genuinely unresolved (not voided, not sealed)');
      } else {
        bad(
          'dead letter: cap reached at attempt 5 — seal_dead_lettered_at set, still genuinely unresolved (not voided, not sealed)',
          JSON.stringify(r)
        );
      }
    }
    {
      const surfaced = warnings.some(
        (w) => /advance_due_rotations/.test(w) && /rotation .* dead-lettered after 5 attempts/.test(w) && /no open volume/.test(w)
      );
      if (surfaced) {
        ok('dead letter: the attempt that crosses the cap is logged with "dead-lettered" and still carries sqlerrm');
      } else {
        bad(
          'dead letter: the attempt that crosses the cap is logged with "dead-lettered" and still carries sqlerrm',
          `captured notices: ${JSON.stringify(warnings)}`
        );
      }
    }
    {
      // Positive control: comb_rotations_one_open_per_comb still counts
      // the dead-lettered row as open — a human has to clear it, the
      // schema must not let the comb quietly grow a second rotation
      // around it. A genuinely DISTINCT hive (not `broken.hiveId` again)
      // so the failure is the partial unique index this row is actually
      // testing, not comb_rotations' separate `unique (hive_id)`.
      const { rows: secondHiveRows } = await asUser(OWNER2, () =>
        client.query(
          "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) " +
            "values ($1, 'Second Hive', $2, true) returning id",
          [OWNER2, SUBJECT_BROKEN]
        )
      );
      let blocked = false;
      try {
        await asPostgres(() =>
          client.query(
            "insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at) " +
              "values ($1, 2, $2, $3, now() + interval '1 day')",
            [broken.combId, secondHiveRows[0].id, SUBJECT_BROKEN]
          )
        );
      } catch (e) {
        blocked = /comb_rotations_one_open_per_comb/i.test(e.message);
      }
      if (blocked) {
        ok('dead letter: a dead-lettered rotation still counts as "open" — the comb cannot mint a second one around it');
      } else {
        bad('dead letter: a dead-lettered rotation still counts as "open" — the comb cannot mint a second one around it', 'insert unexpectedly succeeded or wrong constraint');
      }
    }
    {
      // One more sweep: the dead-lettered row must never be attempted
      // again — no new warning naming it, attempts/timestamp unchanged.
      const before = await rotationState(broken.rotationId);
      warnings.length = 0;
      await asService(() => client.query('select public.advance_due_rotations()'));
      const after = await rotationState(broken.rotationId);
      const mentionedAgain = warnings.some((w) => w.includes(broken.rotationId));
      if (JSON.stringify(before) === JSON.stringify(after) && !mentionedAgain) {
        ok('dead letter: excluded from every later sweep — the tick stops re-arming on it entirely');
      } else {
        bad(
          'dead letter: excluded from every later sweep — the tick stops re-arming on it entirely',
          `before=${JSON.stringify(before)} after=${JSON.stringify(after)} warnings=${JSON.stringify(warnings)}`
        );
      }
    }

    // ---------------------------------------------------------------
    // 6/7. §1B.36.19's clock-boundary pair, moved onto this row's own
    // acceptance because it could not run at 1.9a's landing --
    // advance_due_rotations() didn't call comb_advance_rotation yet.
    // UNDELETABLE PAIR: row 7 (floor stripped) is the only thing that
    // distinguishes "the floor held" from "nothing happened" -- row 6
    // alone is green on a tick that never advances at all, or on a
    // notice hook that was never attached.
    //
    // What "floor stripped" can and can't mean here, spelled out because
    // it isn't obvious from the ticket text: ENG-100's empty-roster
    // check_violation cannot be reached through a GENUINE call to
    // comb_advance_rotation today. Its own >=2-enrollable guard draws the
    // next subject from the exact same predicate the mint's roster
    // snapshot excludes that subject FROM (adopt-don't-copy, §1B.36.10)
    // -- so roster size is always enrollable_count - 1 >= 1 whenever the
    // guard lets the mint proceed. That coupling is correct and is what
    // this pair is really protecting: if a future migration ever edits
    // one predicate without the other, the floor becomes reachable again
    // and this row is what would need to catch it -- but there is no
    // real DATA STATE to construct against the CURRENT, correctly-coupled
    // code. So row 7 proves the narrower, still-real claim: the TICK
    // converts a raise from inside comb_advance_rotation's call chain
    // into a warning carrying sqlerrm, rather than swallowing it --
    // by temporarily replacing comb_advance_rotation with a stub that
    // raises ENG-100's exact exception, running the real tick against
    // it, then restoring the genuine function from its own
    // pg_get_functiondef() capture. Same "reach an otherwise-unreachable
    // branch by direct manipulation" idiom section 5 above already uses
    // on hive_volumes, one call-boundary further in.
    const floorIntact = await mintRotation({ owner: OWNER3, subject: SUBJECT3, contributors: [CONTRIBUTOR3] });
    warnings.length = 0;
    await asService(() => client.query('select public.advance_due_rotations()'));
    {
      const surfaced = warnings.some((w) => /no enrollable contributors/.test(w));
      if (!surfaced) {
        ok('clock boundary: floor intact -- a healthy advance raises no floor-violation warning');
      } else {
        bad('clock boundary: floor intact -- a healthy advance raises no floor-violation warning', JSON.stringify(warnings));
      }
    }
    {
      // A tick that silently did nothing would also pass the assertion
      // above for the wrong reason (§1B.36.11's own point about the
      // no-warning row) -- confirm the comb actually gained a second,
      // open rotation.
      const { rows } = await client.query(
        'select count(*)::int as n from public.comb_rotations where comb_id = $1',
        [floorIntact.combId]
      );
      if (rows[0].n === 2) {
        ok('clock boundary: floor intact -- the advance actually minted a second rotation, not a silent no-op');
      } else {
        bad(
          'clock boundary: floor intact -- the advance actually minted a second rotation, not a silent no-op',
          `rotations for comb: ${rows[0].n}`
        );
      }
    }

    const { rows: defRows } = await asPostgres(() =>
      client.query("select pg_get_functiondef('public.comb_advance_rotation(uuid)'::regprocedure) as def")
    );
    const realCombAdvanceRotationDef = defRows[0].def;
    await asPostgres(() =>
      client.query(`
        create or replace function public.comb_advance_rotation(p_comb_id uuid)
        returns uuid
        language plpgsql
        security definer
        set search_path = public, pg_temp
        as $stub$
        begin
          raise exception 'comb_open_rotation: no enrollable contributors for this rotation'
            using errcode = 'check_violation', constraint = 'comb_open_rotation_enrollable_floor';
        end;
        $stub$;
      `)
    );
    try {
      const floorStripped = await mintRotation({ owner: OWNER4, subject: SUBJECT4, contributors: [CONTRIBUTOR4] });
      const floorStrippedVolume = await volumeIdFor(floorStripped.hiveId);
      await asUser(CONTRIBUTOR4, () =>
        client.query(
          "insert into public.entries (user_id, hive_id, volume_id, content, entry_date) values ($1, $2, $3, 'For Subject Four', current_date)",
          [CONTRIBUTOR4, floorStripped.hiveId, floorStrippedVolume]
        )
      );
      warnings.length = 0;
      await asService(() => client.query('select public.advance_due_rotations()'));
      {
        const surfaced = warnings.some(
          (w) => /advance_due_rotations: advance for comb/.test(w) && /no enrollable contributors/.test(w)
        );
        if (surfaced) {
          ok('clock boundary: floor stripped -- the tick surfaces it as a WARNING with sqlerrm (the positive control)');
        } else {
          bad(
            'clock boundary: floor stripped -- the tick surfaces it as a WARNING with sqlerrm (the positive control)',
            `captured notices: ${JSON.stringify(warnings)}`
          );
        }
      }
      {
        // The stub raised AFTER seal_and_send_rotation already committed
        // -- the seal must survive regardless, proving the two
        // begin/exception blocks are separate subtransactions (§1B.31.2),
        // not just separately worded.
        const r = await rotationState(floorStripped.rotationId);
        if (r.sealed_at && r.sent_at && !r.voided_at) {
          ok('clock boundary: floor stripped -- the seal still committed even though the advance raised');
        } else {
          bad('clock boundary: floor stripped -- the seal still committed even though the advance raised', JSON.stringify(r));
        }
      }
    } finally {
      await asPostgres(() => client.query(realCombAdvanceRotationDef));
    }

    // ---------------------------------------------------------------
    // 8. Grant boundary: not callable as authenticated or anon.
    try {
      await asUser(OWNER, () => client.query('select public.advance_due_rotations()'));
      bad('grant boundary: authenticated cannot call advance_due_rotations', 'call succeeded');
    } catch (e) {
      if (/permission denied/i.test(e.message)) {
        ok('grant boundary: authenticated cannot call advance_due_rotations');
      } else {
        bad('grant boundary: authenticated cannot call advance_due_rotations', `wrong error: ${firstLine(e)}`);
      }
    }
    try {
      await client.query('begin');
      await client.query("select set_config('role', 'anon', true)");
      await client.query("select set_config('request.jwt.claims', '', true)");
      await client.query('select public.advance_due_rotations()');
      await client.query('rollback');
      bad('grant boundary: anon cannot call advance_due_rotations', 'call succeeded');
    } catch (e) {
      await client.query('rollback').catch(() => {});
      if (/permission denied/i.test(e.message)) {
        ok('grant boundary: anon cannot call advance_due_rotations');
      } else {
        bad('grant boundary: anon cannot call advance_due_rotations', `wrong error: ${firstLine(e)}`);
      }
    }

    console.log(`\ncheck-ops9-rotation-scheduler: ${pass} passed, ${failures.length} failed`);
    if (failures.length > 0) {
      console.log('\nFailures:');
      failures.forEach((f) => console.log(`  - ${f}`));
      process.exitCode = 1;
    }
  } finally {
    await client.end();
    await pg.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

// embedded-postgres pulls in async-exit-hook, which hooks Node's 'beforeExit'
// and hard-exits 0 there — the only thing that preempts it is an explicit
// process.exit(), so a bare `process.exitCode = 1` set above is silently
// discarded once the event loop drains (Sage's finding, sage/suite-exitcode-
// fix, not yet merged — same fix applied here rather than shipping the sixth
// member of the class it exists to close). Exiting explicitly here runs
// after main()'s own finally block (client/pg cleanup) has already
// completed.
main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => {
    console.error('check-ops9-rotation-scheduler: FAILED —', e.message);
    process.exit(1);
  });
