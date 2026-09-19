import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type AnyRecord = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const UNIT_WEBHOOK_SECRET = Deno.env.get("UNIT_WEBHOOK_SECRET") || "";
const PINWHEEL_API_SECRET = Deno.env.get("PINWHEEL_API_SECRET") || "";
const METHOD_WEBHOOK_AUTH_TOKEN = Deno.env.get("METHOD_WEBHOOK_AUTH_TOKEN") || "";
const METHOD_WEBHOOK_HMAC_SECRET = Deno.env.get("METHOD_WEBHOOK_HMAC_SECRET") || "";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function safeText(value: unknown, max = 200): string {
  return String(value ?? "").normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
    .trim().slice(0, max);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function constantTimeEqual(a: string, b: string): boolean {
  const aa = encoder.encode(a);
  const bb = encoder.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

async function hmac(secret: string, algorithm: "SHA-1" | "SHA-256", body: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: algorithm }, false, ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, body));
}

async function sha256Hex(body: Uint8Array): Promise<string> {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", body)));
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0); out.set(b, a.length);
  return out;
}

function json(status: number, body: AnyRecord): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function validUuid(value: unknown): string | null {
  const s = safeText(value, 80);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s) ? s : null;
}

function relationId(item: AnyRecord, name: string): string {
  const relationships = item.relationships && typeof item.relationships === "object"
    ? item.relationships as AnyRecord : {};
  const rel = relationships[name] && typeof relationships[name] === "object"
    ? relationships[name] as AnyRecord : {};
  const data = rel.data && typeof rel.data === "object" ? rel.data as AnyRecord : {};
  return safeText(data.id, 180);
}

function relationType(item: AnyRecord, name: string): string {
  const relationships = item.relationships && typeof item.relationships === "object"
    ? item.relationships as AnyRecord : {};
  const rel = relationships[name] && typeof relationships[name] === "object"
    ? relationships[name] as AnyRecord : {};
  const data = rel.data && typeof rel.data === "object" ? rel.data as AnyRecord : {};
  return safeText(data.type, 120);
}

function unitApplicationState(eventType: string, providerStatus: string): { onboarding: string; kyc: string } {
  const e = eventType.toLowerCase();
  const s = providerStatus.toLowerCase();
  if (e === "application.approved" || s === "approved") return { onboarding: "approved", kyc: "verified" };
  if (e === "application.denied" || s === "denied") return { onboarding: "rejected", kyc: "failed" };
  if (e === "application.canceled" || s === "canceled") return { onboarding: "closed", kyc: "failed" };
  if (e === "application.awaitingdocuments" || s === "awaitingdocuments") return { onboarding: "identity_required", kyc: "pending" };
  return { onboarding: "submitted", kyc: "pending" };
}

function unitPaymentState(eventType: string, providerStatus: string): string | null {
  const e = eventType.toLowerCase();
  const s = providerStatus.toLowerCase();
  if (e === "payment.returned" || s === "returned") return "returned";
  if (e === "payment.rejected" || s === "rejected" || s === "failed") return "failed";
  if (e === "payment.canceled" || e === "payment.cancelled" || s === "canceled" || s === "cancelled") return "cancelled";
  if (e === "payment.sent" || s === "sent" || s === "clearing") return "pending";
  if (s === "completed" || s === "settled") return "settled";
  if (e === "payment.created" || s === "pending") return "pending";
  return null;
}

async function resolveUnitUser(admin: ReturnType<typeof createClient>, item: AnyRecord): Promise<string | null> {
  const applicationId = relationId(item, "application");
  if (applicationId) {
    const { data } = await admin.from("tw_money_customers")
      .select("user_id").eq("banking_provider", "unit").eq("provider_application_id", applicationId).maybeSingle();
    if (data?.user_id) return String(data.user_id);
  }
  const cardId = relationId(item, "card");
  if (cardId) {
    const { data } = await admin.from("tw_money_virtual_cards")
      .select("user_id").eq("provider", "unit").eq("provider_card_id", cardId).maybeSingle();
    if (data?.user_id) return String(data.user_id);
  }
  const accountId = relationId(item, "account");
  if (accountId) {
    const { data } = await admin.from("tw_money_deposit_accounts")
      .select("user_id").eq("provider", "unit").eq("provider_account_id", accountId).maybeSingle();
    if (data?.user_id) return String(data.user_id);
  }
  const customerId = relationId(item, "customer");
  if (customerId) {
    const { data } = await admin.from("tw_money_customers")
      .select("user_id").eq("banking_provider", "unit").eq("provider_customer_id", customerId).maybeSingle();
    if (data?.user_id) return String(data.user_id);
  }
  return null;
}

