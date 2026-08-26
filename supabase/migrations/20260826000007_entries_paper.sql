-- ENTRY_EXPRESSION_BRIEF.md hardened spec (Sage, 2026-08-26): the one
-- persisted field the entry-papers feature needs. `null` = Cream, the
-- default, theme-tinted (renders as today's existing writing surface — no
-- new token). `'evening'` = the one paid choice, tint replaced entirely
-- (ruling 3: one ground channel, never two). No column for voice — it
-- auto-scales by length client-side, no user choice offered.
--
-- Follows the `entries.theme` precedent (20260813000006): nullable text, no
-- enum type — two values don't need a jsonb `expression` blob. Sealed-hive
-- immutability (20260815000006) already blocks writes to this column once a
-- hive is sealed, same UPDATE path as every other entry field — no new RLS.
alter table public.entries add column paper text;
alter table public.entries add constraint entries_paper_valid
  check (paper is null or paper = 'evening');
