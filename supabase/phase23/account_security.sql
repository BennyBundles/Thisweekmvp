-- Phase 23 — Production Account & Session Security
-- Applied to Supabase project xjtvawmppzwzrooairyx on 2026-09-19.

begin;

create table if not exists public.tw_account_closure_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  state text not null default 'requested'
    check (state in ('requested','review_required','hard_deleted','cancelled','failed')),
  reason_code text,
  has_financial_history boolean not null default false,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  safe_detail jsonb not null default '{}'::jsonb
);

create index if not exists tw_account_closure_requests_user_idx
  on public.tw_account_closure_requests(user_id, requested_at desc);

alter table public.tw_account_closure_requests enable row level security;
revoke all on table public.tw_account_closure_requests from public, anon, authenticated;
grant select,insert,update,delete on table public.tw_account_closure_requests to service_role;

create or replace function public.tw_auth_session_active(
  p_user_id uuid,
  p_session_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = pg_catalog, auth
as $$
  select exists(
    select 1 from auth.sessions s
    where s.id = p_session_id and s.user_id = p_user_id
  );
$$;

revoke all on function public.tw_auth_session_active(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.tw_auth_session_active(uuid,uuid)
  to service_role;

commit;
