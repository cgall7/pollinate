-- Found by Bumble while verifying 20260827000001/20260828000001's deploy
-- (Sage's escalation, thread this migration doesn't have a number for yet --
-- see channel 83a020e9, 2026-08-29). Not a ruled assignment; a regression
-- caught in the same sitting as the fix that introduced it, same posture as
-- 20260813000005 catching the identical class of bug for owns_entry().
--
-- 20260827000001 revoked execute on is_hive_contributor()/is_volume_open()
-- from anon (correctly matching this codebase's named-revoke convention),
-- but both are `language sql stable` -- simple enough for Postgres to inline
-- at query-rewrite time. Inlining checks EXECUTE permission when the
-- function is *referenced*, not only when a row actually reaches it, so any
-- anon request whose RLS evaluation can reach either function through ANY
-- path -- direct policy use, or transitively through a nested RLS subquery,
-- e.g. hive_contributors_insert_owner's WITH CHECK reads private_hives,
-- which runs private_hives_select_own, which calls is_hive_contributor --
-- now 500s with `42501 permission denied for function is_hive_contributor`
-- instead of the pre-migration behavior (silently 0 rows / policy-denied).
-- Verified live against prod as a genuinely unauthenticated anon-key
-- request: SELECT on entries/private_hives/hive_volumes, DELETE on entries,
-- INSERT on hive_contributors all hit this before this migration.
--
-- Fix is the same one 20260813000005 already proved safe for owns_entry(),
-- word for word: auth.uid() is null for a signed-out caller, so
-- is_hive_contributor()'s `c.profile_id = auth.uid()` and is_volume_open()'s
-- table lookup can never place anon inside a real hive's roster or as an
-- entry's actual author -- granting execute makes anon able to *call* the
-- function, not able to make it return anything but false/the underlying
-- row's real (non-anon-gated) state. No new data becomes reachable; only
-- the error surface changes, back to what every other table in this schema
-- already does for anon.
grant execute on function public.is_hive_contributor(uuid) to anon;
grant execute on function public.is_volume_open(uuid) to anon;

notify pgrst, 'reload schema';
