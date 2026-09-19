-- Phase 34 advisor hardening: explicit service-role-only RLS policies.
-- Browser roles remain revoked and receive no policies.

begin;

drop policy if exists tw_release_cert_requirements_service on public.tw_release_certification_requirements;
create policy tw_release_cert_requirements_service
on public.tw_release_certification_requirements
for all to service_role
using (true) with check (true);

drop policy if exists tw_release_gate_requirements_service on public.tw_release_gate_evidence_requirements;
create policy tw_release_gate_requirements_service
on public.tw_release_gate_evidence_requirements
for all to service_role
using (true) with check (true);

drop policy if exists tw_release_cert_runs_service_select on public.tw_release_certification_runs;
create policy tw_release_cert_runs_service_select
on public.tw_release_certification_runs
for select to service_role using (true);
drop policy if exists tw_release_cert_runs_service_insert on public.tw_release_certification_runs;
create policy tw_release_cert_runs_service_insert
on public.tw_release_certification_runs
for insert to service_role with check (true);

drop policy if exists tw_release_drill_runs_service_select on public.tw_release_drill_runs;
create policy tw_release_drill_runs_service_select
on public.tw_release_drill_runs
for select to service_role using (true);
drop policy if exists tw_release_drill_runs_service_insert on public.tw_release_drill_runs;
create policy tw_release_drill_runs_service_insert
on public.tw_release_drill_runs
for insert to service_role with check (true);

drop policy if exists tw_release_drill_events_service_select on public.tw_release_drill_events;
create policy tw_release_drill_events_service_select
on public.tw_release_drill_events
for select to service_role using (true);
drop policy if exists tw_release_drill_events_service_insert on public.tw_release_drill_events;
create policy tw_release_drill_events_service_insert
on public.tw_release_drill_events
for insert to service_role with check (true);

drop policy if exists tw_release_cert_receipts_service_select on public.tw_release_certification_receipts;
create policy tw_release_cert_receipts_service_select
on public.tw_release_certification_receipts
for select to service_role using (true);
drop policy if exists tw_release_cert_receipts_service_insert on public.tw_release_certification_receipts;
create policy tw_release_cert_receipts_service_insert
on public.tw_release_certification_receipts
for insert to service_role with check (true);

drop policy if exists tw_release_gate_evidence_service_select on public.tw_release_gate_evidence;
create policy tw_release_gate_evidence_service_select
on public.tw_release_gate_evidence
for select to service_role using (true);
drop policy if exists tw_release_gate_evidence_service_insert on public.tw_release_gate_evidence;
create policy tw_release_gate_evidence_service_insert
on public.tw_release_gate_evidence
for insert to service_role with check (true);

commit;
