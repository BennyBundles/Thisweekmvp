-- Phase 22 — Provider Sandbox Chain
-- Applied to Supabase project xjtvawmppzwzrooairyx on 2026-09-19.
-- Adds provider orchestration references only; no provider secrets or full account data.

begin;

alter table public.tw_money_customers
  add column if not exists provider_application_id text,
  add column if not exists provider_application_status text,
  add column if not exists method_entity_id text,
  add column if not exists method_connect_id text;

create unique index if not exists tw_money_customers_provider_application_idx
  on public.tw_money_customers(banking_provider, provider_application_id)
  where provider_application_id is not null;

create unique index if not exists tw_money_customers_method_entity_idx
  on public.tw_money_customers(method_entity_id)
  where method_entity_id is not null;

alter table public.tw_money_funding_accounts
  add column if not exists provider_link_kind text
    check (provider_link_kind is null or provider_link_kind in ('unit_counterparty','unit_linked_account','method_source')),
  add column if not exists provider_status text;

create unique index if not exists tw_money_funding_accounts_provider_account_processor_idx
  on public.tw_money_funding_accounts(user_id, provider_account_row_id, processor_provider)
  where provider_account_row_id is not null and processor_provider is not null;

alter table public.tw_money_transfers
  add column if not exists provider_status text,
  add column if not exists provider_account_id text;

create unique index if not exists tw_money_billers_method_account_idx
  on public.tw_money_billers(user_id, discovery_provider, provider_biller_id)
  where provider_biller_id is not null;

commit;