async function recordEvent(
  admin: ReturnType<typeof createClient>,
  provider: string,
  eventId: string,
  eventType: string,
  userId: string | null,
  payloadHash: string,
  summary: AnyRecord,
  requestTimestamp: string | null,
  resourceRef: string | null,
  state = "processed",
) {
  const row = {
    provider,
    provider_event_id: eventId,
    event_type: eventType,
    user_id: userId,
    payload_hash: payloadHash,
    safe_summary: summary,
    state,
    signature_verified: true,
    request_timestamp: requestTimestamp,
    resource_ref: resourceRef,
    processed_at: state === "processed" || state === "ignored" ? new Date().toISOString() : null,
  };
  const { error } = await admin.from("tw_money_provider_events")
    .upsert(row, { onConflict: "provider,provider_event_id", ignoreDuplicates: true });
  if (error) throw new Error("provider_event_store_failed");
}

async function processUnit(
  admin: ReturnType<typeof createClient>,
  payload: AnyRecord,
  payloadHash: string,
) {
  const rawData = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
  for (const raw of rawData) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as AnyRecord;
    const eventId = safeText(item.id, 180);
    const eventType = safeText(item.type, 120);
    if (!eventId || !eventType) continue;
    const attrs = item.attributes && typeof item.attributes === "object" ? item.attributes as AnyRecord : {};
    const userId = await resolveUnitUser(admin, item);
    const authRequestId = relationId(item, "authorizationRequest");
    const amount = Number(attrs.amount || 0);
    const summary: AnyRecord = {
      status: safeText(attrs.status, 60),
      amount_cents: Number.isSafeInteger(amount) ? amount : null,
      card_id: relationId(item, "card") || null,
      account_id: relationId(item, "account") || null,
      authorization_request_id: authRequestId || null,
      application_id: relationId(item, "application") || null,
      customer_id: relationId(item, "customer") || null,
      payment_id: relationId(item, "payment") || null,
      transaction_type: relationType(item, "transaction") || null,
      direction: safeText(attrs.direction, 20) || null,
      decision_source: safeText(attrs.cardDecisionSource, 60) || null,
      decline_reason: safeText(attrs.declineReason, 80) || null,
    };

    let state = "processed";

    const applicationId = relationId(item, "application");
    const customerId = relationId(item, "customer");
    const accountId = relationId(item, "account");
    const paymentId = relationId(item, "payment");
    const transactionType = relationType(item, "transaction");
    const providerStatus = safeText(attrs.status, 80);

    if (userId && applicationId && eventType.startsWith("application.")) {
      const mapped = unitApplicationState(eventType, providerStatus);
      await admin.from("tw_money_customers").update({
        banking_provider: "unit",
        provider_application_id: applicationId,
        provider_application_status: providerStatus || eventType.split(".")[1] || null,
        provider_customer_id: customerId || undefined,
        onboarding_state: mapped.onboarding,
        kyc_state: mapped.kyc,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    }

    if (userId && eventType === "customer.created" && customerId) {
      await admin.from("tw_money_customers").update({
        banking_provider: "unit",
        provider_customer_id: customerId,
        provider_application_id: applicationId || undefined,
        provider_application_status: "Approved",
        onboarding_state: "approved",
        kyc_state: "verified",
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    }

    if (userId && eventType === "account.created" && accountId) {
      const accountNumber = safeText(attrs.accountNumber, 40);
      const routingNumber = safeText(attrs.routingNumber, 20);
      await admin.from("tw_money_deposit_accounts").update({
        status: "open",
        account_last4: accountNumber ? accountNumber.slice(-4) : undefined,
        routing_last4: routingNumber ? routingNumber.slice(-4) : undefined,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId).eq("provider", "unit").eq("provider_account_id", accountId);
    }

    if (userId && paymentId && eventType.startsWith("payment.")) {
      const next = unitPaymentState(eventType, providerStatus);
      if (next) {
        await admin.from("tw_money_transfers").update({
          state: next,
          provider_status: providerStatus || eventType,
          updated_at: new Date().toISOString(),
          settled_at: next === "settled" ? new Date().toISOString() : null,
          failure_code: next === "failed" || next === "returned"
            ? (safeText(attrs.reason, 100) || next)
            : null,
        }).eq("user_id", userId).eq("provider", "unit").eq("provider_transfer_id", paymentId);
      }
    }

    if (
      userId &&
      eventType === "transaction.created" &&
      !authRequestId &&
      Number.isSafeInteger(amount) &&
      amount > 0 &&
      safeText(attrs.direction, 20).toLowerCase() === "credit" &&
      /ach.*transaction/i.test(transactionType)
    ) {
      const { data: ledgerAccounts } = await admin.from("tw_money_ledger_accounts")
        .select("id,account_code").eq("user_id", userId)
        .in("account_code", ["cash:unallocated", "external:offset"]);
      const byCode = new Map((ledgerAccounts || []).map((a) => [a.account_code, a.id]));
      const cash = byCode.get("cash:unallocated");
      const offset = byCode.get("external:offset");
      if (cash && offset) {
        const posted = await admin.rpc("tw_money_post_journal", {
          p_user_id: userId,
          p_event_type: "unit_ach_credit_settlement",
          p_idempotency_key: "unit:cashcredit:" + eventId,
          p_currency: "USD",
          p_entries: [
            { ledger_account_id: cash, amount_cents: amount },
            { ledger_account_id: offset, amount_cents: -amount },
          ],
          p_provider: "unit",
          p_provider_event_id: eventId,
          p_metadata: {
            unit_account_id: accountId || null,
            unit_payment_id: paymentId || null,
            unit_transaction_type: transactionType || null,
          },
        });
        if (posted.error) state = "failed";
      } else {
        state = "failed";
      }

      if (paymentId) {
        await admin.from("tw_money_transfers").update({
          state: "settled",
          provider_status: "Settled",
          settled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId).eq("provider", "unit").eq("provider_transfer_id", paymentId);
      }
    }

    if (userId && authRequestId && (
      eventType === "authorizationRequest.declined" ||
      eventType === "authorization.declined" ||
      eventType === "authorization.canceled"
    )) {
      const release = await admin.rpc("tw_money_release_card_authorization", {
        p_provider_authorization_id: authRequestId,
        p_reason: eventType + ":" + (safeText(attrs.declineReason, 80) || "provider_reversal"),
      });
      if (release.error && !String(release.error.message || "").includes("not_releasable")) {
        state = "failed";
      }
    }

    if (userId && authRequestId && eventType === "transaction.created" && Number.isSafeInteger(amount) && amount >= 0) {
      const settle = await admin.rpc("tw_money_settle_card_authorization", {
        p_provider_authorization_id: authRequestId,
        p_provider_transaction_id: eventId,
        p_settled_amount_cents: amount,
      });
      if (settle.error && !String(settle.error.message || "").includes("not_settleable")) {
        state = "failed";
      }
    }

    if (userId && authRequestId && (eventType === "authorization.created" || eventType === "authorizationRequest.approved")) {
      await admin.from("tw_money_card_authorizations").update({
        card_decision_source: safeText(attrs.cardDecisionSource, 60) || null,
      }).eq("user_id", userId).eq("provider", "unit").eq("provider_authorization_id", authRequestId);
    }

    await recordEvent(
      admin, "unit", eventId, eventType, userId, payloadHash, summary,
      null, authRequestId || eventId, state,
    );
  }
}

async function processPinwheel(
  admin: ReturnType<typeof createClient>,
  payload: AnyRecord,
  payloadHash: string,
  timestamp: string,
) {
  const eventType = safeText(payload.event, 120);
  const eventId = safeText(payload.event_id, 180);
  const detail = payload.payload && typeof payload.payload === "object" ? payload.payload as AnyRecord : {};
  const userId = validUuid(detail.end_user_id);
  if (!eventType || !eventId) throw new Error("pinwheel_event_invalid");

  const outcome = safeText(detail.outcome, 60).toLowerCase();
  const linkTokenId = safeText(detail.link_token_id, 180);
  const summary: AnyRecord = {
    outcome: outcome || null,
    link_token_id: linkTokenId || null,
    account_id: safeText(detail.account_id, 180) || null,
    platform_id: safeText(detail.platform_id, 180) || null,
    platform_name: safeText(detail.platform_name, 120) || null,
  };

  if (eventType === "direct_deposit_switch.added" && userId && linkTokenId) {
    const nextState = outcome === "success" ? "confirmed" : outcome === "error" ? "failed" : "in_progress";
    await admin.from("tw_money_direct_deposit_switches").update({
      state: nextState,
      provider_job_id: safeText(detail.id, 180) || safeText(detail.account_id, 180) || null,
      failure_code: outcome === "error" ? (safeText(detail.error_code, 100) || "provider_error") : null,
      confirmed_at: outcome === "success" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId).eq("provider", "pinwheel").eq("provider_link_id", linkTokenId);
  }

  await recordEvent(
    admin, "pinwheel", eventId, eventType, userId, payloadHash, summary,
    new Date(Number(timestamp) * 1000).toISOString(), linkTokenId || eventId, "processed",
  );
}

function mapMethodPaymentState(status: string): string | null {
  const s = status.toLowerCase();
  if (["completed", "paid", "settled"].includes(s)) return "paid";
  if (["pending", "processing", "in_progress"].includes(s)) return "processing";
  if (["failed", "error"].includes(s)) return "failed";
  if (["returned", "return"].includes(s)) return "returned";
  if (["canceled", "cancelled"].includes(s)) return "cancelled";
  if (["reversed"].includes(s)) return "reversed";
  return null;
}

async function processMethod(
  admin: ReturnType<typeof createClient>,
  payload: AnyRecord,
  payloadHash: string,
  timestamp: string,
) {
  const eventId = safeText(payload.event, 180) || safeText(payload.id, 180);
  const eventType = safeText(payload.type, 120);
  const resourceId = safeText(payload.id, 180);
  if (!eventId || !eventType) throw new Error("method_event_invalid");

  let userId: string | null = null;
  if (resourceId && eventType.startsWith("payment.")) {
    const { data: payment } = await admin.from("tw_money_bill_payments")
      .select("user_id,state").eq("provider", "method").eq("provider_payment_id", resourceId).maybeSingle();
    if (payment?.user_id) userId = String(payment.user_id);

    const expanded = payload.data && typeof payload.data === "object" ? payload.data as AnyRecord
      : payload.payment && typeof payload.payment === "object" ? payload.payment as AnyRecord : payload;
    const providerStatus = safeText(expanded.status, 60);
    const next = providerStatus ? mapMethodPaymentState(providerStatus) : null;
    if (userId && next) {
      await admin.from("tw_money_bill_payments").update({
        state: next,
        updated_at: new Date().toISOString(),
        paid_at: next === "paid" ? new Date().toISOString() : null,
        failure_code: next === "failed" || next === "returned" ? safeText((expanded.error as AnyRecord)?.code, 100) || next : null,
      }).eq("user_id", userId).eq("provider", "method").eq("provider_payment_id", resourceId);
    }
  }

  await recordEvent(
    admin, "method", eventId, eventType, userId, payloadHash,
    { resource_id: resourceId || null, path: safeText(payload.path, 300) || null },
    new Date(Number(timestamp) * 1000).toISOString(), resourceId || eventId, "processed",
  );
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!SUPABASE_URL || !SERVICE_KEY) return json(503, { error: "backend_not_configured" });

  const raw = new Uint8Array(await req.arrayBuffer());
  if (!raw.length || raw.length > 1_000_000) return json(400, { error: "invalid_payload_size" });
  const payloadHash = await sha256Hex(raw);

  const unitSig = req.headers.get("x-unit-signature") || "";
  const pinwheelSig = req.headers.get("x-pinwheel-signature") || "";
  const methodSig = req.headers.get("method-webhook-signature") || "";

  let provider = "";
  let timestamp = "";
  let verified = false;

  if (unitSig) {
    provider = "unit";
    if (!UNIT_WEBHOOK_SECRET) return json(503, { error: "unit_webhook_secret_missing" });
    const expected = bytesToBase64(await hmac(UNIT_WEBHOOK_SECRET, "SHA-1", raw));
    verified = constantTimeEqual(unitSig, expected);
  } else if (pinwheelSig) {
    provider = "pinwheel";
    timestamp = req.headers.get("x-timestamp") || "";
    if (!PINWHEEL_API_SECRET || !timestamp || !pinwheelSig.startsWith("v2=")) {
      return json(401, { error: "pinwheel_signature_headers_invalid" });
    }
    const msg = concatBytes(encoder.encode("v2:" + timestamp + ":"), raw);
    const expected = "v2=" + bytesToHex(await hmac(PINWHEEL_API_SECRET, "SHA-256", msg));
    verified = constantTimeEqual(pinwheelSig, expected);
  } else if (methodSig) {
    provider = "method";
    timestamp = req.headers.get("method-webhook-timestamp") || "";
    const incomingAuth = req.headers.get("authorization") || "";
    if (!METHOD_WEBHOOK_AUTH_TOKEN || !METHOD_WEBHOOK_HMAC_SECRET || !timestamp) {
      return json(503, { error: "method_webhook_secret_missing" });
    }
    const expectedAuth = btoa(METHOD_WEBHOOK_AUTH_TOKEN);
    if (!constantTimeEqual(incomingAuth, expectedAuth)) return json(401, { error: "method_auth_invalid" });
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
      return json(400, { error: "method_timestamp_expired" });
    }
    const msg = concatBytes(encoder.encode(timestamp + ":"), raw);
    const expected = bytesToHex(await hmac(METHOD_WEBHOOK_HMAC_SECRET, "SHA-256", msg));
    verified = constantTimeEqual(methodSig, expected);
  } else {
    return json(401, { error: "provider_signature_required" });
  }

  if (!verified) return json(401, { error: "invalid_signature" });

  let payload: AnyRecord;
  try {
    payload = JSON.parse(decoder.decode(raw)) as AnyRecord;
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (provider === "unit") await processUnit(admin, payload, payloadHash);
    else if (provider === "pinwheel") await processPinwheel(admin, payload, payloadHash, timestamp);
    else if (provider === "method") await processMethod(admin, payload, payloadHash, timestamp);
    return json(200, { received: true });
  } catch (error) {
    return json(500, { error: safeText((error as Error)?.message || "webhook_processing_failed", 120) });
  }
});
