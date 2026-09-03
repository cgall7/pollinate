-- ============================================================================
-- Pollinate — ENG-90 comb nectar note transfer surface.
--
-- This migration adds an in-comb composition persistence row and a dedicated
-- send RPC that reuses the balanced tip transfer core with send_hive-style
-- authorization and idempotency semantics.
-- ============================================================================

create table public.comb_nectar_notes (
  id uuid primary key,
  comb_id uuid not null references public.combs (id) on delete restrict,
  transaction_id uuid not null unique references public.ledger_transactions (id) on delete restrict,
  sender_id uuid not null references public.profiles (id) on delete restrict,
  recipient_id uuid not null references public.profiles (id) on delete restrict,
  note_text text not null,
  amount_drops bigint not null check (amount_drops between 1 and 1000),
  created_at timestamptz not null default now(),

  constraint comb_nectar_notes_no_self_send check (sender_id <> recipient_id),
  constraint comb_nectar_notes_note_length check (char_length(note_text) between 1 and 280),
  constraint comb_nectar_notes_note_words check (
    array_length(regexp_split_to_array(btrim(note_text), '\s+'), 1) between 1 and 8
    and note_text = btrim(note_text)
  )
);

create index comb_nectar_notes_sender_idx on public.comb_nectar_notes (sender_id, created_at);
create index comb_nectar_notes_recipient_idx on public.comb_nectar_notes (recipient_id, created_at);
create index comb_nectar_notes_comb_idx on public.comb_nectar_notes (comb_id, created_at);

alter table public.comb_nectar_notes enable row level security;
revoke all on public.comb_nectar_notes from anon, authenticated;
grant select on public.comb_nectar_notes to authenticated;

create trigger comb_nectar_notes_immutable
  before update or delete on public.comb_nectar_notes
  for each row execute function public.ledger_forbid_mutation();

create policy "comb_nectar_notes_select_sender_or_recipient"
  on public.comb_nectar_notes for select
  to authenticated
  using (sender_id = auth.uid() OR recipient_id = auth.uid());

