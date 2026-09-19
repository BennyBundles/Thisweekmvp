-- This Week Phase 19 — dedicated provider backend schema
-- Staged source only. Apply to a dedicated Supabase project, never the shared generic project.
-- Financial Plan data remains browser-local. These tables store provider-layer data only.

begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.tw_provider_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (char_length(provider) between 1 and 40),
  consent_version text not null check (char_length(consent_version) between 1 and 40),
  scopes text[] not null default array[]::text[],
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, provider, consent_version)
);

create table if not exists public.tw_provider_link_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  vault_secret_id uuid not null,
  status text not null default 'created'
    check (status in ('created','completed','cancelled','expired','failed')),
  expires_at timestamptz not null,
  completed_at timestamptz,
  error_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.tw_provider_connections (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_item_id text not null,
  institution_id text,
  institution_name text,
  vault_secret_id uuid,
  sync_cursor text,
  status text not null default 'active'
    check (status in ('active','needs_reconnect','disconnected','error')),
  consent_id uuid references public.tw_provider_consents(id) on delete set null,
  last_success_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision bigint not null default 1,
  unique (user_id, provider, provider_item_id)
);

create table if not exists public.tw_provider_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.tw_provider_connections(id) on delete cascade,
  provider_account_id text not null,
  display_name text not null,
  mask_last4 text,
  account_type text,
  account_subtype text,
  currency text,
  available_balance_cents bigint,
  current_balance_cents bigint,
  balance_as_of timestamptz,
  status text not null default 'active'
    check (status in ('active','closed','unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, connection_id, provider_account_id)
);

create table if not exists public.tw_provider_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.tw_provider_connections(id) on delete cascade,
  account_id uuid references public.tw_provider_accounts(id) on delete set null,
  provider_transaction_id text not null,
  provider_account_id text not null,
  pending_provider_transaction_id text,
  status text not null check (status in ('pending','posted','removed')),
  direction text not null check (direction in ('outflow','inflow')),
  amount_cents bigint not null check (amount_cents >= 0),
  iso_currency_code text,
  transaction_date date not null,
  authorized_at timestamptz,
  description text not null,
  merchant_name text,
  category_hint text,
  provider_payload_hash text,
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, connection_id, provider_transaction_id)
);

create table if not exists public.tw_provider_sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.tw_provider_connections(id) on delete cascade,
  status text not null check (status in ('running','success','partial','failed')),
  added_count integer not null default 0 check (added_count >= 0),
  modified_count integer not null default 0 check (modified_count >= 0),
  removed_count integer not null default 0 check (removed_count >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_code text
);

create table if not exists public.tw_provider_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conflict_type text not null,
  entity_type text not null,
  entity_id text not null,
  local_revision bigint,
  server_revision bigint,
  state text not null default 'open' check (state in ('open','resolved','dismissed')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists tw_provider_link_sessions_user_idx
  on public.tw_provider_link_sessions(user_id, created_at desc);
create index if not exists tw_provider_connections_user_idx
  on public.tw_provider_connections(user_id, status);
create index if not exists tw_provider_accounts_user_idx
  on public.tw_provider_accounts(user_id, connection_id);
create index if not exists tw_provider_transactions_user_date_idx
  on public.tw_provider_transactions(user_id, transaction_date desc);
create index if not exists tw_provider_transactions_connection_idx
  on public.tw_provider_transactions(connection_id, status, transaction_date desc);
create index if not exists tw_provider_sync_runs_connection_idx
  on public.tw_provider_sync_runs(connection_id, started_at desc);
create index if not exists tw_provider_conflicts_user_idx
  on public.tw_provider_conflicts(user_id, state, created_at desc);

alter table public.tw_provider_consents enable row level security;
alter table public.tw_provider_link_sessions enable row level security;
alter table public.tw_provider_connections enable row level security;
alter table public.tw_provider_accounts enable row level security;
alter table public.tw_provider_transactions enable row level security;
alter table public.tw_provider_sync_runs enable row level security;
alter table public.tw_provider_conflicts enable row level security;

-- Provider data is service-layer only. The browser talks to an authenticated Edge Function,
-- never directly to these tables. Keep Data API grants closed even though RLS is enabled.
revoke all on table public.tw_provider_consents from public, anon, authenticated;
revoke all on table public.tw_provider_link_sessions from public, anon, authenticated;
revoke all on table public.tw_provider_connections from public, anon, authenticated;
revoke all on table public.tw_provider_accounts from public, anon, authenticated;
revoke all on table public.tw_provider_transactions from public, anon, authenticated;
revoke all on table public.tw_provider_sync_runs from public, anon, authenticated;
revoke all on table public.tw_provider_conflicts from public, anon, authenticated;

comment on table public.tw_provider_connections is
  'This Week provider connection metadata only. Provider access tokens are referenced by Vault UUID and never stored in this table. vault_secret_id becomes null after disconnect and Vault deletion.';
comment on table public.tw_provider_transactions is
  'Normalized provider activity. These rows are reference data until the browser user explicitly reconciles them into a This Week weekly transaction.';
comment on table public.tw_provider_accounts is
  'External account metadata and balances. External balances must never be substituted for This Week Available Now.';
comment on table public.tw_provider_conflicts is
  'Inspectable conflict queue. Financial conflicts must never be silently merged.';

commit;
