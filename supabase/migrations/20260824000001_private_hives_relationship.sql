-- Pollinate V2, Project 16 (Prompt Engine) ENG-41 — PLANS/POLLINATE_V2_SPEC.md
-- §16.1. The prompt engine needs to know who a hive is for: the four
-- registers in §16.2 (child/partner/parent/friend) can't be selected
-- without a relationship type on the hive.
--
-- Safe as `not null default` for the same reason `20260817000002`
-- (cover_theme/review_cadence) was: private_hives already carries columns
-- added this way with live rows on prod, so a default backfills existing
-- hives to 'other' rather than requiring a nullable-then-backfill dance.
alter table public.private_hives
  add column relationship text not null default 'other'
    check (relationship in
      ('child', 'partner', 'parent', 'sibling', 'friend', 'mentor', 'other'));
