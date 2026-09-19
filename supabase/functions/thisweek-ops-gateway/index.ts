import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type AnyRecord = Record<string, unknown>;

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const PUBLISHABLE_KEY=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ALLOWED_ORIGINS=(Deno.env.get("THISWEEK_ALLOWED_ORIGINS")||"https://bennybundles.github.io")
  .split(",").map(v=>v.trim()).filter(Boolean);
const STAFF_ROLES=new Set(["support_ops","risk_ops","admin"]);
const RISK_ROLES=new Set(["risk_ops","admin"]);

function safeText(v:unknown,max=240):string{
  return String(v??"").normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g,"")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g,"")
    .trim().slice(0,max);
}
function validUuid(v:unknown):string|null{
  const s=safeText(v,80);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)?s:null;
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
async function activeSession(admin:ReturnType<typeof createClient>,userId:string,token:string){
  const sid=validUuid(decodePayload(token).session_id);
  if(!sid)throw new Error("active_session_required");
  const {data,error}=await admin.rpc("tw_auth_session_active",{p_user_id:userId,p_session_id:sid});
  if(error||data!==true)throw new Error("session_revoked");
}
function staffRole(user:AnyRecord):string{
  const app=user.app_metadata&&typeof user.app_metadata==="object"?user.app_metadata as AnyRecord:{};
  return safeText(app.thisweek_role,40);
}
async function requireAal2(userClient:ReturnType<typeof createClient>){
  const {data,error}=await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
  if(error||data?.currentLevel!=="aal2")throw new Error("mfa_aal2_required");
}
async function dashboard(admin:ReturnType<typeof createClient>){
  const [alerts,cases,reviews,riskEvents,staffActions]=await Promise.all([
    admin.from("tw_ops_alerts")
      .select("id,user_id,case_id,risk_review_id,alert_type,severity,state,safe_detail,created_at,updated_at,acknowledged_at")
      .neq("state","resolved").order("created_at",{ascending:false}).limit(100),
    admin.from("tw_ops_cases")
      .select("id,user_id,case_key,case_type,provider,provider_case_id,resource_ref,amount_cents,severity,state,reason_code,safe_detail,assigned_to_staff_user_id,assigned_at,opened_at,updated_at,resolved_at")
      .not("state","in","(resolved,closed)").order("updated_at",{ascending:false}).limit(100),
    admin.from("tw_risk_reviews")
      .select("id,user_id,risk_event_id,state,resolution_code,resolution_note,assigned_to_staff_user_id,assigned_at,created_at,resolved_at")
      .eq("state","pending").order("created_at",{ascending:true}).limit(100),
    admin.from("tw_risk_events")
      .select("id,user_id,environment,action,amount_cents,decision,reason_code,resource_ref,safe_context,created_at")
      .eq("decision","review").order("created_at",{ascending:false}).limit(200),
    admin.from("tw_ops_staff_actions")
      .select("id,staff_user_id,staff_role,action,target_type,target_ref,reason_code,safe_detail,created_at")
      .order("id",{ascending:false}).limit(100),
  ]);
  if(alerts.error||cases.error||reviews.error||riskEvents.error||staffActions.error)throw new Error("ops_dashboard_read_failed");
  const eventById=new Map((riskEvents.data||[]).map((e:AnyRecord)=>[String(e.id),e]));
  return {
    alerts:alerts.data||[],
    cases:cases.data||[],
    riskReviews:(reviews.data||[]).map((r:AnyRecord)=>({...r,riskEvent:eventById.get(String(r.risk_event_id))||null})),
    recentStaffActions:staffActions.data||[],
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
      const data=await dashboard(admin);
      return json(origin,200,{
        ok:true,
        staff:{userId:String(user.id),email:safeText(user.email,320)||null,role},
        counts:{
          alerts:data.alerts.length,
          cases:data.cases.length,
          riskReviews:data.riskReviews.length,
        }
      });
    }
    if(action==="dashboard"){
      const data=await dashboard(admin);
      return json(origin,200,{ok:true,staff:{userId:String(user.id),email:safeText(user.email,320)||null,role},...data});
    }
    if(action==="assign_case"){
      const caseId=validUuid(body.caseId);if(!caseId)throw new Error("case_id_required");
      const {data,error}=await admin.rpc("tw_ops_assign_case",{
        p_case_id:caseId,p_staff_user_id:String(user.id),p_staff_role:role
      });
      if(error)throw new Error(safeText(error.message,120)||"case_assignment_failed");
      return json(origin,200,{ok:true,result:data});
    }
    if(action==="resolve_case"){
      const caseId=validUuid(body.caseId);
      const state=safeText(body.state,40),reason=safeText(body.reasonCode,100),note=safeText(body.note,500);
      if(!caseId||!state||!reason)throw new Error("case_resolution_fields_required");
      const {data,error}=await admin.rpc("tw_ops_resolve_case",{
        p_case_id:caseId,p_staff_user_id:String(user.id),p_staff_role:role,
        p_state:state,p_reason_code:reason,p_note:note||null
      });
      if(error)throw new Error(safeText(error.message,120)||"case_resolution_failed");
      return json(origin,200,{ok:true,result:data});
    }
    if(action==="ack_alert"){
      const alertId=validUuid(body.alertId);if(!alertId)throw new Error("alert_id_required");
      const {data,error}=await admin.rpc("tw_ops_ack_alert",{
        p_alert_id:alertId,p_staff_user_id:String(user.id),p_staff_role:role
      });
      if(error)throw new Error(safeText(error.message,120)||"alert_ack_failed");
      return json(origin,200,{ok:true,result:data});
    }
    if(action==="resolve_risk_review"){
      if(!RISK_ROLES.has(role))return json(origin,403,{error:"risk_ops_role_required"});
      const reviewId=validUuid(body.reviewId);
      const resolution=safeText(body.resolution,30),reason=safeText(body.reasonCode,100),note=safeText(body.note,500);
      if(!reviewId||!resolution||!reason)throw new Error("risk_review_fields_required");
      const {data,error}=await admin.rpc("tw_ops_resolve_risk_review",{
        p_review_id:reviewId,p_staff_user_id:String(user.id),p_staff_role:role,
        p_resolution:resolution,p_resolution_code:reason,p_resolution_note:note||null
      });
      if(error)throw new Error(safeText(error.message,120)||"risk_review_resolution_failed");
      return json(origin,200,{ok:true,result:data});
    }
    if(action==="set_user_control"){
      if(!RISK_ROLES.has(role))return json(origin,403,{error:"risk_ops_role_required"});
      const subject=validUuid(body.userId),state=safeText(body.state,30),reason=safeText(body.reasonCode,100);
      if(!subject||!state)throw new Error("user_control_fields_required");
      if(state!=="normal"&&!reason)throw new Error("reason_code_required");
      const expires=safeText(body.expiresAt,80)||null;
      const {data,error}=await admin.rpc("tw_ops_set_user_control",{
        p_subject_user_id:subject,p_staff_user_id:String(user.id),p_staff_role:role,
        p_state:state,p_reason_code:reason||"control_cleared",p_expires_at:expires
      });
      if(error)throw new Error(safeText(error.message,120)||"user_control_update_failed");
      return json(origin,200,{ok:true,result:data});
    }
    return json(origin,400,{error:"unsupported_action"});
  }catch(error){
    const code=safeText((error as Error)?.message||"ops_gateway_error",120);
    const status=code.includes("role_required")?403:
      code.includes("required")||code.includes("invalid")||code.includes("not_found")?400:500;
    return json(origin,status,{error:code});
  }
});
