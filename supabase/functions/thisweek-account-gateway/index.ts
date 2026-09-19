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
async function legalStatuses(admin:ReturnType<typeof createClient>,userId:string){
  const [sandbox,production]=await Promise.all([
    admin.rpc("tw_legal_status",{p_user_id:userId,p_environment:"sandbox"}),
    admin.rpc("tw_legal_status",{p_user_id:userId,p_environment:"production"}),
  ]);
  if(sandbox.error||production.error)throw new Error("legal_status_read_failed");
  return {sandbox:sandbox.data||null,production:production.data||null};
}


type PrivacyDataset = {
  table:string;
  columns:string;
  userColumn:string;
  order:string;
};
const PRIVACY_DATASETS:Record<string,PrivacyDataset>=Object.freeze({
  provider_connections:{
    table:"tw_provider_connections",
    columns:"id,provider,institution_id,institution_name,status,last_success_at,last_error_code,created_at,updated_at,revision",
    userColumn:"user_id",order:"created_at"
  },
  provider_accounts:{
    table:"tw_provider_accounts",
    columns:"id,connection_id,display_name,mask_last4,account_type,account_subtype,currency,available_balance_cents,current_balance_cents,balance_as_of,status,created_at,updated_at",
    userColumn:"user_id",order:"created_at"
  },
  provider_transactions:{
    table:"tw_provider_transactions",
    columns:"id,connection_id,account_id,status,direction,amount_cents,iso_currency_code,transaction_date,authorized_at,description,merchant_name,category_hint,first_seen_at,updated_at",
    userColumn:"user_id",order:"first_seen_at"
  },
  money_customers:{
    table:"tw_money_customers",
    columns:"id,banking_provider,onboarding_state,kyc_state,provider_application_status,created_at,updated_at",
    userColumn:"user_id",order:"created_at"
  },
  deposit_accounts:{
    table:"tw_money_deposit_accounts",
    columns:"id,money_customer_id,provider,account_kind,status,currency,routing_last4,account_last4,capabilities,opened_at,created_at,updated_at",
    userColumn:"user_id",order:"created_at"
  },
  envelopes:{
    table:"tw_money_envelopes",
    columns:"id,envelope_key,label,envelope_type,linked_plan_ref,status,created_at,updated_at",
    userColumn:"user_id",order:"created_at"
  },
  ledger_accounts:{
    table:"tw_money_ledger_accounts",
    columns:"id,deposit_account_id,envelope_id,account_code,account_kind,currency,status,created_at",
    userColumn:"user_id",order:"created_at"
  },
  journals:{
    table:"tw_money_journals",
    columns:"id,event_type,currency,provider,effective_at,metadata,created_at",
    userColumn:"user_id",order:"created_at"
  },
  ledger_entries:{
    table:"tw_money_ledger_entries",
    columns:"id,journal_id,ledger_account_id,amount_cents,created_at",
    userColumn:"user_id",order:"id"
  },
  authorizations:{
    table:"tw_money_authorizations",
    columns:"id,authorization_kind,terms_version,consent_text_hash,provider,accepted_at,revoked_at,created_at",
    userColumn:"user_id",order:"created_at"
  },
  funding_accounts:{
    table:"tw_money_funding_accounts",
    columns:"id,provider_connection_id,provider_account_row_id,verification_provider,processor_provider,account_kind,account_last4,routing_last4,status,supported_rails,provider_link_kind,provider_status,created_at,updated_at",
    userColumn:"user_id",order:"created_at"
  },
  transfers:{
    table:"tw_money_transfers",
    columns:"id,transfer_type,rail,source_kind,source_ref,destination_kind,destination_ref,amount_cents,currency,state,authorization_id,provider,failure_code,provider_status,created_at,updated_at,settled_at",
    userColumn:"user_id",order:"created_at"
  },
  transfer_events:{
    table:"tw_money_transfer_events",
    columns:"id,transfer_id,state,detail_code,occurred_at,created_at",
    userColumn:"user_id",order:"id"
  },
  direct_deposit_switches:{
    table:"tw_money_direct_deposit_switches",
    columns:"id,target_deposit_account_id,provider,allocation_kind,allocation_value,state,failure_code,created_at,updated_at,confirmed_at",
    userColumn:"user_id",order:"created_at"
  },
  payroll_deposits:{
    table:"tw_money_payroll_deposits",
    columns:"id,deposit_account_id,provider,employer_label,amount_cents,currency,posted_at,qualifying_direct_deposit,created_at",
    userColumn:"user_id",order:"created_at"
  },
  reward_enrollments:{
    table:"tw_money_reward_enrollments",
    columns:"id,offer_id,direct_deposit_switch_id,status,enrolled_at,qualifying_deposit_id,payout_transfer_id,paid_at,disqualification_code",
    userColumn:"user_id",order:"enrolled_at"
  },
  billers:{
    table:"tw_money_billers",
    columns:"id,display_name,bill_type,account_mask,status,autopay_state,due_day,safe_metadata,created_at,updated_at",
    userColumn:"user_id",order:"created_at"
  },
  virtual_cards:{
    table:"tw_money_virtual_cards",
    columns:"id,deposit_account_id,envelope_id,biller_id,provider,card_mode,label,status,spend_limit_cents,allowed_mcc,last4,expires_at,created_at,updated_at",
    userColumn:"user_id",order:"created_at"
  },
  card_authorizations:{
    table:"tw_money_card_authorizations",
    columns:"id,card_id,provider,amount_cents,currency,merchant_name,mcc,decision,decision_reason,state,hold_journal_id,settlement_journal_id,requested_at,settled_at,final_amount_cents,approved_amount_cents,decision_source,card_decision_source,reversed_at",
    userColumn:"user_id",order:"requested_at"
  },
  bill_payments:{
    table:"tw_money_bill_payments",
    columns:"id,biller_id,source_deposit_account_id,source_funding_account_id,source_envelope_id,virtual_card_id,authorization_id,amount_cents,currency,payment_rail,provider,state,scheduled_for,failure_code,created_at,updated_at,paid_at",
    userColumn:"user_id",order:"created_at"
  },
  bill_switches:{
    table:"tw_money_bill_switches",
    columns:"id,biller_id,provider,target_kind,target_ref,state,failure_code,created_at,updated_at,confirmed_at",
    userColumn:"user_id",order:"created_at"
  },
  legal_acceptances:{
    table:"tw_legal_acceptances",
    columns:"id,legal_document_id,affirmation,accepted_at,created_at",
    userColumn:"user_id",order:"accepted_at"
  },
  support_requests:{
    table:"tw_support_requests",
    columns:"id,request_type,subject,resource_kind,resource_ref,provider,priority,state,first_staff_response_at,created_at,updated_at,resolved_at",
    userColumn:"user_id",order:"created_at"
  },
  support_messages:{
    table:"tw_support_messages",
    columns:"id,request_id,author_kind,body,created_at",
    userColumn:"user_id",order:"created_at"
  },
  sensitive_access:{
    table:"tw_sensitive_access_events",
    columns:"id,staff_role,action,resource_type,resource_ref,data_classes,reason_code,created_at",
    userColumn:"subject_user_id",order:"id"
  },
  closure_requests:{
    table:"tw_account_closure_requests",
    columns:"id,state,reason_code,has_financial_history,requested_at,resolved_at,safe_detail",
    userColumn:"user_id",order:"requested_at"
  },
  export_history:{
    table:"tw_privacy_export_events",
    columns:"id,export_id,event_type,format,dataset_count,record_count,created_at",
    userColumn:"user_id",order:"id"
  }
});

