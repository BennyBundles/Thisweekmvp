import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type AnyRecord = Record<string, unknown>;

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const PUBLISHABLE_KEY=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ALLOWED_ORIGINS=(Deno.env.get("THISWEEK_ALLOWED_ORIGINS")||"https://bennybundles.github.io")
  .split(",").map(v=>v.trim()).filter(Boolean);
const STAFF_ROLES=new Set(["support_ops","risk_ops","admin"]);
const CERT_ROLES=new Set(["risk_ops","admin"]);

function safeText(v:unknown,max=500):string{
  return String(v??"").normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g,"")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g,"")
    .trim().slice(0,max);
}
function validUuid(v:unknown):string|null{
  const s=safeText(v,80);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)?s:null;
}
function validSha(v:unknown):string|null{
  const s=safeText(v,64).toLowerCase();
  return /^[0-9a-f]{7,64}$/.test(s)?s:null;
}
function validFullSha(v:unknown):string|null{
  const s=safeText(v,40).toLowerCase();
  return /^[0-9a-f]{40}$/.test(s)?s:null;
}
function decodePayload(token:string):AnyRecord{
  try{
    const p=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
    return JSON.parse(atob(p.padEnd(Math.ceil(p.length/4)*4,"=")));
  }catch{return{};}
}
function cors(origin:string|null):HeadersInit{
  const allowed=origin&&ALLOWED_ORIGINS.includes(origin)?origin:(ALLOWED_ORIGINS[0]||"");
  return {
    "Access-Control-Allow-Origin":allowed,
    "Access-Control-Allow-Headers":"authorization, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Cache-Control":"no-store",
    "Vary":"Origin",
  };
}
function json(origin:string|null,status:number,body:AnyRecord){
  return new Response(JSON.stringify(body),{
    status,headers:{...cors(origin),"Content-Type":"application/json; charset=utf-8"}
  });
}
function staffRole(user:AnyRecord):string{
  const app=user.app_metadata&&typeof user.app_metadata==="object"?user.app_metadata as AnyRecord:{};
  return safeText(app.thisweek_role,40);
}
async function activeSession(admin:ReturnType<typeof createClient>,userId:string,token:string):Promise<string>{
  const sid=validUuid(decodePayload(token).session_id);
  if(!sid)throw new Error("active_session_required");
  const {data,error}=await admin.rpc("tw_auth_session_active",{p_user_id:userId,p_session_id:sid});
  if(error||data!==true)throw new Error("session_revoked");
  return sid;
}
async function requireAal2(userClient:ReturnType<typeof createClient>){
  const {data,error}=await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
  if(error||data?.currentLevel!=="aal2")throw new Error("mfa_aal2_required");
}
async function audit(
  admin:ReturnType<typeof createClient>,staffUserId:string,role:string,
  action:string,targetType:string,targetRef:string,reasonCode:string|null,safeDetail:AnyRecord={}
){
  const {error}=await admin.from("tw_ops_staff_actions").insert({
    staff_user_id:staffUserId,staff_role:role,action,
    target_type:targetType,target_ref:safeText(targetRef,240),
    reason_code:reasonCode?safeText(reasonCode,120):null,
    safe_detail:safeDetail
  });
  if(error)throw new Error("staff_audit_failed");
}
async function loadStatus(admin:ReturnType<typeof createClient>){
  const [readiness,candidateSelections,requirements,runs,receipts,drills,drillEvents,gateEvidence]=await Promise.all([
    admin.rpc("tw_release_readiness_report"),
    admin.from("tw_release_candidate_selections")
      .select("id,release_candidate_sha,source_ref,note,staff_user_id,created_at")
      .order("created_at",{ascending:false}).order("id",{ascending:false}).limit(50),
    admin.from("tw_release_certification_requirements")
      .select("requirement_key,provider,group_key,label,required_for_sandbox_e2e,active,sort_order")
      .eq("active",true).order("sort_order"),
    admin.from("tw_release_certification_runs")
      .select("id,environment,release_candidate_sha,checklist_version,started_by_staff_user_id,note,started_at")
      .order("started_at",{ascending:false}).limit(20),
    admin.from("tw_release_certification_receipts")
      .select("id,run_id,requirement_key,outcome,evidence_ref,safe_summary,drill_id,staff_user_id,supersedes_receipt_id,created_at")
      .order("id",{ascending:false}).limit(250),
    admin.from("tw_release_drill_runs")
      .select("id,drill_type,environment,release_candidate_sha,scenario_key,started_by_staff_user_id,note,started_at")
      .order("started_at",{ascending:false}).limit(50),
    admin.from("tw_release_drill_events")
      .select("id,drill_id,event_type,outcome,evidence_ref,safe_summary,staff_user_id,created_at")
      .order("id",{ascending:false}).limit(250),
    admin.from("tw_release_gate_evidence")
      .select("id,gate_key,evidence_key,environment,provider,outcome,evidence_ref,safe_summary,staff_user_id,supersedes_evidence_id,created_at")
      .order("id",{ascending:false}).limit(250),
  ]);
  const checks=[readiness,candidateSelections,requirements,runs,receipts,drills,drillEvents,gateEvidence];
  if(checks.some(x=>x.error))throw new Error("release_certification_read_failed");

  const runRows=(runs.data||[]) as AnyRecord[];
  const drillRows=(drills.data||[]) as AnyRecord[];
  const runStatuses=await Promise.all(runRows.slice(0,10).map(async r=>{
    const {data,error}=await admin.rpc("tw_release_certification_status",{p_run_id:String(r.id)});
    return {runId:r.id,status:error?null:data};
  }));
  const drillStatuses=await Promise.all(drillRows.slice(0,20).map(async d=>{
    const {data,error}=await admin.rpc("tw_release_drill_status",{p_drill_id:String(d.id)});
    return {drillId:d.id,status:error?null:data};
  }));

  return {
    readiness:readiness.data||null,
    candidateSelections:candidateSelections.data||[],
    requirements:requirements.data||[],
    runs:runRows,
    runStatuses,
    receipts:receipts.data||[],
    drills:drillRows,
    drillStatuses,
    drillEvents:drillEvents.data||[],
    gateEvidence:gateEvidence.data||[],
  };
}