create or replace function public._nectar_send_tip(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_amount_drops bigint,
  p_idempotency_key_prefix text,
  p_memo text,
  p_error_prefix text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sats bigint;
  v_avail_sender uuid;
  v_avail_recipient uuid;
  v_balance bigint;
  v_txn uuid;
begin
  if p_amount_drops is null or p_amount_drops < 1 or p_amount_drops > 1000 then
    raise exception '%: amount must be between 1 and 1000 drops', p_error_prefix;
  end if;

  perform public.ledger_ensure_user_accounts(p_sender_id);
  perform public.ledger_ensure_user_accounts(p_recipient_id);

  v_sats := p_amount_drops; -- 1 drop = 1 sat, exact

  select a.id into v_avail_sender
    from public.ledger_accounts a
   where a.owner_user_id = p_sender_id and a.kind = 'user_available';
  select a.id into v_avail_recipient
    from public.ledger_accounts a
   where a.owner_user_id = p_recipient_id and a.kind = 'user_available';

  perform 1
     from public.ledger_account_balances b
    where b.account_id in (v_avail_sender, v_avail_recipient)
    order by b.account_id
      for update;

  select b.balance_sats into v_balance
    from public.ledger_account_balances b
   where b.account_id = v_avail_sender;

  if -v_balance < v_sats then
    raise exception '%: insufficient nectar (% drops available, % needed)',
      p_error_prefix, -v_balance, p_amount_drops;
  end if;

  insert into public.ledger_transactions (kind, idempotency_key, memo)
  values ('tip', p_idempotency_key_prefix, p_memo)
  returning id into v_txn;

  set constraints
    public.ledger_postings_balanced,
    public.ledger_postings_no_overdraft
    immediate;
  insert into public.ledger_postings (transaction_id, account_id, amount_sats)
  values (v_txn, v_avail_sender, v_sats),
         (v_txn, v_avail_recipient, -v_sats);
  set constraints
    public.ledger_postings_balanced,
    public.ledger_postings_no_overdraft
    deferred;

  return v_txn;
end;
$$;

comment on function public._nectar_send_tip(uuid, uuid, bigint, text, text, text) is
  'Internal sender->recipient tip transfer helper for ENG-90 and record_zap.';

revoke all on function public._nectar_send_tip(uuid, uuid, bigint, text, text, text) from public;
revoke execute on function public._nectar_send_tip(uuid, uuid, bigint, text, text, text) from anon, authenticated;

create or replace function public.record_zap(
  p_zap_id uuid,
  p_target_kind public.nectar_zap_target_kind,
  p_target_id uuid,
  p_amount_drops bigint
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_recipient uuid;
  v_existing record;
  v_entry record;
  v_hive record;
  v_txn uuid;
begin
  if v_uid is null then
    raise exception 'record_zap: not signed in';
  end if;
  if p_zap_id is null or p_target_id is null then
    raise exception 'record_zap: zap id and target are required';
  end if;
  if p_amount_drops is null or p_amount_drops < 1 or p_amount_drops > 1000 then
    raise exception 'record_zap: amount must be between 1 and 1000 drops';
  end if;

  if not exists (select 1 from public.nectar_consents c where c.user_id = v_uid) then
    raise exception 'record_zap: nectar consent required before zapping';
  end if;

  select z.transaction_id, z.sender_id, z.target_kind, z.target_id, z.amount_drops
    into v_existing
    from public.nectar_zaps z
   where z.id = p_zap_id;
  if found then
    if v_existing.sender_id = v_uid
       and v_existing.target_kind = p_target_kind
       and v_existing.target_id = p_target_id
       and v_existing.amount_drops = p_amount_drops then
      return v_existing.transaction_id;
    end if;
    raise exception 'record_zap: zap % already recorded with different parameters', p_zap_id;
  end if;

  if p_target_kind = 'entry' then
    select en.user_id, en.visibility, en.hive_id
      into v_entry
      from public.entries en
     where en.id = p_target_id;
    if not found then
      raise exception 'record_zap: target not found';
    end if;
    v_recipient := v_entry.user_id;

    if v_entry.visibility = 'sent' then
      if not exists (
        select 1 from public.private_hives ph
         where ph.id = v_entry.hive_id
           and ph.subject_profile_id = v_uid
           and ph.sent_at is not null
      ) then
        raise exception 'record_zap: target not found';
      end if;
    elsif v_entry.visibility = 'shared' then
      if not exists (select 1 from public.shares s where s.entry_id = p_target_id) then
        raise exception 'record_zap: target not found';
      end if;
    else
      raise exception 'record_zap: target not found';
    end if;
  else
    select ph.owner_id, ph.subject_profile_id, ph.sent_at
      into v_hive
      from public.private_hives ph
     where ph.id = p_target_id;
    if not found
       or v_hive.subject_profile_id is distinct from v_uid
       or v_hive.sent_at is null then
      raise exception 'record_zap: target not found';
    end if;
    v_recipient := v_hive.owner_id;
  end if;

  if v_recipient = v_uid then
    raise exception 'record_zap: cannot zap your own %', p_target_kind;
  end if;

  if not exists (
    select 1 from public.honeycomb_connections c
     where c.status = 'accepted'
       and ((c.requester_id = v_uid and c.addressee_id = v_recipient)
         or (c.addressee_id = v_uid and c.requester_id = v_recipient))
  ) then
    raise exception 'record_zap: sender and recipient are not connected friends';
  end if;

  v_txn := public._nectar_send_tip(
    v_uid,
    v_recipient,
    p_amount_drops,
    'zap:' || p_zap_id,
    'nectar zap',
    'record_zap'
  );

  insert into public.nectar_zaps
    (id, transaction_id, sender_id, recipient_id, target_kind, target_id, amount_drops)
  values
    (p_zap_id, v_txn, v_uid, v_recipient, p_target_kind, p_target_id, p_amount_drops);

  return v_txn;
end;
$$;

create or replace function public.send_comb_nectar_note(
  p_send_id uuid,
  p_comb_id uuid,
  p_recipient_id uuid,
  p_note text,
  p_amount_drops bigint
)
returns table (send_id uuid, transaction_id uuid, sent_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_sent_at timestamptz;
  v_txn uuid;
  v_existing record;
  v_note text;
begin
  if v_uid is null then
    raise exception 'send_comb_nectar_note: not signed in';
  end if;
  if p_send_id is null or p_comb_id is null then
    raise exception 'send_comb_nectar_note: send id and comb are required';
  end if;
  v_note := btrim(p_note);

  -- Replay binds the complete payload before any mutable eligibility or
  -- new-send validation. A lost response remains replayable even after a
  -- member leaves, consent is revoked, or the recipient is tombstoned.
  select cn.id, cn.comb_id, cn.sender_id, cn.recipient_id, cn.note_text, cn.amount_drops, cn.transaction_id, cn.created_at
    into v_existing
    from public.comb_nectar_notes cn
   where cn.id = p_send_id;
  if found then
    if v_existing.sender_id = v_uid
       and v_existing.comb_id = p_comb_id
       and v_existing.recipient_id is not distinct from p_recipient_id
       and v_existing.note_text is not distinct from v_note
       and v_existing.amount_drops is not distinct from p_amount_drops then
      return query select p_send_id, v_existing.transaction_id, v_existing.created_at;
      return;
    end if;
    raise exception 'send_comb_nectar_note: send % already recorded with different parameters', p_send_id;
  end if;

  if p_amount_drops is null or p_amount_drops < 1 or p_amount_drops > 1000 then
    raise exception 'send_comb_nectar_note: amount must be between 1 and 1000 drops';
  end if;
  if p_recipient_id is null then
    raise exception 'send_comb_nectar_note: recipient not eligible';
  end if;
  if v_uid = p_recipient_id then
    raise exception 'send_comb_nectar_note: cannot send to yourself';
  end if;

  if v_note is null or v_note = '' then
    raise exception 'send_comb_nectar_note: note must contain between 1 and 8 words';
  end if;
  if char_length(v_note) > 280 then
    raise exception 'send_comb_nectar_note: note is too long';
  end if;
  if array_length(regexp_split_to_array(v_note, '\s+'), 1) < 1
     or array_length(regexp_split_to_array(v_note, '\s+'), 1) > 8 then
    raise exception 'send_comb_nectar_note: note must contain between 1 and 8 words';
  end if;

  if not exists (
    select 1
      from public.comb_members cm
     where cm.comb_id = p_comb_id
       and cm.profile_id = v_uid
       and cm.removed_at is null
  ) then
    raise exception 'send_comb_nectar_note: sender is not an active comb member';
  end if;

  if not exists (
    select 1
      from public.comb_members cm
      join public.profiles p on p.id = cm.profile_id
     where cm.comb_id = p_comb_id
       and cm.profile_id = p_recipient_id
       and cm.removed_at is null
       and p.deleted_at is null
  ) then
    raise exception 'send_comb_nectar_note: recipient not eligible';
  end if;

  if not exists (select 1 from public.nectar_consents nc where nc.user_id = v_uid) then
    raise exception 'send_comb_nectar_note: nectar consent required before sending';
  end if;

  begin
    v_txn := public._nectar_send_tip(
      v_uid,
      p_recipient_id,
      p_amount_drops,
      'comb-note:' || p_send_id,
      'comb nectar note',
      'send_comb_nectar_note'
    );

    insert into public.comb_nectar_notes
      (id, comb_id, transaction_id, sender_id, recipient_id, note_text, amount_drops)
    values (p_send_id, p_comb_id, v_txn, v_uid, p_recipient_id, v_note, p_amount_drops)
    returning created_at into v_sent_at;
  exception when unique_violation then
    select cn.comb_id, cn.sender_id, cn.recipient_id, cn.note_text,
           cn.amount_drops, cn.transaction_id, cn.created_at
      into v_existing
      from public.comb_nectar_notes cn
     where cn.id = p_send_id;
    if found
       and v_existing.sender_id = v_uid
       and v_existing.comb_id = p_comb_id
       and v_existing.recipient_id is not distinct from p_recipient_id
       and v_existing.note_text is not distinct from v_note
       and v_existing.amount_drops is not distinct from p_amount_drops then
      return query select p_send_id, v_existing.transaction_id, v_existing.created_at;
      return;
    end if;
    raise exception 'send_comb_nectar_note: send % already recorded with different parameters', p_send_id;
  end;

  return query select p_send_id, v_txn, v_sent_at;
end;
$$;

comment on function public.send_comb_nectar_note(uuid, uuid, uuid, text, bigint) is
  'Creates a one-transaction comb notes transfer in the same ledger pathway as zaps';

revoke all on function public.send_comb_nectar_note(uuid, uuid, uuid, text, bigint) from public;
revoke execute on function public.send_comb_nectar_note(uuid, uuid, uuid, text, bigint) from anon;
grant execute on function public.send_comb_nectar_note(uuid, uuid, uuid, text, bigint) to authenticated;

notify pgrst, 'reload schema';