async function privacyInventory(
  admin:ReturnType<typeof createClient>,
  userId:string,
  user:AnyRecord
){
  const datasets=Object.entries(PRIVACY_DATASETS);
  const counts=await Promise.all(datasets.map(async([key,cfg])=>{
    const q=await admin.from(cfg.table).select("id",{count:"exact",head:true}).eq(cfg.userColumn,userId);
    if(q.error)throw new Error("privacy_inventory_read_failed");
    return {key,count:q.count||0};
  }));
  const [retention,history,legal]=await Promise.all([
    admin.rpc("tw_retention_status",{p_environment:"production"}),
    moneyHistory(admin,userId),
    legalStatuses(admin,userId)
  ]);
  if(retention.error)throw new Error("retention_status_read_failed");
  return {
    schema:"thisweek.cloud-export-manifest.v1",
    generatedAt:new Date().toISOString(),
    identity:{
      userId,
      email:safeText(user.email,320)||null,
      emailConfirmedAt:safeText(user.email_confirmed_at,80)||null,
      createdAt:safeText(user.created_at,80)||null,
      lastSignInAt:safeText(user.last_sign_in_at,80)||null
    },
    datasets:counts,
    retention:retention.data||null,
    closure:{
      hardDeleteEligible:!history.hasFinancialHistory,
      hasFinancialHistory:history.hasFinancialHistory,
      counts:history.counts
    },
    legal,
    excludedFromSelfService:[
      "provider_credentials_and_vault_secrets",
      "full_bank_account_and_card_credentials",
      "raw_provider_webhook_payloads",
      "internal_fraud_detection_logic_and_risk_model_details",
      "internal_staff_notes_not_already_customer_visible"
    ],
    localPlanNote:"The weekly Plan remains browser-local and is not part of this cloud export. Use the planner Data Model & Export surface for local Plan data."
  };
}

