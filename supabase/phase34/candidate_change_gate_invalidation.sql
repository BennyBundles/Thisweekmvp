-- Phase 34 continuation — invalidate candidate-bound release gates on candidate change.

begin;

create or replace function public.tw_release_select_candidate(
  p_staff_user_id uuid,
  p_release_candidate_sha text,
  p_source_ref text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_role text;
  v_id bigint;
  v_previous_sha text;
  v_next_sha text;
  v_invalidated text[] := array[]::text[];
  v_gate public.tw_release_gates%rowtype;
begin
  select coalesce(raw_app_meta_data->>'thisweek_role','') into v_role
  from auth.users where id=p_staff_user_id;

  if v_role not in ('risk_ops','admin') then
    raise exception 'risk_or_admin_role_required';
  end if;

  v_next_sha:=lower(trim(coalesce(p_release_candidate_sha,'')));
  if v_next_sha !~ '^[0-9a-f]{40}$' then
    raise exception 'full_release_candidate_sha_required';
  end if;
  if length(trim(coalesce(p_source_ref,''))) < 3 then
    raise exception 'release_candidate_source_ref_required';
  end if;

  v_previous_sha:=public.tw_release_active_candidate()->>'releaseCandidateSha';

  insert into public.tw_release_candidate_selections(
    release_candidate_sha,source_ref,note,staff_user_id
  ) values (
    v_next_sha,
    left(trim(p_source_ref),500),
    left(nullif(trim(coalesce(p_note,'')),''),1000),
    p_staff_user_id
  ) returning id into v_id;

  if v_previous_sha is distinct from v_next_sha then
    for v_gate in
      select *
      from public.tw_release_gates
      where gate_key in ('provider_sandbox_e2e_passed','incident_escalation_runbook_approved')
        and verified=true
      for update
    loop
      insert into public.tw_release_gate_events(
        gate_key,staff_user_id,previous_verified,next_verified,evidence_ref,note
      ) values (
        v_gate.gate_key,p_staff_user_id,true,false,
        left('candidate-change:'||v_next_sha,500),
        'Automatically invalidated because the active release candidate changed.'
      );

      update public.tw_release_gates
      set verified=false,
          verified_by_staff_user_id=p_staff_user_id,
          verified_at=null,
          evidence_ref=left('candidate-change:'||v_next_sha,500),
          note='Automatically invalidated because the active release candidate changed.',
          updated_at=now()
      where gate_key=v_gate.gate_key;

      v_invalidated:=array_append(v_invalidated,v_gate.gate_key);
    end loop;
  end if;

  return jsonb_build_object(
    'activeCandidate',public.tw_release_active_candidate(),
    'previousReleaseCandidateSha',v_previous_sha,
    'invalidatedGateKeys',to_jsonb(v_invalidated)
  );
end;
$$;

revoke all on function public.tw_release_select_candidate(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.tw_release_select_candidate(uuid,text,text,text) to service_role;

commit;
