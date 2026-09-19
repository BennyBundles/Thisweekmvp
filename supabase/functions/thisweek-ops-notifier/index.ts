import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type AnyRecord = Record<string, unknown>;

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const DESTINATION=(Deno.env.get("THISWEEK_OPS_NOTIFICATION_WEBHOOK_URL")||"").trim();
const BEARER=(Deno.env.get("THISWEEK_OPS_NOTIFICATION_WEBHOOK_BEARER")||"").trim();

function safeText(v:unknown,max=200):string{
  return String(v??"").normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g,"")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g,"")
    .trim().slice(0,max);
}
function validUuid(v:unknown):string|null{
  const s=safeText(v,80);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)?s:null;
}
function json(status:number,body:AnyRecord){
  return new Response(JSON.stringify(body),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
  });
}
function configuredDestination():URL|null{
  if(!DESTINATION)return null;
  try{
    const u=new URL(DESTINATION);
    if(u.protocol!=="https:")return null;
    return u;
  }catch{return null;}
}
function retrySeconds(attempt:unknown):number{
  const n=Math.max(1,Number(attempt)||1);
  return Math.min(3600,60*Math.pow(2,Math.min(n-1,6)));
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json(405,{error:"method_not_allowed"});
  if(!SUPABASE_URL||!SERVICE_KEY)return json(503,{error:"backend_not_configured"});
  let body:AnyRecord={};
  try{body=await req.json() as AnyRecord;}catch{return json(400,{error:"invalid_json"});}
  const nonce=validUuid(body.nonce);
  if(!nonce)return json(401,{error:"dispatch_nonce_required"});

  const admin=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const consumed=await admin.rpc("tw_ops_consume_dispatch_nonce",{p_nonce:nonce});
  if(consumed.error||consumed.data!==true)return json(401,{error:"dispatch_nonce_invalid"});

  const destination=configuredDestination();
  if(!destination){
    await admin.rpc("tw_ops_update_notification_channel",{
      p_configured:false,p_state:"unconfigured",p_error_code:"notification_webhook_not_configured",p_success:false
    });
    return json(200,{ok:true,configured:false,dispatched:0,failed:0});
  }

  const claimed=await admin.rpc("tw_ops_claim_notifications",{p_limit:10});
  if(claimed.error){
    await admin.rpc("tw_ops_update_notification_channel",{
      p_configured:true,p_state:"degraded",p_error_code:"notification_claim_failed",p_success:false
    });
    return json(500,{error:"notification_claim_failed"});
  }

  const rows=Array.isArray(claimed.data)?claimed.data as AnyRecord[]:[];
  let sent=0,failed=0,lastError:string|null=null;

  for(const row of rows){
    const payload={
      schema:"thisweek.ops.notification.v1",
      notificationId:safeText(row.id,80),
      eventType:safeText(row.event_type,80),
      severity:safeText(row.severity,20),
      subject:safeText(row.subject,160),
      body:safeText(row.safe_body,2000),
      alertId:safeText(row.alert_id,80)||null,
      incidentId:safeText(row.incident_id,80)||null,
      createdAt:safeText(row.created_at,80)
    };
    try{
      const headers:Record<string,string>={"Content-Type":"application/json","User-Agent":"ThisWeek-Ops-Notifier/1"};
      if(BEARER)headers.Authorization="Bearer "+BEARER;
      const res=await fetch(destination,{
        method:"POST",headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(5000)
      });
      if(res.ok){
        const done=await admin.rpc("tw_ops_complete_notification",{
          p_id:row.id,p_success:true,p_error_code:null,p_retry_after_seconds:60
        });
        if(done.error||done.data!==true)throw new Error("notification_complete_failed");
        sent++;
      }else{
        const code="http_"+res.status;
        lastError=code;failed++;
        await admin.rpc("tw_ops_complete_notification",{
          p_id:row.id,p_success:false,p_error_code:code,
          p_retry_after_seconds:retrySeconds(row.attempt_count)
        });
      }
    }catch(error){
      const code=safeText((error as Error)?.name||"dispatch_error",80)||"dispatch_error";
      lastError=code;failed++;
      await admin.rpc("tw_ops_complete_notification",{
        p_id:row.id,p_success:false,p_error_code:code,
        p_retry_after_seconds:retrySeconds(row.attempt_count)
      });
    }
  }

  await admin.rpc("tw_ops_update_notification_channel",{
    p_configured:true,
    p_state:failed>0?"degraded":"healthy",
    p_error_code:lastError,
    p_success:failed===0
  });

  return json(200,{ok:true,configured:true,claimed:rows.length,dispatched:sent,failed});
});
