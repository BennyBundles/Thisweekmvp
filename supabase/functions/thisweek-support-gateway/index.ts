import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type AnyRecord=Record<string,unknown>;
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const PUBLISHABLE_KEY=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ALLOWED_ORIGINS=(Deno.env.get("THISWEEK_ALLOWED_ORIGINS")||"https://bennybundles.github.io")
  .split(",").map(v=>v.trim()).filter(Boolean);

function safeText(v:unknown,max=4000):string{
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
  try{const p=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");return JSON.parse(atob(p.padEnd(Math.ceil(p.length/4)*4,"=")));}catch{return{};}
}
function cors(origin:string|null):HeadersInit{
  const allowed=origin&&ALLOWED_ORIGINS.includes(origin)?origin:(ALLOWED_ORIGINS[0]||"");
  return {
    "Access-Control-Allow-Origin":allowed,
    "Access-Control-Allow-Headers":"authorization, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Cache-Control":"no-store","Vary":"Origin"
  };
}
function json(origin:string|null,status:number,body:AnyRecord){
  return new Response(JSON.stringify(body),{status,headers:{...cors(origin),"Content-Type":"application/json; charset=utf-8"}});
}
async function activeSession(admin:ReturnType<typeof createClient>,userId:string,token:string){
  const sid=validUuid(decodePayload(token).session_id);
  if(!sid)throw new Error("active_session_required");
  const {data,error}=await admin.rpc("tw_auth_session_active",{p_user_id:userId,p_session_id:sid});
  if(error||data!==true)throw new Error("session_revoked");
}
function containsSensitivePattern(value:string):boolean{
  return /\b(?:sk_live_|sk_test_|access[-_ ]?token|refresh[-_ ]?token|api[-_ ]?secret|password\s*[:=]|cvv\s*[:=]|cvc\s*[:=])\b/i.test(value)
    || /\b\d{12,19}\b/.test(value)
    || /\b\d{3}-\d{2}-\d{4}\b/.test(value);
}
async function supportStatus(admin:ReturnType<typeof createClient>,userId:string){
  const [requests,messages,transfers,bills,cards,switches]=await Promise.all([
    admin.from("tw_support_requests")
      .select("id,request_type,subject,resource_kind,resource_ref,provider,priority,state,ops_case_id,assigned_to_staff_user_id,first_staff_response_at,created_at,updated_at,resolved_at")
      .eq("user_id",userId).order("updated_at",{ascending:false}).limit(50),
    admin.from("tw_support_messages")
      .select("id,request_id,author_kind,body,created_at")
      .eq("user_id",userId).order("id",{ascending:true}).limit(250),
    admin.from("tw_money_transfers")
      .select("id,transfer_type,state,provider,amount_cents,created_at")
      .eq("user_id",userId).order("created_at",{ascending:false}).limit(20),
    admin.from("tw_money_bill_payments")
      .select("id,state,provider,amount_cents,created_at")
      .eq("user_id",userId).order("created_at",{ascending:false}).limit(20),
    admin.from("tw_money_card_authorizations")
      .select("id,state,merchant_name,amount_cents,provider,requested_at")
      .eq("user_id",userId).order("requested_at",{ascending:false}).limit(20),
    admin.from("tw_money_direct_deposit_switches")
      .select("id,state,provider,created_at,confirmed_at")
      .eq("user_id",userId).order("created_at",{ascending:false}).limit(20),
  ]);
  if(requests.error||messages.error||transfers.error||bills.error||cards.error||switches.error)throw new Error("support_status_read_failed");
  return {
    requests:requests.data||[],
    messages:messages.data||[],
    resources:{
      transfers:transfers.data||[],
      billPayments:bills.data||[],
      cardAuthorizations:cards.data||[],
      directDepositSwitches:switches.data||[],
    }
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

  const admin=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  try{await activeSession(admin,String(user.id),token);}
  catch{return json(origin,401,{error:"session_revoked"});}

  let body:AnyRecord={};
  try{body=await req.json() as AnyRecord;}catch{return json(origin,400,{error:"invalid_json"});}
  const action=safeText(body.action,80);

  try{
    if(action==="status"){
      const data=await supportStatus(admin,String(user.id));
      return json(origin,200,{ok:true,...data});
    }

    if(action==="create_request"){
      const requestType=safeText(body.requestType,40);
      const subject=safeText(body.subject,160);
      const message=safeText(body.message,4000);
      const requestId=safeText(body.clientRequestId,120);
      const resourceKind=safeText(body.resourceKind,60)||null;
      const resourceRef=safeText(body.resourceRef,180)||null;
      const provider=safeText(body.provider,60)||null;
      const priority=safeText(body.priority,20)==="high"?"high":"normal";
      if(containsSensitivePattern(subject)||containsSensitivePattern(message))throw new Error("sensitive_secret_pattern_rejected");
      const {data,error}=await admin.rpc("tw_support_create_request",{
        p_user_id:String(user.id),p_client_request_id:requestId,p_request_type:requestType,
        p_subject:subject,p_message:message,p_resource_kind:resourceKind,p_resource_ref:resourceRef,
        p_provider:provider,p_priority:priority
      });
      if(error)throw new Error(safeText(error.message,120)||"support_request_failed");
      return json(origin,200,{ok:true,requestId:data});
    }

    if(action==="add_message"){
      const requestId=validUuid(body.requestId);
      const message=safeText(body.message,4000);
      if(!requestId)throw new Error("request_id_required");
      if(containsSensitivePattern(message))throw new Error("sensitive_secret_pattern_rejected");
      const {data,error}=await admin.rpc("tw_support_add_user_message",{
        p_user_id:String(user.id),p_request_id:requestId,p_message:message
      });
      if(error)throw new Error(safeText(error.message,120)||"support_message_failed");
      return json(origin,200,{ok:true,messageId:data});
    }

    return json(origin,400,{error:"unsupported_action"});
  }catch(error){
    const code=safeText((error as Error)?.message||"support_gateway_error",120);
    const status=code.includes("required")||code.includes("invalid")||code.includes("not_available")||code.includes("rejected")?400:500;
    return json(origin,status,{error:code});
  }
});
