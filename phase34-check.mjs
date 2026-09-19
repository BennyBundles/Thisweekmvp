import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const schema=read('supabase/phase34/release_evidence_certification.sql');
const policies=read('supabase/phase34/release_evidence_service_role_policies.sql');
const candidateBinding=read('supabase/phase34/release_candidate_binding.sql');
const transitionInvalidation=read('supabase/phase34/candidate_change_gate_invalidation.sql');
const gateway=read('supabase/functions/thisweek-release-gateway/index.ts');
const html=read('ops/release/index.html');
const app=read('ops/release/app.js');

function need(label,source,fragment){if(!source.includes(fragment)){console.error('Phase 34 check failed:',label,'missing',fragment);process.exit(1);}}

for(const t of [
  'tw_release_certification_requirements','tw_release_certification_runs','tw_release_certification_receipts',
  'tw_release_drill_runs','tw_release_drill_events','tw_release_gate_evidence_requirements','tw_release_gate_evidence'
])need('schema table '+t,schema,t);
need('append-only certification receipts',schema,'tw_release_certification_receipts_immutable');
need('append-only drills',schema,'tw_release_drill_events_immutable');
need('append-only gate evidence',schema,'tw_release_gate_evidence_immutable');
need('readiness report',schema,'tw_release_readiness_report');
need('certification status',schema,'tw_release_certification_status');
need('evidence-backed gate verification',schema,'release_gate_supporting_evidence_missing');
need('release interlock preserved',schema,'tw_release_set_gate');
need('browser table access revoked',schema,'from public,anon,authenticated');
need('service-only RPC grants',schema,'to service_role');
need('explicit service-role RLS policies',policies,'to service_role');
need('certification run service insert policy',policies,'tw_release_cert_runs_service_insert');
need('gate evidence service insert policy',policies,'tw_release_gate_evidence_service_insert');
need('candidate selection table',candidateBinding,'tw_release_candidate_selections');
need('candidate selection immutable history',candidateBinding,'tw_release_candidate_selections_immutable');
need('active candidate RPC',candidateBinding,'tw_release_active_candidate');
need('candidate selection RPC',candidateBinding,'tw_release_select_candidate');
need('candidate-bound certification',candidateBinding,'release_candidate_mismatch');
need('candidate-specific derived evidence',candidateBinding,"r.release_candidate_sha=v_active_sha");
need('candidate report',candidateBinding,'tw_release_candidate_report');
need('candidate transition fail-closed invalidation',transitionInvalidation,'Automatically invalidated because the active release candidate changed.');
need('sandbox gate invalidation',transitionInvalidation,'provider_sandbox_e2e_passed');
need('incident gate invalidation',transitionInvalidation,'incident_escalation_runbook_approved');
need('candidate transition gate audit',transitionInvalidation,'tw_release_gate_events');

need('release gateway active-session enforcement',gateway,'tw_auth_session_active');
need('release gateway AAL2 enforcement',gateway,'mfa_aal2_required');
need('release gateway staff RBAC',gateway,'app_metadata');
need('release gateway readiness report',gateway,'tw_release_readiness_report');
need('release gateway candidate action',gateway,'select_candidate');
need('release gateway certification action',gateway,'record_certification_receipt');
need('release gateway drill action',gateway,'finish_drill');
need('release gateway evidence action',gateway,'record_gate_evidence');
need('release gateway admin gate action',gateway,'set_release_gate');
need('release gateway audit',gateway,'tw_ops_staff_actions');

need('release console title',html,'Release Evidence');
need('release console CSP',html,'Content-Security-Policy');
need('release console shared auth',app,'thisweek.auth.session.v1');
need('release console gateway',app,'/functions/v1/thisweek-release-gateway');
need('release console candidate selection',app,'select_candidate');
need('release console deployed manifest prefill',app,"fetch('../../release.json");
need('release console lock rendering',app,"status.liveMoneyReady?'READY':'LOCKED'");
need('release console no secret metadata',gateway,'p_metadata:{source:"ops_release_console"}');

console.log('Phase 34 release certification check passed.');