Deno.serve(async(req)=>{
  const origin=req.headers.get("Origin");
  if(req.method==="OPTIONS"){
    if(origin&&!ALLOWED_ORIGINS.includes(origin))return json(origin,403,{error:"origin_not_allowed"});
    return new Response("ok",{headers:cors(origin)});
  }
  if(req.method!=="POST")return json(origin,405,{error:"method_not_allowed"});
  if(origin&&!ALLOWED_ORIGINS.includes(origin))return json(origin,403,{error:"origin_not_allowed"});
  if(!SUPABASE_URL||!PUBLISHABLE_KEY||!SERVICE_KEY)return json(origin,503,{error:"backend_not_configured"});

  const authorization=req.headers.get("Authorization")||"";
  if(!authorization.startsWith("Bearer "))return json(origin,401,{error:"authentication_required"});
  const token=authorization.slice(7);
  const userClient=createClient(SUPABASE_URL,PUBLISHABLE_KEY,{
    auth:{persistSession:false,autoRefreshToken:false},
    global:{headers:{Authorization:authorization}},
  });
  const {data:authData,error:authError}=await userClient.auth.getUser(token);
  const user=authData?.user as AnyRecord|undefined;
  if(authError||!user)return json(origin,401,{error:"invalid_session"});
  if(user.is_anonymous===true)return json(origin,403,{error:"recoverable_auth_required"});

  const role=staffRole(user);
  if(!STAFF_ROLES.has(role))return json(origin,403,{error:"staff_role_required"});

  const admin=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    await activeSession(admin,String(user.id),token);
    await requireAal2(userClient);
  }catch(error){
    const code=safeText((error as Error)?.message||"staff_session_invalid",100);
    return json(origin,code==="mfa_aal2_required"?403:401,{error:code});
  }

  let body:AnyRecord={};
  try{body=await req.json() as AnyRecord;}catch{return json(origin,400,{error:"invalid_json"});}
  const action=safeText(body.action,80);

  try{
    if(action==="status"){
      return json(origin,200,{ok:true,role,...await loadStatus(admin)});
    }

    if(action==="select_candidate"){
      if(!CERT_ROLES.has(role))return json(origin,403,{error:"risk_or_admin_role_required"});
      const sha=validFullSha(body.releaseCandidateSha);
      const sourceRef=safeText(body.sourceRef,500);
      const note=safeText(body.note,1000)||null;
      if(!sha||sourceRef.length<3)throw new Error("candidate_selection_fields_required");
      const {data,error}=await admin.rpc("tw_release_select_candidate",{
        p_staff_user_id:String(user.id),p_release_candidate_sha:sha,p_source_ref:sourceRef,p_note:note
      });
      if(error)throw new Error(safeText(error.message,180)||"candidate_selection_failed");
      await audit(admin,String(user.id),role,"release_candidate_select","release_candidate",sha,"phase34_candidate_binding",{
        sourceRef
      });
      return json(origin,200,{ok:true,candidateSelection:data,readiness:(await admin.rpc("tw_release_readiness_report")).data||null});
    }

    if(action==="start_certification"){
      if(!CERT_ROLES.has(role))return json(origin,403,{error:"risk_or_admin_role_required"});
      const sha=validFullSha(body.releaseCandidateSha);
      if(!sha)throw new Error("invalid_release_candidate_sha");
      const note=safeText(body.note,1000)||null;
      const {data,error}=await admin.rpc("tw_release_start_certification",{
        p_staff_user_id:String(user.id),p_release_candidate_sha:sha,p_note:note
      });
      if(error)throw new Error(safeText(error.message,160)||"certification_start_failed");
      await audit(admin,String(user.id),role,"release_certification_start","release_certification",String(data),"phase34",{
        releaseCandidateSha:sha
      });
      return json(origin,200,{ok:true,runId:data,readiness:(await admin.rpc("tw_release_readiness_report")).data||null});
    }

    if(action==="record_certification_receipt"){
      if(!CERT_ROLES.has(role))return json(origin,403,{error:"risk_or_admin_role_required"});
      const runId=validUuid(body.runId),drillId=body.drillId?validUuid(body.drillId):null;
      const requirementKey=safeText(body.requirementKey,120);
      const outcome=safeText(body.outcome,20);
      const evidenceRef=safeText(body.evidenceRef,500);
      const safeSummary=safeText(body.safeSummary,1000)||null;
      const supersedes=body.supersedesReceiptId==null?null:Number(body.supersedesReceiptId);
      if(!runId||!requirementKey||!["pass","fail"].includes(outcome)||evidenceRef.length<3)throw new Error("certification_receipt_fields_required");
      if(body.drillId&&!drillId)throw new Error("invalid_drill_id");
      if(supersedes!==null&&(!Number.isInteger(supersedes)||supersedes<1))throw new Error("invalid_supersedes_receipt_id");
      const {data,error}=await admin.rpc("tw_release_record_certification_receipt",{
        p_staff_user_id:String(user.id),p_run_id:runId,p_requirement_key:requirementKey,p_outcome:outcome,
        p_evidence_ref:evidenceRef,p_safe_summary:safeSummary,p_drill_id:drillId,
        p_metadata:{source:"ops_release_console"},p_supersedes_receipt_id:supersedes
      });
      if(error)throw new Error(safeText(error.message,180)||"certification_receipt_failed");
      await audit(admin,String(user.id),role,"release_certification_receipt","release_certification",runId,outcome,{
        receiptId:data,requirementKey
      });
      const status=(await admin.rpc("tw_release_certification_status",{p_run_id:runId})).data||null;
      return json(origin,200,{ok:true,receiptId:data,status,readiness:(await admin.rpc("tw_release_readiness_report")).data||null});
    }

    if(action==="start_drill"){
      if(!CERT_ROLES.has(role))return json(origin,403,{error:"risk_or_admin_role_required"});
      const drillType=safeText(body.drillType,40);
      const sha=validFullSha(body.releaseCandidateSha);
      const scenarioKey=safeText(body.scenarioKey,120);
      const note=safeText(body.note,1000)||null;
      if(!["synthetic_incident","rollback"].includes(drillType)||!sha||scenarioKey.length<3)throw new Error("drill_fields_required");
      const {data,error}=await admin.rpc("tw_release_start_drill",{
        p_staff_user_id:String(user.id),p_drill_type:drillType,p_release_candidate_sha:sha,
        p_scenario_key:scenarioKey,p_note:note
      });
      if(error)throw new Error(safeText(error.message,160)||"drill_start_failed");
      await audit(admin,String(user.id),role,"release_drill_start","release_drill",String(data),drillType,{releaseCandidateSha:sha,scenarioKey});
      return json(origin,200,{ok:true,drillId:data,status:(await admin.rpc("tw_release_drill_status",{p_drill_id:data})).data||null});
    }

    if(action==="finish_drill"){
      if(!CERT_ROLES.has(role))return json(origin,403,{error:"risk_or_admin_role_required"});
      const drillId=validUuid(body.drillId);
      const evidenceRef=safeText(body.evidenceRef,500);
      const safeSummary=safeText(body.safeSummary,1000)||null;
      if(!drillId||typeof body.passed!=="boolean"||evidenceRef.length<3)throw new Error("drill_finish_fields_required");
      const {data,error}=await admin.rpc("tw_release_finish_drill",{
        p_staff_user_id:String(user.id),p_drill_id:drillId,p_passed:body.passed,
        p_evidence_ref:evidenceRef,p_safe_summary:safeSummary
      });
      if(error)throw new Error(safeText(error.message,180)||"drill_finish_failed");
      await audit(admin,String(user.id),role,"release_drill_finish","release_drill",drillId,body.passed?"pass":"fail",{});
      return json(origin,200,{ok:true,status:data,readiness:(await admin.rpc("tw_release_readiness_report")).data||null});
    }

    if(action==="record_gate_evidence"){
      if(role!=="admin")return json(origin,403,{error:"admin_role_required"});
      const gateKey=safeText(body.gateKey,120);
      const evidenceKey=safeText(body.evidenceKey,120);
      const environment=safeText(body.environment,20);
      const outcome=safeText(body.outcome,20);
      const evidenceRef=safeText(body.evidenceRef,500);
      const safeSummary=safeText(body.safeSummary,1000)||null;
      const provider=body.provider?safeText(body.provider,40):null;
      const supersedes=body.supersedesEvidenceId==null?null:Number(body.supersedesEvidenceId);
      if(!gateKey||!evidenceKey||!["sandbox","production"].includes(environment)||!["pass","fail"].includes(outcome)||evidenceRef.length<3)throw new Error("gate_evidence_fields_required");
      if(supersedes!==null&&(!Number.isInteger(supersedes)||supersedes<1))throw new Error("invalid_supersedes_evidence_id");
      const {data,error}=await admin.rpc("tw_release_record_gate_evidence",{
        p_staff_user_id:String(user.id),p_gate_key:gateKey,p_evidence_key:evidenceKey,
        p_environment:environment,p_outcome:outcome,p_evidence_ref:evidenceRef,
        p_safe_summary:safeSummary,p_provider:provider,p_metadata:{source:"ops_release_console"},
        p_supersedes_evidence_id:supersedes
      });
      if(error)throw new Error(safeText(error.message,180)||"release_evidence_record_failed");
      await audit(admin,String(user.id),role,"release_gate_evidence","release_gate",gateKey,outcome,{evidenceId:data,evidenceKey});
      return json(origin,200,{ok:true,evidenceId:data,evidence:(await admin.rpc("tw_release_gate_evidence_status",{p_gate_key:gateKey})).data||null});
    }

    if(action==="set_release_gate"){
      if(role!=="admin")return json(origin,403,{error:"admin_role_required"});
      const gateKey=safeText(body.gateKey,120);
      const evidenceRef=safeText(body.evidenceRef,500);
      const note=safeText(body.note,1000)||null;
      if(!gateKey||typeof body.verified!=="boolean"||evidenceRef.length<3)throw new Error("release_gate_fields_required");
      const {data,error}=await admin.rpc("tw_release_set_gate",{
        p_staff_user_id:String(user.id),p_gate_key:gateKey,p_verified:body.verified,
        p_evidence_ref:evidenceRef,p_note:note
      });
      if(error)throw new Error(safeText(error.message,180)||"release_gate_update_failed");
      await audit(admin,String(user.id),role,"release_gate_update","release_gate",gateKey,body.verified?"verified":"unverified",{});
      return json(origin,200,{ok:true,result:data,readiness:(await admin.rpc("tw_release_readiness_report")).data||null});
    }

    return json(origin,400,{error:"unsupported_action"});
  }catch(error){
    return json(origin,400,{error:safeText((error as Error)?.message||"release_gateway_error",180)});
  }
});
