-- Pollinate V2, Project 16 (Prompt Engine) ENG-43 — PLANS/POLLINATE_V2_SPEC.md
-- §16.4. Gratitude notes have a two-part shape: the moment (existing
-- `content`) + what it revealed. `reflection` is the second, optional
-- field ("Why it stayed with you") ComposeHiveEntry offers on hive
-- entries; journal entries never write it. Optional by design — forcing
-- both fields raises friction on the 20-second entry.
--
-- 500-char cap follows the `20260810000001_content_length_caps`
-- precedent. New column, no existing rows to violate the check, so a
-- plain (not NOT VALID) constraint is safe here — nothing to scan.
alter table public.entries add column reflection text;

alter table public.entries
  add constraint entries_reflection_length check (char_length(reflection) <= 500);
