import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type AnyRecord = Record<string, unknown>;
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const PUBLISHABLE_KEY=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ALLOWED_ORIGINS=(Deno.env.get("THISWEEK_ALLOWED_ORIGINS")||"https://bennybundles.github.io")
  .split(",").map(x=>x.trim()).filter(Boolean);

function safeText(v:unknown,max=200){return String(v??"").normalize("NFC").replace(/[\u0000-\u001F\u007F]/g,"").trim().slice(0,max);}
function cors(origin:string|null):HeadersInit{const allow=origin&&ALLOWED_ORIGINS.includes(origin)?origin:(ALLOWED_ORIGINS[0]||"");return{"Access-Control-Allow-Origin":allow,"Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Cache-Control":"no-store","Vary":"Origin"};}
function json(origin:string|null,status:number,body:AnyRecord){return new Response(JSON.stringify(body),{status,headers:{...cors(origin),"Content-Type":"application/json; charset=utf-8"}});}
function decodePayload(token:string):AnyRecord{try{const p=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");const padded=p.padEnd(Math.ceil(p.length/4)*4,"=");return JSON.parse(atob(padded));}catch{return{};}}
function validUuid(v:unknown){const s=safeText(v,80);return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)?s:null;}
async function requireActiveSession(admin:ReturnType<typeof createClient>,userId:string,token:string){
  const sid=validUuid(decodePayload(token).session_id);
  if(!sid) throw new Error("active_session_required");
  const {data,error}=await admin.rpc("tw_auth_session_active",{p_user_id:userId,p_session_id:sid});
  if(error||data!==true) throw new Error("session_revoked");
  return sid;
}
async function moneyHistory(admin:ReturnType<typeof createClient>,userId:string){
  const qs=[
    admin.from("tw_money_journals").select("id",{count:"exact",head:true}).eq("user_id",userId),
    admin.from("tw_money_transfers").select("id",{count:"exact",head:true}).eq("user_id",userId),
    admin.from("tw_money_bill_payments").select("id",{count:"exact",head:true}).eq("user_id",userId),
    admin.from("tw_money_card_authorizations").select("id",{count:"exact",head:true}).eq("user_id",userId),
    admin.from("tw_money_payroll_deposits").select("id",{count:"exact",head:true}).eq("user_id",userId),
    admin.from("tw_money_reward_enrollments").select("id",{count:"exact",head:true}).eq("user_id",userId),
  ];
  const rs=await Promise.all(qs);
  if(rs.some(x=>x.error)) throw new Error("closure_history_check_failed");
  const counts=rs.map(x=>x.count||0);
  return {hasFinancialHistory:counts.some(x=>x>0),counts:{
    journals:counts[0],transfers:counts[1],billPayments:counts[2],
    cardAuthorizations:counts[3],payrollDeposits:counts[4],rewards:counts[5]
  }};
}
async function deleteVaultSecrets(admin:ReturnType<typeof createClient>,userId:string){
  const {data,error}=await admin.from("tw_provider_connections").select("vault_secret_id").eq("user_id",userId);
  if(error) throw new Error("provider_secret_lookup_failed");
  for(const row of data||[]){
    if(!row.vault_secret_id) continue;
    const del=await admin.rpc("tw_vault_delete",{p_secret_id:row.vault_secret_id});
    if(del.error) throw new Error("provider_secret_delete_failed");
  }
}

Deno.serve(async(req)=>{
  const origin=req.headers.get("Origin");
  if(req.method==="OPTIONS"){if(origin&&!ALLOWED_ORIGINS.includes(origin))return json(origin,403,{error:"origin_not_allowed"});return new Response("ok",{headers:cors(origin)});}
  if(req.method!=="POST")return json(origin,405,{error:"method_not_allowed"});
  if(origin&&!ALLOWED_ORIGINS.includes(origin))return json(origin,403,{error:"origin_not_allowed"});
  if(!SUPABASE_URL||!PUBLISHABLE_KEY||!SERVICE_KEY)return json(origin,503,{error:"backend_not_configured"});

  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer "))return json(origin,401,{error:"authentication_required"});
  const token=auth.slice(7);
  const userClient=createClient(SUPABASE_URL,PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:auth}}});
  const {data:ud,error:ue}=await userClient.auth.getUser(token);
  const user=ud?.user;
  if(ue||!user)return json(origin,401,{error:"invalid_session"});
  if((user as AnyRecord).is_anonymous===true)return json(origin,403,{error:"recoverable_auth_required"});
  const admin=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

  let body:AnyRecord={};try{body=await req.json() as AnyRecord;}catch{return json(origin,400,{error:"invalid_json"});}
  try{
    const sessionId=await requireActiveSession(admin,user.id,token);
    const action=safeText(body.action,60);
    const {data:aalData}=await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
    const aal={currentLevel:aalData?.currentLevel||null,nextLevel:aalData?.nextLevel||null};

    if(action==="status"){
      const hist=await moneyHistory(admin,user.id);
      return json(origin,200,{ok:true,user:{id:user.id,email:user.email||null,emailConfirmedAt:(user as AnyRecord).email_confirmed_at||null},session:{id:sessionId,aal},closure:{hardDeleteEligible:!hist.hasFinancialHistory,...hist}});
    }
    if(action==="delete_account"){
      if(safeText(body.confirmation,20)!=="DELETE")return json(origin,400,{error:"typed_confirmation_required"});
      if(safeText(body.email,320).toLowerCase()!==String(user.email||"").toLowerCase())return json(origin,400,{error:"email_confirmation_mismatch"});
      if(aal.nextLevel==="aal2"&&aal.currentLevel!=="aal2")return json(origin,403,{error:"mfa_aal2_required"});
      const hist=await moneyHistory(admin,user.id);
      const inserted=await admin.from("tw_account_closure_requests").insert({
        user_id:user.id,state:hist.hasFinancialHistory?"review_required":"requested",
        reason_code:hist.hasFinancialHistory?"financial_history_retention":"user_requested",
        has_financial_history:hist.hasFinancialHistory,
        safe_detail:{counts:hist.counts}
      }).select("id,state").single();
      if(inserted.error||!inserted.data)throw new Error("closure_request_store_failed");
      if(hist.hasFinancialHistory){
        return json(origin,409,{error:"retention_review_required",requestId:inserted.data.id,counts:hist.counts});
      }
      await deleteVaultSecrets(admin,user.id);
      const del=await admin.auth.admin.deleteUser(user.id,false);
      if(del.error){
        await admin.from("tw_account_closure_requests").update({state:"failed",resolved_at:new Date().toISOString(),safe_detail:{counts:hist.counts,error_code:"auth_delete_failed"}}).eq("id",inserted.data.id);
        throw new Error("auth_delete_failed");
      }
      await admin.from("tw_account_closure_requests").update({state:"hard_deleted",resolved_at:new Date().toISOString()}).eq("id",inserted.data.id);
      return json(origin,200,{ok:true,deleted:true});
    }
    return json(origin,400,{error:"unsupported_action"});
  }catch(error){
    const code=safeText((error as Error)?.message||"account_gateway_error",120);
    const status=code==="session_revoked"||code==="active_session_required"?401:code.includes("required")||code.includes("mismatch")?400:500;
    return json(origin,status,{error:code});
  }
});
