begin;

create or replace function public.tw_staff_role_summary()
returns jsonb
language sql
security definer
stable
set search_path = pg_catalog, auth
as $$
  select jsonb_build_object(
    'authUserCount',count(*)::int,
    'confirmedUserCount',count(*) filter (where email_confirmed_at is not null)::int,
    'staffUserCount',count(*) filter (
      where coalesce(raw_app_meta_data->>'thisweek_role','') in ('support_ops','risk_ops','admin')
    )::int,
    'adminCount',count(*) filter (
      where coalesce(raw_app_meta_data->>'thisweek_role','')='admin'
    )::int,
    'riskOpsCount',count(*) filter (
      where coalesce(raw_app_meta_data->>'thisweek_role','')='risk_ops'
    )::int,
    'supportOpsCount',count(*) filter (
      where coalesce(raw_app_meta_data->>'thisweek_role','')='support_ops'
    )::int
  )
  from auth.users;
$$;

create or replace function public.tw_staff_user_role(p_user_id uuid)
returns text
language sql
security definer
stable
set search_path = pg_catalog, auth
as $$
  select nullif(coalesce(raw_app_meta_data->>'thisweek_role',''),'')
  from auth.users where id=p_user_id;
$$;

revoke all on function public.tw_staff_role_summary() from public,anon,authenticated;
revoke all on function public.tw_staff_user_role(uuid) from public,anon,authenticated;
grant execute on function public.tw_staff_role_summary() to service_role;
grant execute on function public.tw_staff_user_role(uuid) to service_role;

commit;