async function privacyExportStart(
  admin:ReturnType<typeof createClient>,
  userId:string,
  user:AnyRecord
){
  const exportId=crypto.randomUUID();
  const inventory=await privacyInventory(admin,userId,user);
  const inserted=await admin.from("tw_privacy_export_events").insert({
    export_id:exportId,user_id:userId,event_type:"started",format:"json",
    dataset_count:inventory.datasets.length,
    safe_detail:{schema:inventory.schema}
  });
  if(inserted.error)throw new Error("privacy_export_audit_failed");
  return {exportId,inventory,pageLimitMax:500};
}

async function privacyExportPage(
  admin:ReturnType<typeof createClient>,
  userId:string,
  body:AnyRecord
){
  const exportId=validUuid(body.exportId);
  const dataset=safeText(body.dataset,80);
  const offset=Math.max(0,Math.min(10_000_000,Number(body.offset)||0));
  const limit=Math.max(1,Math.min(500,Number(body.limit)||250));
  if(!exportId||!PRIVACY_DATASETS[dataset])throw new Error("privacy_export_page_invalid");

  const started=await admin.from("tw_privacy_export_events")
    .select("id").eq("user_id",userId).eq("export_id",exportId).eq("event_type","started").maybeSingle();
  if(started.error||!started.data)throw new Error("privacy_export_not_found");

  const cfg=PRIVACY_DATASETS[dataset];
  const page=await admin.from(cfg.table)
    .select(cfg.columns,{count:"exact"})
    .eq(cfg.userColumn,userId)
    .order(cfg.order,{ascending:true})
    .range(offset,offset+limit-1);
  if(page.error)throw new Error("privacy_export_dataset_failed");
  const rows=page.data||[];
  const count=page.count||0;
  const nextOffset=offset+rows.length;
  return {
    exportId,dataset,offset,limit,count,
    rows,
    nextOffset,
    done:nextOffset>=count||rows.length<limit
  };
}

async function privacyExportComplete(
  admin:ReturnType<typeof createClient>,
  userId:string,
  body:AnyRecord
){
  const exportId=validUuid(body.exportId);
  const recordCount=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Number(body.recordCount)||0));
  if(!exportId)throw new Error("privacy_export_id_required");
  const started=await admin.from("tw_privacy_export_events")
    .select("id").eq("user_id",userId).eq("export_id",exportId).eq("event_type","started").maybeSingle();
  if(started.error||!started.data)throw new Error("privacy_export_not_found");
  const completed=await admin.from("tw_privacy_export_events").insert({
    export_id:exportId,user_id:userId,event_type:"completed",format:"json",
    dataset_count:Object.keys(PRIVACY_DATASETS).length,record_count:recordCount,
    safe_detail:{assembled_client_side:true}
  });
  if(completed.error)throw new Error("privacy_export_complete_audit_failed");
  return {exportId,recordCount,completedAt:new Date().toISOString()};
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
      const [hist,legal]=await Promise.all([moneyHistory(admin,user.id),legalStatuses(admin,user.id)]);
      return json(origin,200,{
        ok:true,
        user:{id:user.id,email:user.email||null,emailConfirmedAt:(user as AnyRecord).email_confirmed_at||null},
        session:{id:sessionId,aal},
        closure:{hardDeleteEligible:!hist.hasFinancialHistory,...hist},
        legal
      });
    }
    if(action==="privacy_inventory"){
      return json(origin,200,{ok:true,privacy:await privacyInventory(admin,user.id,user as AnyRecord)});
    }
    if(action==="privacy_export_start"){
      return json(origin,200,{ok:true,...await privacyExportStart(admin,user.id,user as AnyRecord)});
    }
    if(action==="privacy_export_page"){
      return json(origin,200,{ok:true,page:await privacyExportPage(admin,user.id,body)});
    }
    if(action==="privacy_export_complete"){
      return json(origin,200,{ok:true,result:await privacyExportComplete(admin,user.id,body)});
    }
    if(action==="legal_status"){
      return json(origin,200,{ok:true,legal:await legalStatuses(admin,user.id)});
    }
    if(action==="accept_legal"){
      const documentId=validUuid(body.documentId);
      if(!documentId)return json(origin,400,{error:"legal_document_id_required"});
      const accepted=await admin.rpc("tw_legal_accept_document",{
        p_user_id:user.id,
        p_document_id:documentId,
        p_session_id:sessionId,
        p_affirmation:"accept_v1"
      });
      if(accepted.error)throw new Error(safeText(accepted.error.message,120)||"legal_acceptance_failed");
      return json(origin,200,{ok:true,acceptance:accepted.data,legal:await legalStatuses(admin,user.id)});
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
