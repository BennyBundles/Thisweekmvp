-- Phase 30 — External Notification Dispatcher
-- Applied to Supabase project xjtvawmppzwzrooairyx on 2026-09-19.
-- Cron invokes an Edge Function using a one-time database nonce.
-- Browser roles cannot access dispatcher state or claim/send notifications.

begin;

alter table public.tw_ops_notification_outbox
  drop constraint if exists tw_ops_notification_outbox_state_check;
alter table public.tw_ops_notification_outbox
  add constraint tw_ops_notification_outbox_state_check
  check (state in ('pending','sending','sent','failed','suppressed'));

create table if not exists public.tw_ops_notification_channel_status (
  channel_key text primary key,
  configured boolean not null default false,
  state text not null default 'unconfigured'
    check (state in ('unconfigured','healthy','degraded')),
  last_check_at timestamptz,
  last_success_at timestamptz,
  last_error_code text,
  updated_at timestamptz not null default now()
);

insert into public.tw_ops_notification_channel_status(channel_key,configured,state)
values ('external_webhook',false,'unconfigured')
on conflict (channel_key) do nothing;

create table if not exists public.tw_ops_dispatch_nonces (
  id uuid primary key default gen_random_uuid(),
  expires_at timestamptz not null default (now()+interval '5 minutes'),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tw_ops_dispatch_nonces_expiry_idx
  on public.tw_ops_dispatch_nonces(expires_at,consumed_at);

alter table public.tw_ops_notification_channel_status enable row level security;
alter table public.tw_ops_dispatch_nonces enable row level security;

revoke all on table
  public.tw_ops_notification_channel_status,
  public.tw_ops_dispatch_nonces
from public,anon,authenticated;

grant select,insert,update,delete on table
  public.tw_ops_notification_channel_status,
  public.tw_ops_dispatch_nonces
to service_role;

create or replace function public.tw_ops_issue_dispatch_nonce()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
begin
  delete from public.tw_ops_dispatch_nonces
  where expires_at < now()-interval '1 hour'
     or consumed_at < now()-interval '1 hour';

  insert into public.tw_ops_dispatch_nonces default values
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.tw_ops_consume_dispatch_nonce(p_nonce uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_count integer;
begin
  update public.tw_ops_dispatch_nonces
  set consumed_at=now()
  where id=p_nonce
    and consumed_at is null
    and expires_at>now();
  get diagnostics v_count = row_count;
  return v_count=1;
end;
$$;

create or replace function public.tw_ops_claim_notifications(p_limit integer default 10)
returns table(
  id uuid,
  event_type text,
  severity text,
  subject text,
  safe_body text,
  alert_id uuid,
  incident_id uuid,
  attempt_count integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.tw_ops_notification_outbox
  set state='failed',
      last_error_code='dispatch_lease_expired',
      next_attempt_at=now()
  where state='sending'
    and next_attempt_at<=now();

  return query
  with picked as (
    select n.id
    from public.tw_ops_notification_outbox n
    where n.state in ('pending','failed')
      and n.next_attempt_at<=now()
    order by case n.severity when 'critical' then 0 else 1 end,n.created_at
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,10),25))
  )
  update public.tw_ops_notification_outbox n
  set state='sending',
      attempt_count=n.attempt_count+1,
      next_attempt_at=now()+interval '5 minutes'
  from picked p
  where n.id=p.id
  returning n.id,n.event_type,n.severity,n.subject,n.safe_body,
    n.alert_id,n.incident_id,n.attempt_count,n.created_at;
end;
$$;

create or replace function public.tw_ops_complete_notification(
  p_id uuid,
  p_success boolean,
  p_error_code text default null,
  p_retry_after_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_count integer;
  v_retry integer := greatest(60,least(coalesce(p_retry_after_seconds,60),3600));
begin
  if p_success then
    update public.tw_ops_notification_outbox
    set state='sent',sent_at=now(),last_error_code=null,next_attempt_at=now()
    where id=p_id and state='sending';
  else
    update public.tw_ops_notification_outbox
    set state='failed',
        last_error_code=left(coalesce(nullif(trim(p_error_code),''),'dispatch_failed'),160),
        next_attempt_at=now()+make_interval(secs=>v_retry)
    where id=p_id and state='sending';
  end if;
  get diagnostics v_count = row_count;
  return v_count=1;
end;
$$;

create or replace function public.tw_ops_update_notification_channel(
  p_configured boolean,
  p_state text,
  p_error_code text default null,
  p_success boolean default false
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_state not in ('unconfigured','healthy','degraded') then
    raise exception 'invalid_notification_channel_state';
  end if;

  insert into public.tw_ops_notification_channel_status(
    channel_key,configured,state,last_check_at,last_success_at,last_error_code,updated_at
  ) values (
    'external_webhook',p_configured,p_state,now(),
    case when p_success then now() else null end,
    nullif(left(coalesce(p_error_code,''),160),''),
    now()
  )
  on conflict (channel_key) do update set
    configured=excluded.configured,
    state=excluded.state,
    last_check_at=excluded.last_check_at,
    last_success_at=case when p_success then now() else public.tw_ops_notification_channel_status.last_success_at end,
    last_error_code=excluded.last_error_code,
    updated_at=now();
end;
$$;

revoke all on function public.tw_ops_issue_dispatch_nonce() from public,anon,authenticated;
revoke all on function public.tw_ops_consume_dispatch_nonce(uuid) from public,anon,authenticated;
revoke all on function public.tw_ops_claim_notifications(integer) from public,anon,authenticated;
revoke all on function public.tw_ops_complete_notification(uuid,boolean,text,integer) from public,anon,authenticated;
revoke all on function public.tw_ops_update_notification_channel(boolean,text,text,boolean) from public,anon,authenticated;

grant execute on function public.tw_ops_issue_dispatch_nonce() to service_role;
grant execute on function public.tw_ops_consume_dispatch_nonce(uuid) to service_role;
grant execute on function public.tw_ops_claim_notifications(integer) to service_role;
grant execute on function public.tw_ops_complete_notification(uuid,boolean,text,integer) to service_role;
grant execute on function public.tw_ops_update_notification_channel(boolean,text,text,boolean) to service_role;

select cron.schedule(
  'thisweek-phase30-notification-dispatcher',
  '* * * * *',
  $job$
    select net.http_post(
      url:='https://xjtvawmppzwzrooairyx.supabase.co/functions/v1/thisweek-ops-notifier',
      headers:=jsonb_build_object('Content-Type','application/json'),
      body:=jsonb_build_object('nonce',public.tw_ops_issue_dispatch_nonce()),
      timeout_milliseconds:=5000
    );
  $job$
);

commit;
