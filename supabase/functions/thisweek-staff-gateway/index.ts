import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type AnyRecord = Record<string, unknown>;
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const PUBLISHABLE_KEY=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const BOOTSTRAP_ADMIN_EMAIL=(Deno.env.get("THISWEEK_BOOTSTRAP_ADMIN_EMAIL")||"").trim().toLowerCase();
const ALLOWED_ORIGINS=(Deno.env.get("THISWEEK_ALLOWED_ORIGINS")||"https://bennybundles.github.io")
  .split(",").map(v=>v.trim()).filter(Boolean);
const STAFF_ROLES=new Set(["support_ops","risk_ops","admin"]);

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
async function activeSession(admin:ReturnType<typeof createClient>,userId:string,token:string):Promise<string>{
  const sid=validUuid(decodePayload(token).session_id);
  if(!sid)throw new Error("active_session_required");
  const {data,error}=await admin.rpc("tw_auth_session_active",{p_user_id:userId,p_session_id:sid});
  if(error||data!==true)throw new Error("session_revoked");
  return sid;
}
async function aal(userClient:ReturnType<typeof createClient>){
  const {data,error}=await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
  if(error)throw new Error("mfa_status_failed");
  return data?.currentLevel||"aal1";
}
async function requireAal2(userClient:ReturnType<typeof createClient>){
  if((await aal(userClient))!=="aal2")throw new Error("mfa_aal2_required");
}
async function authoritativeRole(admin:ReturnType<typeof createClient>,userId:string):Promise<string>{
  const {data,error}=await admin.rpc("tw_staff_user_role",{p_user_id:userId});
  if(error)throw new Error("staff_role_lookup_failed");
  return safeText(data,40);
}
async function roleSummary(admin:ReturnType<typeof createClient>):Promise<AnyRecord>{
  const {data,error}=await admin.rpc("tw_staff_role_summary");
  if(error||!data||typeof data!=="object")throw new Error("staff_role_summary_failed");
  return data as AnyRecord;
}
async function roleEvent(
  admin:ReturnType<typeof createClient>,
  actorUserId:string,targetUserId:string,action:string,previousRole:string|null,nextRole:string|null,
  reasonCode:string,evidenceRef:string,safeDetail:AnyRecord
){
  const {error}=await admin.from("tw_ops_staff_role_events").insert({
    actor_user_id:actorUserId,target_user_id:targetUserId,action,
    previous_role:previousRole,next_role:nextRole,
    reason_code:reasonCode,evidence_ref:evidenceRef,safe_detail:safeDetail
  });
  if(error)throw new Error("staff_role_audit_failed");
}
function metadataWithRole(meta:unknown,nextRole:string|null):AnyRecord{
  const out=(meta&&typeof meta==="object"&&!Array.isArray(meta))?{...(meta as AnyRecord)}:{};
  if(nextRole)out.thisweek_role=nextRole;
  else delete out.thisweek_role;
  return out;
}

