-- ============================================================================
-- Pollinate — ENG-102 Garden aggregate reads.
--
-- Vector's dispatch (thread b57ad406, 2026-09-07, verified at
-- github/main@cf5edc3): Garden gains nectar received totals, top senders,
-- and impact. RecapTab.js has zero nectar/zap references today. Build the
-- READ layer only — the render surface is gated on DES-42.
--
-- TWO PRODUCERS, NOT ONE: nectar moves through two independent tables —
-- nectar_zaps (record_zap, 20260826000005) and comb_nectar_notes
-- (send_comb_nectar_note, 20260901000001). A read that unions only one
-- looks correct and silently undercounts every comb send. Every function
-- below is a UNION ALL over both.
--
-- DES-42, ruled by Lumen the same day, same thread, after this ticket was
-- filed: "the leaderboard does not exist." Top senders ranked by amount is
-- the Never Public mechanic pointed inward — it converts gifts into
-- standings. What ships instead: received totals and impact (aggregate,
-- fine) and senders as an UNRANKED set. get_nectar_senders below is built
-- to that ruling, not the ticket's original "top senders ranked" text:
--   - order is recency (last_sent_at desc), never magnitude — the function
--     does not even select amount_drops, so there is nothing to sort by
--     and nothing a client could sort by if it tried.
--   - per-sender amounts never leave the server for this surface. No sum,
--     no individual amount, in the returned columns, anywhere.
--
-- Name resolution needs SECURITY DEFINER for the same reason ENG-97 fixed
-- for organizer names: a comb_nectar_notes sender joined a comb by invite
-- code, so a honeycomb_connections friendship is usually NOT implied and
-- often does not exist — profiles_select_connections (20260809000005)
-- would silently drop that name. The join here is scoped to "someone who
-- sent auth.uid() nectar," which is a real need-to-know, mirroring
-- comb_co_member_names' authorization posture (20260830000002:391).
-- ============================================================================

create or replace function public.get_nectar_garden_totals()
returns table (received_drops bigint, sent_drops bigint, recipients_count bigint)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'get_nectar_garden_totals: not signed in';
  end if;

  return query
    with combined as (
      select sender_id, recipient_id, amount_drops from public.nectar_zaps
      union all
      select sender_id, recipient_id, amount_drops from public.comb_nectar_notes
    )
    select
      coalesce((select sum(c.amount_drops) from combined c where c.recipient_id = v_uid), 0)::bigint,
      coalesce((select sum(c.amount_drops) from combined c where c.sender_id = v_uid), 0)::bigint,
      coalesce((select count(distinct c.recipient_id) from combined c where c.sender_id = v_uid), 0)::bigint;
end;
$$;

comment on function public.get_nectar_garden_totals() is
  'Garden totals for the caller: nectar received, nectar sent, and distinct-recipient '
  'impact count — summed across both nectar_zaps and comb_nectar_notes (ENG-102).';

revoke all on function public.get_nectar_garden_totals() from public;
revoke execute on function public.get_nectar_garden_totals() from anon;
grant execute on function public.get_nectar_garden_totals() to authenticated;

-- Unranked, recency-only. Never selects amount_drops from either producer —
-- DES-42's "per-sender amounts never leave the server" holds by construction,
-- not by a client-side field the caller agrees not to render.
create or replace function public.get_nectar_senders()
returns table (sender_id uuid, display_name text, last_sent_at timestamptz)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'get_nectar_senders: not signed in';
  end if;

  return query
    with combined as (
      select z.sender_id, z.created_at from public.nectar_zaps z where z.recipient_id = v_uid
      union all
      select n.sender_id, n.created_at from public.comb_nectar_notes n where n.recipient_id = v_uid
    ),
    per_sender as (
      select c.sender_id, max(c.created_at) as last_sent_at
      from combined c
      group by c.sender_id
    )
    select ps.sender_id, pr.display_name, ps.last_sent_at
    from per_sender ps
    join public.profiles pr on pr.id = ps.sender_id
    order by ps.last_sent_at desc;
end;
$$;

comment on function public.get_nectar_senders() is
  'Distinct senders of nectar to the caller, unranked (DES-42): ordered by recency '
  'of most recent gift, never by amount. amount_drops is not selected by this '
  'function on either producer, so no per-sender sum can leave the server here.';

revoke all on function public.get_nectar_senders() from public;
revoke execute on function public.get_nectar_senders() from anon;
grant execute on function public.get_nectar_senders() to authenticated;

notify pgrst, 'reload schema';
