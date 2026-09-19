-- Phase 21 — Signed Provider Events + Card Authorization Controller
-- Applied to Supabase project xjtvawmppzwzrooairyx on 2026-09-19.
-- This file records the deployed database changes.

begin;

alter table public.tw_money_card_authorizations
  drop constraint if exists tw_money_card_authorizations_state_check;

alter table public.tw_money_card_authorizations
  add constraint tw_money_card_authorizations_state_check
  check (state in ('authorized','declined','reversed','settled','expired'));

alter table public.tw_money_card_authorizations
  add column if not exists approved_amount_cents bigint
    check (approved_amount_cents is null or approved_amount_cents >= 0),
  add column if not exists provider_transaction_id text,
  add column if not exists decision_source text,
  add column if not exists card_decision_source text,
  add column if not exists reversed_at timestamptz;

alter table public.tw_money_provider_events
  add column if not exists signature_verified boolean not null default false,
  add column if not exists request_timestamp timestamptz,
  add column if not exists resource_ref text;

create index if not exists tw_money_provider_events_user_type_idx
  on public.tw_money_provider_events(user_id,event_type,id);

create index if not exists tw_money_card_auth_user_state_idx
  on public.tw_money_card_authorizations(user_id,state,requested_at desc);

create or replace function public.tw_money_reserve_card_authorization(
  p_provider_card_id text,
  p_provider_authorization_id text,
  p_amount_cents bigint,
  p_partial_approval_allowed boolean,
  p_merchant_name text default null,
  p_merchant_id text default null,
  p_mcc text default null
)
returns table (
  user_id uuid,
  card_authorization_id uuid,
  decision text,
  approved_amount_cents bigint,
  decision_reason text,
  hold_journal_id uuid
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_card public.tw_money_virtual_cards%rowtype;
  v_existing public.tw_money_card_authorizations%rowtype;
  v_env_account uuid;
  v_hold_account uuid;
  v_available bigint := 0;
  v_approved bigint := 0;
  v_reason text := 'approved';
  v_hold uuid;
  v_merchant_fingerprint text;
begin
  if coalesce(length(trim(p_provider_card_id)),0)=0 then raise exception 'provider_card_id_required'; end if;
  if coalesce(length(trim(p_provider_authorization_id)),0)=0 then raise exception 'provider_authorization_id_required'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'invalid_authorization_amount'; end if;

  perform pg_advisory_xact_lock(hashtextextended('unit:'||p_provider_authorization_id,0));

  select * into v_card
  from public.tw_money_virtual_cards
  where provider='unit' and provider_card_id=p_provider_card_id
  limit 1;

  if v_card.id is null then raise exception 'card_not_found'; end if;

  select * into v_existing
  from public.tw_money_card_authorizations
  where provider='unit' and provider_authorization_id=p_provider_authorization_id
  limit 1;

  if v_existing.id is not null then
    return query
    select v_existing.user_id,v_existing.id,v_existing.decision,
      coalesce(v_existing.approved_amount_cents,case when v_existing.decision='approved' then v_existing.amount_cents else 0 end),
      coalesce(v_existing.decision_reason,'existing_decision'),
      v_existing.hold_journal_id;
    return;
  end if;

  if v_card.status <> 'active' then
    v_reason := 'card_not_active';
  elsif v_card.envelope_id is null then
    v_reason := 'envelope_not_bound';
  elsif cardinality(v_card.allowed_mcc) > 0
    and (p_mcc is null or not (p_mcc = any(v_card.allowed_mcc))) then
    v_reason := 'mcc_not_allowed';
  else
    v_merchant_fingerprint := coalesce(nullif(trim(p_merchant_id),''),lower(nullif(trim(p_merchant_name),'')));
    if v_card.merchant_lock_fingerprint is not null
       and v_merchant_fingerprint is distinct from v_card.merchant_lock_fingerprint then
      v_reason := 'merchant_not_allowed';
    end if;
  end if;

  if v_reason='approved' then
    select id into v_env_account
    from public.tw_money_ledger_accounts
    where user_id=v_card.user_id and envelope_id=v_card.envelope_id
      and account_kind='envelope_available' and status='active'
    limit 1 for update;

    select id into v_hold_account
    from public.tw_money_ledger_accounts
    where user_id=v_card.user_id and account_code='hold:card'
      and account_kind='card_hold' and status='active'
    limit 1 for update;

    if v_env_account is null or v_hold_account is null then raise exception 'card_ledger_not_ready'; end if;

    select coalesce(sum(amount_cents),0) into v_available
    from public.tw_money_ledger_entries
    where user_id=v_card.user_id and ledger_account_id=v_env_account;

    v_approved := least(
      p_amount_cents,
      greatest(v_available,0),
      coalesce(v_card.spend_limit_cents,p_amount_cents)
    );

    if v_approved >= p_amount_cents then
      v_approved := p_amount_cents;
      v_reason := 'approved';
    elsif coalesce(p_partial_approval_allowed,false) and v_approved > 0 then
      v_reason := 'partial_approval';
    else
      v_approved := 0;
      if v_available <= 0 then v_reason := 'insufficient_envelope';
      elsif v_card.spend_limit_cents is not null and v_card.spend_limit_cents < p_amount_cents then
        v_reason := 'card_amount_limit';
      else v_reason := 'insufficient_envelope';
      end if;
    end if;
  end if;

  if v_approved > 0 then
    v_hold := public.tw_money_post_journal(
      v_card.user_id,'card_authorization_hold',
      'unit:authhold:'||p_provider_authorization_id,'USD',
      jsonb_build_array(
        jsonb_build_object('ledger_account_id',v_env_account,'amount_cents',-v_approved),
        jsonb_build_object('ledger_account_id',v_hold_account,'amount_cents',v_approved)
      ),
      'unit',p_provider_authorization_id,
      jsonb_build_object(
        'card_id',v_card.id,
        'merchant_name',left(coalesce(p_merchant_name,''),120),
        'merchant_id',left(coalesce(p_merchant_id,''),120),
        'mcc',left(coalesce(p_mcc,''),8),
        'requested_amount_cents',p_amount_cents,
        'approved_amount_cents',v_approved
      )
    );

    insert into public.tw_money_card_authorizations(
      user_id,card_id,provider,provider_authorization_id,
      amount_cents,approved_amount_cents,currency,
      merchant_name,merchant_id,mcc,decision,decision_reason,state,
      hold_journal_id,requested_at,decision_source
    ) values (
      v_card.user_id,v_card.id,'unit',p_provider_authorization_id,
      p_amount_cents,v_approved,'USD',
      left(coalesce(p_merchant_name,''),160),
      left(coalesce(p_merchant_id,''),160),
      left(coalesce(p_mcc,''),12),
      'approved',v_reason,'authorized',v_hold,now(),'thisweek_envelope_controller'
    ) returning id into card_authorization_id;

    user_id:=v_card.user_id;decision:='approved';approved_amount_cents:=v_approved;
    decision_reason:=v_reason;hold_journal_id:=v_hold;
    return next;return;
  end if;

  insert into public.tw_money_card_authorizations(
    user_id,card_id,provider,provider_authorization_id,
    amount_cents,approved_amount_cents,currency,
    merchant_name,merchant_id,mcc,decision,decision_reason,state,
    requested_at,decision_source
  ) values (
    v_card.user_id,v_card.id,'unit',p_provider_authorization_id,
    p_amount_cents,0,'USD',
    left(coalesce(p_merchant_name,''),160),
    left(coalesce(p_merchant_id,''),160),
    left(coalesce(p_mcc,''),12),
    'declined',v_reason,'declined',now(),'thisweek_envelope_controller'
  ) returning id into card_authorization_id;

  user_id:=v_card.user_id;decision:='declined';approved_amount_cents:=0;
  decision_reason:=v_reason;hold_journal_id:=null;
  return next;
end;
$$;

create or replace function public.tw_money_release_card_authorization(
  p_provider_authorization_id text,
  p_reason text default 'authorization_reversed'
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_auth public.tw_money_card_authorizations%rowtype;
  v_card public.tw_money_virtual_cards%rowtype;
  v_env_account uuid;v_hold_account uuid;v_amount bigint;v_journal uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('unit:'||p_provider_authorization_id,0));
  select * into v_auth from public.tw_money_card_authorizations
  where provider='unit' and provider_authorization_id=p_provider_authorization_id for update;
  if v_auth.id is null then raise exception 'card_authorization_not_found'; end if;
  if v_auth.state='reversed' then return v_auth.hold_journal_id; end if;
  if v_auth.state<>'authorized' or v_auth.decision<>'approved' then raise exception 'card_authorization_not_releasable'; end if;

  select * into v_card from public.tw_money_virtual_cards where id=v_auth.card_id;
  v_amount:=coalesce(v_auth.approved_amount_cents,v_auth.amount_cents);
  select id into v_env_account from public.tw_money_ledger_accounts
    where user_id=v_auth.user_id and envelope_id=v_card.envelope_id and account_kind='envelope_available' and status='active' limit 1;
  select id into v_hold_account from public.tw_money_ledger_accounts
    where user_id=v_auth.user_id and account_code='hold:card' and account_kind='card_hold' and status='active' limit 1;
  if v_env_account is null or v_hold_account is null then raise exception 'card_ledger_not_ready'; end if;

  v_journal:=public.tw_money_post_journal(
    v_auth.user_id,'card_authorization_release',
    'unit:authrelease:'||p_provider_authorization_id,'USD',
    jsonb_build_array(
      jsonb_build_object('ledger_account_id',v_hold_account,'amount_cents',-v_amount),
      jsonb_build_object('ledger_account_id',v_env_account,'amount_cents',v_amount)
    ),
    'unit',p_provider_authorization_id,
    jsonb_build_object('reason',left(coalesce(p_reason,''),120),'card_authorization_id',v_auth.id)
  );

  update public.tw_money_card_authorizations
    set state='reversed',reversed_at=now(),decision_reason=coalesce(nullif(p_reason,''),decision_reason)
    where id=v_auth.id;
  return v_journal;
end;
$$;

create or replace function public.tw_money_settle_card_authorization(
  p_provider_authorization_id text,
  p_provider_transaction_id text,
  p_settled_amount_cents bigint
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_auth public.tw_money_card_authorizations%rowtype;
  v_card public.tw_money_virtual_cards%rowtype;
  v_env_account uuid;v_hold_account uuid;v_external_account uuid;
  v_held bigint;v_delta bigint;v_entries jsonb;v_journal uuid;
begin
  if p_settled_amount_cents is null or p_settled_amount_cents < 0 then raise exception 'invalid_settlement_amount'; end if;
  perform pg_advisory_xact_lock(hashtextextended('unit:'||p_provider_authorization_id,0));

  select * into v_auth from public.tw_money_card_authorizations
    where provider='unit' and provider_authorization_id=p_provider_authorization_id for update;
  if v_auth.id is null then raise exception 'card_authorization_not_found'; end if;
  if v_auth.state='settled' then return v_auth.settlement_journal_id; end if;
  if v_auth.state<>'authorized' or v_auth.decision<>'approved' then raise exception 'card_authorization_not_settleable'; end if;

  select * into v_card from public.tw_money_virtual_cards where id=v_auth.card_id;
  v_held:=coalesce(v_auth.approved_amount_cents,v_auth.amount_cents);

  select id into v_env_account from public.tw_money_ledger_accounts
    where user_id=v_auth.user_id and envelope_id=v_card.envelope_id and account_kind='envelope_available' and status='active' limit 1;
  select id into v_hold_account from public.tw_money_ledger_accounts
    where user_id=v_auth.user_id and account_code='hold:card' and account_kind='card_hold' and status='active' limit 1;
  select id into v_external_account from public.tw_money_ledger_accounts
    where user_id=v_auth.user_id and account_code='external:offset' and account_kind='external_offset' and status='active' limit 1;
  if v_env_account is null or v_hold_account is null or v_external_account is null then raise exception 'card_ledger_not_ready'; end if;

  v_delta:=p_settled_amount_cents-v_held;
  if v_delta=0 then
    v_entries:=jsonb_build_array(
      jsonb_build_object('ledger_account_id',v_hold_account,'amount_cents',-v_held),
      jsonb_build_object('ledger_account_id',v_external_account,'amount_cents',v_held)
    );
  elsif v_delta<0 then
    v_entries:=jsonb_build_array(
      jsonb_build_object('ledger_account_id',v_hold_account,'amount_cents',-v_held),
      jsonb_build_object('ledger_account_id',v_external_account,'amount_cents',p_settled_amount_cents),
      jsonb_build_object('ledger_account_id',v_env_account,'amount_cents',-v_delta)
    );
  else
    v_entries:=jsonb_build_array(
      jsonb_build_object('ledger_account_id',v_hold_account,'amount_cents',-v_held),
      jsonb_build_object('ledger_account_id',v_env_account,'amount_cents',-v_delta),
      jsonb_build_object('ledger_account_id',v_external_account,'amount_cents',p_settled_amount_cents)
    );
  end if;

  v_journal:=public.tw_money_post_journal(
    v_auth.user_id,'card_settlement',
    'unit:cardsettle:'||coalesce(nullif(p_provider_transaction_id,''),p_provider_authorization_id),
    'USD',v_entries,'unit',
    coalesce(nullif(p_provider_transaction_id,''),p_provider_authorization_id),
    jsonb_build_object(
      'authorization_request_id',p_provider_authorization_id,
      'held_amount_cents',v_held,
      'settled_amount_cents',p_settled_amount_cents,
      'settlement_delta_cents',v_delta,
      'settlement_exceeds_authorized',v_delta>0
    )
  );

  update public.tw_money_card_authorizations
  set state='settled',settlement_journal_id=v_journal,
      provider_transaction_id=nullif(p_provider_transaction_id,''),
      final_amount_cents=p_settled_amount_cents,settled_at=now()
  where id=v_auth.id;
  return v_journal;
end;
$$;

revoke all on function public.tw_money_reserve_card_authorization(text,text,bigint,boolean,text,text,text)
  from public,anon,authenticated;
grant execute on function public.tw_money_reserve_card_authorization(text,text,bigint,boolean,text,text,text) to service_role;

revoke all on function public.tw_money_release_card_authorization(text,text)
  from public,anon,authenticated;
grant execute on function public.tw_money_release_card_authorization(text,text) to service_role;

revoke all on function public.tw_money_settle_card_authorization(text,text,bigint)
  from public,anon,authenticated;
grant execute on function public.tw_money_settle_card_authorization(text,text,bigint) to service_role;

commit;