Deno.serve(async(req)=>{
  const origin=req.headers.get("Origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return json(origin,405,{error:"method_not_allowed"});
  if(origin&&!ALLOWED_ORIGINS.includes(origin))return json(origin,403,{error:"origin_not_allowed"});
  if(!SUPABASE_URL||!PUBLISHABLE_KEY||!SERVICE_KEY)return json(origin,503,{error:"staff_gateway_unconfigured"});

  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer "))return json(origin,401,{error:"missing_bearer"});
  const token=auth.slice(7);
  const userClient=createClient(SUPABASE_URL,PUBLISHABLE_KEY,{
    global:{headers:{Authorization:`Bearer ${token}`}},
    auth:{persistSession:false,autoRefreshToken:false}
  });
  const admin=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

  try{
    const {data:userData,error:userError}=await userClient.auth.getUser(token);
    const user=userData?.user;
    if(userError||!user)return json(origin,401,{error:"invalid_session"});
    const sessionId=await activeSession(admin,String(user.id),token);
    const body=(await req.json().catch(()=>({}))) as AnyRecord;
    const action=safeText(body.action,80);

    if(action==="status"){
      const [summary,currentLevel,callerRole]=await Promise.all([
        roleSummary(admin),aal(userClient),authoritativeRole(admin,String(user.id))
      ]);
      const email=safeText(user.email,320).toLowerCase();
      const emailConfirmed=Boolean(user.email_confirmed_at);
      const bootstrapConfigured=BOOTSTRAP_ADMIN_EMAIL.length>=3;
      const staffUserCount=Number(summary.staffUserCount||0);
      return json(origin,200,{
        ok:true,
        summary,
        caller:{
          userId:String(user.id),
          role:callerRole||null,
          emailConfirmed,
          aal:currentLevel
        },
        bootstrap:{
          configured:bootstrapConfigured,
          noStaffYet:staffUserCount===0,
          emailMatches:bootstrapConfigured&&email===BOOTSTRAP_ADMIN_EMAIL,
          eligible:bootstrapConfigured&&staffUserCount===0&&emailConfirmed&&email===BOOTSTRAP_ADMIN_EMAIL&&currentLevel==="aal2"
        }
      });
    }

    if(action==="bootstrap_admin"){
      await requireAal2(userClient);
      const summary=await roleSummary(admin);
      if(Number(summary.staffUserCount||0)!==0)throw new Error("staff_bootstrap_closed");
      if(!BOOTSTRAP_ADMIN_EMAIL)throw new Error("staff_bootstrap_unconfigured");
      const email=safeText(user.email,320).toLowerCase();
      if(!user.email_confirmed_at)throw new Error("confirmed_email_required");
      if(email!==BOOTSTRAP_ADMIN_EMAIL)throw new Error("bootstrap_identity_not_allowlisted");
      const evidenceRef=safeText(body.evidenceRef,500);
      if(evidenceRef.length<3)throw new Error("bootstrap_evidence_required");

      const previousRole=await authoritativeRole(admin,String(user.id));
      if(previousRole)throw new Error("staff_role_already_assigned");
      const nextMetadata=metadataWithRole(user.app_metadata,"admin");
      const {error:updateError}=await admin.auth.admin.updateUserById(String(user.id),{app_metadata:nextMetadata});
      if(updateError)throw new Error("staff_bootstrap_update_failed");

      await roleEvent(admin,String(user.id),String(user.id),"bootstrap_admin",null,"admin",
        "initial_staff_bootstrap",evidenceRef,{
          source:"thisweek-staff-gateway",
          sessionId,
          bootstrapAllowlistConfigured:true
        });

      return json(origin,200,{
        ok:true,targetUserId:String(user.id),previousRole:null,nextRole:"admin",
        sessionRefreshRequired:true,
        note:"Initial admin role assigned. Refresh or re-authenticate before using staff consoles."
      });
    }

    if(action==="set_role"){
      await requireAal2(userClient);
      const actorRole=await authoritativeRole(admin,String(user.id));
      if(actorRole!=="admin")return json(origin,403,{error:"admin_role_required"});

      const targetUserId=validUuid(body.targetUserId);
      const roleRaw=safeText(body.role,40);
      const nextRole=roleRaw==="revoke"||roleRaw===""?null:roleRaw;
      const reasonCode=safeText(body.reasonCode,120);
      const evidenceRef=safeText(body.evidenceRef,500);
      if(!targetUserId)throw new Error("valid_target_user_required");
      if(nextRole!==null&&!STAFF_ROLES.has(nextRole))throw new Error("invalid_staff_role");
      if(reasonCode.length<3||evidenceRef.length<3)throw new Error("role_change_evidence_required");

      const {data:targetData,error:targetError}=await admin.auth.admin.getUserById(targetUserId);
      const target=targetData?.user;
      if(targetError||!target)throw new Error("target_user_not_found");
      if(nextRole&&!target.email_confirmed_at)throw new Error("target_confirmed_email_required");

      const previousRole=safeText((target.app_metadata as AnyRecord|undefined)?.thisweek_role,40)||null;
      if(previousRole===nextRole)throw new Error("role_unchanged");

      const summary=await roleSummary(admin);
      if(previousRole==="admin"&&nextRole!=="admin"&&Number(summary.adminCount||0)<=1){
        throw new Error("last_admin_protected");
      }

      const nextMetadata=metadataWithRole(target.app_metadata,nextRole);
      const {error:updateError}=await admin.auth.admin.updateUserById(targetUserId,{app_metadata:nextMetadata});
      if(updateError)throw new Error("staff_role_update_failed");

      await roleEvent(admin,String(user.id),targetUserId,nextRole?"set_role":"revoke_role",
        previousRole,nextRole,reasonCode,evidenceRef,{
          source:"thisweek-staff-gateway",
          actorRole,
          sessionId
        });

      return json(origin,200,{
        ok:true,targetUserId,previousRole,nextRole,
        sessionRefreshRequired:true
      });
    }

    return json(origin,400,{error:"unknown_action"});
  }catch(error){
    const message=safeText(error instanceof Error?error.message:error,180)||"staff_gateway_failed";
    const status=/required|invalid_session|session_revoked|allowlisted|admin_role_required|closed|protected/.test(message)?403:400;
    return json(origin,status,{error:message});
  }
});
