import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type AnyRecord = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const UNIT_CARD_AUTH_WEBHOOK_SECRET =
  Deno.env.get("UNIT_CARD_AUTH_WEBHOOK_SECRET") ||
  Deno.env.get("UNIT_WEBHOOK_SECRET") || "";
const MONEY_EXECUTION_MODE = Deno.env.get("THISWEEK_MONEY_EXECUTION_MODE") || "disabled";
const LIVE_MONEY_ENABLED = Deno.env.get("THISWEEK_LIVE_MONEY_ENABLED") === "true";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function safeText(value: unknown, max = 200): string {
  return String(value ?? "").normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
    .trim().slice(0, max);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function constantTimeEqual(a: string, b: string): boolean {
  const aa = encoder.encode(a), bb = encoder.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

async function unitSignature(raw: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(UNIT_CARD_AUTH_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-1" }, false, ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, raw));
  return bytesToBase64(sig);
}

function decline(reason: string): Response {
  const allowed = new Set([
    "AccountClosed","CardExceedsAmountLimit","DoNotHonor","InsufficientFunds",
    "InvalidMerchant","ReferToCardIssuer","RestrictedCard","TransactionNotPermittedToCardholder",
  ]);
  const code = allowed.has(reason) ? reason : "DoNotHonor";
  return Response.json({
    data: { type: "declineAuthorizationRequest", attributes: { reason: code } },
  }, { status: 200, headers: { "Cache-Control": "no-store" } });
}

function approve(amount?: number): Response {
  return Response.json({
    data: {
      type: "approveAuthorizationRequest",
      attributes: amount == null ? {} : { amount },
    },
  }, { status: 200, headers: { "Cache-Control": "no-store" } });
}

function relationId(item: AnyRecord, name: string): string {
  const relationships = item.relationships && typeof item.relationships === "object"
    ? item.relationships as AnyRecord : {};
  const rel = relationships[name] && typeof relationships[name] === "object"
    ? relationships[name] as AnyRecord : {};
  const data = rel.data && typeof rel.data === "object" ? rel.data as AnyRecord : {};
  return safeText(data.id, 180);
}

function enabled(): boolean {
  if (MONEY_EXECUTION_MODE === "sandbox") return true;
  return MONEY_EXECUTION_MODE === "production" && LIVE_MONEY_ENABLED;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  if (!SUPABASE_URL || !SERVICE_KEY || !UNIT_CARD_AUTH_WEBHOOK_SECRET) {
    return new Response("not configured", { status: 503 });
  }

  const raw = new Uint8Array(await req.arrayBuffer());
  if (!raw.length || raw.length > 250_000) return decline("DoNotHonor");

  const incoming = req.headers.get("x-unit-signature") || "";
  if (!incoming) return new Response("signature required", { status: 401 });
  const expected = await unitSignature(raw);
  if (!constantTimeEqual(incoming, expected)) return new Response("invalid signature", { status: 401 });

  if (!enabled()) return decline("RestrictedCard");

  let payload: AnyRecord;
  try { payload = JSON.parse(decoder.decode(raw)) as AnyRecord; }
  catch { return decline("DoNotHonor"); }

  const list = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
  const item = list[0] && typeof list[0] === "object" ? list[0] as AnyRecord : null;
  if (!item) return decline("DoNotHonor");

  const attrs = item.attributes && typeof item.attributes === "object" ? item.attributes as AnyRecord : {};
  const requested = Number(attrs.amount);
  if (!Number.isSafeInteger(requested) || requested <= 0) return decline("DoNotHonor");

  const providerCardId = relationId(item, "card");
  const providerAuthorizationId = relationId(item, "authorizationRequest") || safeText(item.id, 180);
  if (!providerCardId || !providerAuthorizationId) return decline("DoNotHonor");

  const merchant = attrs.merchant && typeof attrs.merchant === "object" ? attrs.merchant as AnyRecord : {};
  const partialAllowed = attrs.partialApprovalAllowed === true;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (MONEY_EXECUTION_MODE === "production") {
    const release = await admin.rpc("tw_release_money_enabled");
    if (release.error || release.data !== true) return decline("RestrictedCard");
    const cardOwner = await admin.from("tw_money_virtual_cards")
      .select("user_id").eq("provider","unit").eq("provider_card_id",providerCardId).maybeSingle();
    if (cardOwner.error || !cardOwner.data?.user_id) return decline("RestrictedCard");
    const legal = await admin.rpc("tw_user_production_legal_ready",{p_user_id:cardOwner.data.user_id});
    if (legal.error || legal.data !== true) return decline("RestrictedCard");
  }

  const { data, error } = await admin.rpc("tw_money_risk_reserve_card_authorization", {
    p_environment: MONEY_EXECUTION_MODE === "production" ? "production" : "sandbox",
    p_provider_card_id: providerCardId,
    p_provider_authorization_id: providerAuthorizationId,
    p_amount_cents: requested,
    p_partial_approval_allowed: partialAllowed,
    p_merchant_name: safeText(merchant.name, 160) || null,
    p_merchant_id: safeText(merchant.id, 160) || null,
    p_mcc: safeText(merchant.type, 12) || null,
  });

  if (error || !Array.isArray(data) || !data.length) return decline("DoNotHonor");

  const result = data[0] as AnyRecord;
  const decision = safeText(result.decision, 20);
  const approvedAmount = Number(result.approved_amount_cents || 0);
  const reason = safeText(result.decision_reason, 80);

  if (decision === "approved" && Number.isSafeInteger(approvedAmount) && approvedAmount > 0) {
    if (approvedAmount < requested) {
      if (!partialAllowed) return decline("InsufficientFunds");
      return approve(approvedAmount);
    }
    return approve();
  }

  if (reason === "insufficient_envelope") return decline("InsufficientFunds");
  if (reason === "card_amount_limit") return decline("CardExceedsAmountLimit");
  if (reason === "mcc_not_allowed" || reason === "merchant_not_allowed") {
    return decline("TransactionNotPermittedToCardholder");
  }
  if (reason === "card_not_active") return decline("RestrictedCard");
  if (reason.startsWith("risk_")) return decline("RestrictedCard");
  return decline("DoNotHonor");
});
