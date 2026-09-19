import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type AnyRecord = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const UNIT_API_TOKEN = Deno.env.get("UNIT_API_TOKEN") || "";
const UNIT_BASE_URL = (Deno.env.get("UNIT_BASE_URL") || "https://api.s.unit.sh").replace(/\/$/, "");
const PINWHEEL_API_SECRET = Deno.env.get("PINWHEEL_API_SECRET") || "";
const PINWHEEL_BASE_URL = (Deno.env.get("PINWHEEL_BASE_URL") || "https://api.getpinwheel.com").replace(/\/$/, "");
const METHOD_API_KEY = Deno.env.get("METHOD_API_KEY") || "";
const METHOD_BASE_URL = (Deno.env.get("METHOD_BASE_URL") || "https://dev.methodfi.com").replace(/\/$/, "");
const METHOD_VERSION = Deno.env.get("METHOD_VERSION") || "2025-12-01";
const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID") || "";
const PLAID_SECRET = Deno.env.get("PLAID_SECRET") || "";
const PLAID_BASE_URL = (Deno.env.get("PLAID_BASE_URL") || "https://sandbox.plaid.com").replace(/\/$/, "");

const MONEY_EXECUTION_MODE = Deno.env.get("THISWEEK_MONEY_EXECUTION_MODE") || "disabled";
const LIVE_MONEY_ENABLED = Deno.env.get("THISWEEK_LIVE_MONEY_ENABLED") === "true";
const ALLOWED_ORIGINS = (Deno.env.get("THISWEEK_ALLOWED_ORIGINS") || "https://bennybundles.github.io")
  .split(",").map((v) => v.trim()).filter(Boolean);

const DEFAULT_ENVELOPES = Object.freeze([
  { envelope_key: "bills", label: "Bills", envelope_type: "bills" },
  { envelope_key: "essentials", label: "Essentials", envelope_type: "essentials" },
  { envelope_key: "lifestyle", label: "Lifestyle", envelope_type: "lifestyle" },
  { envelope_key: "savings", label: "Savings", envelope_type: "savings" },
]);

function safeText(value: unknown, max = 200): string {
  return String(value ?? "").normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
    .trim().slice(0, max);
}

function moneyInt(value: unknown, min = 1, max = 100_000_000): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new Error("invalid_amount");
  return n;
}

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || "");
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

function json(origin: string | null, status: number, body: AnyRecord): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function providerFlags() {
  return {
    unit: !!UNIT_API_TOKEN,
    pinwheel: !!PINWHEEL_API_SECRET,
    method: !!METHOD_API_KEY,
    plaid: !!PLAID_CLIENT_ID && !!PLAID_SECRET,
  };
}

function canExecuteProvider(name: "unit" | "pinwheel" | "method" | "plaid"): boolean {
  const flags = providerFlags();
  if (!flags[name]) return false;
  if (MONEY_EXECUTION_MODE === "sandbox") return true;
  if (MONEY_EXECUTION_MODE === "production") return LIVE_MONEY_ENABLED;
  return false;
}

async function parseResponse(res: Response): Promise<AnyRecord> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = safeText(
      (body as AnyRecord)?.message ||
      (body as AnyRecord)?.error ||
      (body as AnyRecord)?.detail ||
      "provider_request_failed",
      120,
    );
    throw new Error(message || "provider_request_failed");
  }
  return body as AnyRecord;
}


async function plaidPost(path: string, payload: AnyRecord): Promise<AnyRecord> {
  if (!canExecuteProvider("plaid")) throw new Error("plaid_not_configured");
  const res = await fetch(PLAID_BASE_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

async function vaultRead(admin: ReturnType<typeof createClient>, id: string): Promise<string> {
  const { data, error } = await admin.rpc("tw_vault_read", { p_secret_id: id });
  if (error || !data) throw new Error("provider_token_missing");
  return String(data);
}

function relationshipId(resource: AnyRecord, name: string): string {
  const relationships = resource.relationships && typeof resource.relationships === "object"
    ? resource.relationships as AnyRecord : {};
  const rel = relationships[name] && typeof relationships[name] === "object"
    ? relationships[name] as AnyRecord : {};
  const data = rel.data && typeof rel.data === "object" ? rel.data as AnyRecord : {};
  return safeText(data.id, 180);
}

function unitStatusToOnboarding(status: string): string {
  const s = status.toLowerCase();
  if (s === "approved") return "approved";
  if (s === "denied") return "rejected";
  if (s === "canceled" || s === "cancelled") return "closed";
  if (s === "pendingreview" || s === "pending") return "submitted";
  if (s === "awaitingdocuments") return "identity_required";
  return "submitted";
}

async function syntheticSandboxSsn(userId: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId)));
  let digits = "7";
  for (let i = 0; i < 8; i++) digits += String(digest[i] % 10);
  return digits;
}

async function createUnitSandboxApplication(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  if (MONEY_EXECUTION_MODE !== "sandbox") throw new Error("sandbox_action_disabled");
  if (!canExecuteProvider("unit")) throw new Error("unit_not_configured");

  await bootstrapMoney(admin, userId);
  const { data: existing } = await admin.from("tw_money_customers")
    .select("id,provider_application_id,provider_customer_id,onboarding_state,provider_application_status")
    .eq("user_id", userId).maybeSingle();
  if (existing?.provider_application_id) {
    return {
      moneyCustomerId: existing.id,
      applicationId: existing.provider_application_id,
      customerId: existing.provider_customer_id,
      onboardingState: existing.onboarding_state,
      providerStatus: existing.provider_application_status,
      reused: true,
    };
  }

  const compact = userId.replace(/-/g, "");
  const ssn = await syntheticSandboxSsn(userId);
  const phoneTail = compact.slice(-7).replace(/[a-f]/gi, (c) => String((c.toLowerCase().charCodeAt(0) - 87) % 10));
  const providerEmail = "sandbox+" + compact.slice(0, 12) + "@example.com";

  const unit = await unitRequest("/applications", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "individualApplication",
        attributes: {
          ssn,
          fullName: { first: "Thisweek", last: "Sandbox" },
          dateOfBirth: "2001-08-10",
          address: {
            street: "20 Ingram St",
            city: "Forest Hills",
            state: "NY",
            postalCode: "11375",
            country: "US",
          },
          email: providerEmail,
          phone: { countryCode: "1", number: "555" + phoneTail.padStart(7, "0").slice(-7) },
          occupation: "ArchitectOrEngineer",
          annualIncome: "Between50kAnd100k",
          sourceOfIncome: "EmploymentOrPayrollIncome",
          tags: { thisweekUserId: userId, environment: "sandbox" },
          idempotencyKey: "tw-unit-app-" + userId,
        },
      },
    }),
  });

  const data = unit.data && typeof unit.data === "object" ? unit.data as AnyRecord : {};
  const attrs = data.attributes && typeof data.attributes === "object" ? data.attributes as AnyRecord : {};
  const applicationId = safeText(data.id, 180);
  const providerStatus = safeText(attrs.status, 80) || "Submitted";
  const customerId = relationshipId(data, "customer") || null;
  if (!applicationId) throw new Error("unit_application_invalid");

  const update = await admin.from("tw_money_customers").update({
    banking_provider: "unit",
    provider_application_id: applicationId,
    provider_application_status: providerStatus,
    provider_customer_id: customerId,
    onboarding_state: unitStatusToOnboarding(providerStatus),
    kyc_state: providerStatus.toLowerCase() === "approved" ? "verified" : "pending",
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId)
    .select("id,provider_application_id,provider_customer_id,onboarding_state,provider_application_status")
    .single();
  if (update.error || !update.data) throw new Error("unit_application_store_failed");

  return {
    moneyCustomerId: update.data.id,
    applicationId,
    customerId,
    onboardingState: update.data.onboarding_state,
    providerStatus,
    reused: false,
  };
}

async function refreshUnitApplication(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  if (!canExecuteProvider("unit")) throw new Error("unit_not_configured");
  const { data: row } = await admin.from("tw_money_customers")
    .select("id,provider_application_id").eq("user_id", userId).maybeSingle();
  if (!row?.provider_application_id) throw new Error("unit_application_not_found");

  const unit = await unitRequest("/applications/" + encodeURIComponent(row.provider_application_id));
  const data = unit.data && typeof unit.data === "object" ? unit.data as AnyRecord : {};
  const attrs = data.attributes && typeof data.attributes === "object" ? data.attributes as AnyRecord : {};
  const status = safeText(attrs.status, 80) || "Submitted";
  const customerId = relationshipId(data, "customer") || null;

  const update = await admin.from("tw_money_customers").update({
    banking_provider: "unit",
    provider_application_status: status,
    provider_customer_id: customerId,
    onboarding_state: unitStatusToOnboarding(status),
    kyc_state: status.toLowerCase() === "approved" ? "verified" : status.toLowerCase() === "denied" ? "failed" : "pending",
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId)
    .select("id,provider_application_id,provider_customer_id,onboarding_state,provider_application_status,kyc_state")
    .single();
  if (update.error || !update.data) throw new Error("unit_application_refresh_failed");
  return update.data;
}

async function createUnitDepositAccount(
  admin: ReturnType<typeof createClient>,
  userId: string,
  requestId: string,
) {
  if (!canExecuteProvider("unit")) throw new Error("unit_not_configured");
  const { data: customer } = await admin.from("tw_money_customers")
    .select("id,provider_customer_id,onboarding_state")
    .eq("user_id", userId).maybeSingle();
  if (!customer?.provider_customer_id || customer.onboarding_state !== "approved") throw new Error("unit_customer_not_ready");

  const { data: existing } = await admin.from("tw_money_deposit_accounts")
    .select("*").eq("user_id", userId).eq("provider", "unit").neq("status", "closed").maybeSingle();
  if (existing) return { account: existing, reused: true };

  const unit = await unitRequest("/accounts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "depositAccount",
        attributes: {
          depositProduct: "checking",
          tags: { purpose: "This Week Cash", thisweekUserId: userId },
          idempotencyKey: requestId,
        },
        relationships: {
          customer: { data: { type: "individualCustomer", id: customer.provider_customer_id } },
        },
      },
    }),
  });
  const data = unit.data && typeof unit.data === "object" ? unit.data as AnyRecord : {};
  const attrs = data.attributes && typeof data.attributes === "object" ? data.attributes as AnyRecord : {};
  const providerAccountId = safeText(data.id, 180);
  if (!providerAccountId) throw new Error("unit_deposit_account_invalid");

  const inserted = await admin.from("tw_money_deposit_accounts").insert({
    user_id: userId,
    money_customer_id: customer.id,
    provider: "unit",
    provider_account_id: providerAccountId,
    account_kind: "checking",
    status: "open",
    currency: "USD",
    routing_last4: safeText(attrs.routingNumber, 20).slice(-4) || null,
    account_last4: safeText(attrs.accountNumber, 40).slice(-4) || null,
    capabilities: {
      ach: true,
      direct_deposit: true,
      virtual_debit_card: true,
      sandbox: MONEY_EXECUTION_MODE === "sandbox",
    },
    opened_at: new Date().toISOString(),
  }).select("id,provider,provider_account_id,account_kind,status,currency,routing_last4,account_last4,capabilities")
    .single();
  if (inserted.error || !inserted.data) throw new Error("unit_deposit_account_store_failed");
  return { account: inserted.data, reused: false };
}

async function sandboxFundUnitAccount(
  admin: ReturnType<typeof createClient>,
  userId: string,
  depositAccountId: string,
  amountCents: number,
) {
  if (MONEY_EXECUTION_MODE !== "sandbox") throw new Error("sandbox_action_disabled");
  if (!canExecuteProvider("unit")) throw new Error("unit_not_configured");
  const { data: account } = await admin.from("tw_money_deposit_accounts")
    .select("id,provider,provider_account_id,status")
    .eq("id", depositAccountId).eq("user_id", userId).maybeSingle();
  if (!account || account.provider !== "unit" || account.status !== "open") throw new Error("deposit_account_not_ready");

  const result = await unitRequest("/sandbox/payments", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "achPayment",
        attributes: {
          amount: amountCents,
          direction: "Credit",
          description: "TWSandbox",
        },
        relationships: {
          account: { data: { type: "depositAccount", id: account.provider_account_id } },
        },
      },
    }),
  });
  const data = result.data && typeof result.data === "object" ? result.data as AnyRecord : {};
  return {
    providerPaymentId: safeText(data.id, 180) || null,
    providerStatus: safeText((data.attributes as AnyRecord)?.status, 80) || null,
    amountCents,
  };
}

async function createUnitFundingAccountFromPlaid(
  admin: ReturnType<typeof createClient>,
  userId: string,
  providerAccountRowId: string,
  requestId: string,
) {
  if (!canExecuteProvider("unit") || !canExecuteProvider("plaid")) {
    throw new Error("plaid_unit_not_configured");
  }

  const { data: providerAccount } = await admin.from("tw_provider_accounts")
    .select("id,connection_id,provider_account_id,display_name,subtype,mask")
    .eq("id", providerAccountRowId).eq("user_id", userId).maybeSingle();
  if (!providerAccount) throw new Error("provider_account_not_found");

  const { data: connection } = await admin.from("tw_provider_connections")
    .select("id,vault_secret_id,status")
    .eq("id", providerAccount.connection_id).eq("user_id", userId).maybeSingle();
  if (!connection || connection.status !== "active" || !connection.vault_secret_id) {
    throw new Error("provider_connection_not_ready");
  }

  const { data: moneyCustomer } = await admin.from("tw_money_customers")
    .select("provider_customer_id,onboarding_state")
    .eq("user_id", userId).maybeSingle();
  if (!moneyCustomer?.provider_customer_id || moneyCustomer.onboarding_state !== "approved") {
    throw new Error("unit_customer_not_ready");
  }

  const { data: existing } = await admin.from("tw_money_funding_accounts")
    .select("*").eq("user_id", userId)
    .eq("provider_account_row_id", providerAccountRowId)
    .eq("processor_provider", "unit").maybeSingle();
  if (existing) return { fundingAccount: existing, reused: true };

  const accessToken = await vaultRead(admin, connection.vault_secret_id);
  const processor = await plaidPost("/processor/token/create", {
    access_token: accessToken,
    account_id: providerAccount.provider_account_id,
    processor: "unit",
  });
  const processorToken = safeText(processor.processor_token, 900);
  if (!processorToken) throw new Error("plaid_processor_token_invalid");

  const unitCustomer = await unitRequest("/customers/" + encodeURIComponent(moneyCustomer.provider_customer_id));
  const customerData = unitCustomer.data && typeof unitCustomer.data === "object" ? unitCustomer.data as AnyRecord : {};
  const customerAttrs = customerData.attributes && typeof customerData.attributes === "object"
    ? customerData.attributes as AnyRecord : {};
  const fullName = customerAttrs.fullName && typeof customerAttrs.fullName === "object"
    ? customerAttrs.fullName as AnyRecord : {};
  const counterpartyName = safeText(
    [safeText(fullName.first, 60), safeText(fullName.last, 60)].filter(Boolean).join(" ") || "Thisweek Sandbox",
    50,
  );

  const linked = await unitRequest("/counterparties", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "achCounterparty",
        attributes: {
          name: counterpartyName,
          plaidProcessorToken: processorToken,
          type: "Person",
          permissions: "CreditAndDebit",
          verifyName: MONEY_EXECUTION_MODE === "production",
          tags: { thisweekUserId: userId, providerAccountRowId },
          idempotencyKey: requestId,
        },
        relationships: {
          customer: { data: { type: "individualCustomer", id: moneyCustomer.provider_customer_id } },
        },
      },
    }),
  });
  const linkedData = linked.data && typeof linked.data === "object" ? linked.data as AnyRecord : {};
  const linkedAttrs = linkedData.attributes && typeof linkedData.attributes === "object"
    ? linkedData.attributes as AnyRecord : {};
  const counterpartyId = safeText(linkedData.id, 180);
  if (!counterpartyId) throw new Error("unit_counterparty_invalid");

  const row = {
    user_id: userId,
    provider_connection_id: providerAccount.connection_id,
    provider_account_row_id: providerAccount.id,
    verification_provider: "plaid",
    processor_provider: "unit",
    processor_reference: counterpartyId,
    account_kind: safeText(providerAccount.subtype, 40).toLowerCase() === "savings" ? "savings" : "checking",
    account_last4: safeText(providerAccount.mask, 8).slice(-4) || null,
    status: "verified",
    supported_rails: ["ach_debit", "ach_credit"],
    provider_link_kind: "unit_counterparty",
    provider_status: safeText(linkedAttrs.status, 80) || "Approved",
    updated_at: new Date().toISOString(),
  };
  const upsert = await admin.from("tw_money_funding_accounts")
    .upsert(row, { onConflict: "user_id,provider_account_row_id,processor_provider" })
    .select("id,status,verification_provider,processor_provider,processor_reference,account_kind,account_last4,supported_rails,provider_status")
    .single();
  if (upsert.error || !upsert.data) throw new Error("funding_account_store_failed");
  return { fundingAccount: upsert.data, reused: false };
}

async function fundUnitFromExternal(
  admin: ReturnType<typeof createClient>,
  userId: string,
  body: AnyRecord,
) {
  if (!canExecuteProvider("unit")) throw new Error("unit_not_configured");
  const fundingAccountId = safeText(body.fundingAccountId, 80);
  const depositAccountId = safeText(body.depositAccountId, 80);
  const requestId = safeText(body.clientRequestId, 120);
  const termsVersion = safeText(body.termsVersion, 80);
  const consentTextHash = safeText(body.consentTextHash, 180);
  const amount = moneyInt(body.amountCents, 1, 2_500_000);
  if (!fundingAccountId || !depositAccountId || !requestId || !termsVersion || !consentTextHash) {
    throw new Error("funding_request_incomplete");
  }

  const [funding, deposit] = await Promise.all([
    admin.from("tw_money_funding_accounts")
      .select("id,status,processor_provider,processor_reference")
      .eq("id", fundingAccountId).eq("user_id", userId).maybeSingle(),
    admin.from("tw_money_deposit_accounts")
      .select("id,provider,provider_account_id,status")
      .eq("id", depositAccountId).eq("user_id", userId).maybeSingle(),
  ]);
  if (!funding.data || funding.data.status !== "verified" || funding.data.processor_provider !== "unit" || !funding.data.processor_reference) {
    throw new Error("funding_account_not_verified");
  }
  if (!deposit.data || deposit.data.provider !== "unit" || deposit.data.status !== "open") {
    throw new Error("deposit_account_not_ready");
  }

  const auth = await admin.from("tw_money_authorizations").insert({
    user_id: userId,
    authorization_kind: "ach_debit",
    terms_version: termsVersion,
    consent_text_hash: consentTextHash,
    provider: "unit",
  }).select("id,accepted_at").single();
  if (auth.error || !auth.data) throw new Error("funding_authorization_store_failed");

  const result = await unitRequest("/payments", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "achPayment",
        attributes: {
          amount,
          direction: "Debit",
          description: "TWFUND",
          verifyCounterpartyBalance: MONEY_EXECUTION_MODE === "production",
          idempotencyKey: requestId,
          tags: { thisweekUserId: userId, thisweekTransferKey: requestId },
        },
        relationships: {
          account: { data: { type: "account", id: deposit.data.provider_account_id } },
          counterparty: { data: { type: "counterparty", id: funding.data.processor_reference } },
        },
      },
    }),
  });
  const data = result.data && typeof result.data === "object" ? result.data as AnyRecord : {};
  const attrs = data.attributes && typeof data.attributes === "object" ? data.attributes as AnyRecord : {};
  const providerPaymentId = safeText(data.id, 180);
  if (!providerPaymentId) throw new Error("unit_funding_payment_invalid");

  const transfer = await admin.from("tw_money_transfers").insert({
    user_id: userId,
    transfer_type: "funding_in",
    rail: "ach",
    source_kind: "external_funding_account",
    source_ref: funding.data.id,
    destination_kind: "unit_deposit_account",
    destination_ref: deposit.data.id,
    amount_cents: amount,
    currency: "USD",
    state: "submitted",
    authorization_id: auth.data.id,
    provider: "unit",
    provider_transfer_id: providerPaymentId,
    provider_status: safeText(attrs.status, 80) || "Pending",
    provider_account_id: deposit.data.provider_account_id,
    idempotency_key: requestId,
  }).select("id,state,provider_transfer_id,provider_status,amount_cents,created_at").single();
  if (transfer.error || !transfer.data) throw new Error("funding_transfer_store_failed");
  return transfer.data;
}

async function simulateUnitAuthorization(
  admin: ReturnType<typeof createClient>,
  userId: string,
  body: AnyRecord,
) {
  if (MONEY_EXECUTION_MODE !== "sandbox") throw new Error("sandbox_action_disabled");
  if (!canExecuteProvider("unit")) throw new Error("unit_not_configured");
  const cardId = safeText(body.cardId, 80);
  const amount = moneyInt(body.amountCents, 1, 5_000_000);
  const merchantName = safeText(body.merchantName, 80) || "This Week Test";
  const merchantType = Math.max(1, Math.min(9999, Number(body.merchantType) || 5411));
  const { data: card } = await admin.from("tw_money_virtual_cards")
    .select("id,provider,provider_card_id,status").eq("id", cardId).eq("user_id", userId).maybeSingle();
  if (!card || card.provider !== "unit" || card.status !== "active" || !card.provider_card_id) {
    throw new Error("card_not_ready");
  }

  const result = await unitRequest("/sandbox/authorization-requests/purchase", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "purchaseAuthorizationRequest",
        attributes: {
          amount,
          merchantName,
          merchantType,
          merchantLocation: "Sandbox",
          recurring: false,
          ecommerce: true,
          cardPresent: false,
        },
        relationships: {
          card: { data: { type: "card", id: card.provider_card_id } },
        },
      },
    }),
  });
  const data = result.data && typeof result.data === "object" ? result.data as AnyRecord : {};
  const attrs = data.attributes && typeof data.attributes === "object" ? data.attributes as AnyRecord : {};
  return {
    authorizationRequestId: safeText(data.id, 180) || null,
    status: safeText(attrs.status, 80) || null,
    amountCents: Number(attrs.amount || amount),
    partialApprovalAllowed: attrs.partialApprovalAllowed === true,
  };
}

async function unitRequest(path: string, init: RequestInit = {}): Promise<AnyRecord> {
  if (!canExecuteProvider("unit")) throw new Error("unit_not_configured");
  const res = await fetch(UNIT_BASE_URL + path, {
    ...init,
    headers: {
      "Authorization": "Bearer " + UNIT_API_TOKEN,
      "Accept": "application/vnd.api+json",
      ...(init.body ? { "Content-Type": "application/vnd.api+json" } : {}),
      ...(init.headers || {}),
    },
  });
  return parseResponse(res);
}

async function pinwheelLinkToken(payload: AnyRecord): Promise<AnyRecord> {
  if (!canExecuteProvider("pinwheel")) throw new Error("pinwheel_not_configured");
  const res = await fetch(PINWHEEL_BASE_URL + "/v1/link_tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Pinwheel-Version": "2025-07-08",
      "X-API-SECRET": PINWHEEL_API_SECRET,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

async function methodPayment(payload: AnyRecord, idempotencyKey: string): Promise<AnyRecord> {
  if (!canExecuteProvider("method")) throw new Error("method_not_configured");
  const res = await fetch(METHOD_BASE_URL + "/payments", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + METHOD_API_KEY,
      "Method-Version": METHOD_VERSION,
      "Idempotency-Key": idempotencyKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

async function bootstrapMoney(admin: ReturnType<typeof createClient>, userId: string) {
  let { data: customer, error: customerReadError } = await admin
    .from("tw_money_customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (customerReadError) throw new Error("money_customer_read_failed");
  if (!customer) {
    const inserted = await admin.from("tw_money_customers")
      .insert({ user_id: userId })
      .select("*").single();
    if (inserted.error || !inserted.data) throw new Error("money_customer_create_failed");
    customer = inserted.data;
  }

  const envelopeRows = DEFAULT_ENVELOPES.map((e) => ({ ...e, user_id: userId }));
  const envUpsert = await admin.from("tw_money_envelopes")
    .upsert(envelopeRows, { onConflict: "user_id,envelope_key" })
    .select("id,envelope_key,label,envelope_type,status");
  if (envUpsert.error) throw new Error("money_envelope_bootstrap_failed");

  const envByKey = new Map((envUpsert.data || []).map((e: AnyRecord) => [String(e.envelope_key), e]));
  const accountRows: AnyRecord[] = [
    { user_id: userId, account_code: "cash:unallocated", account_kind: "cash_asset", currency: "USD" },
    { user_id: userId, account_code: "external:offset", account_kind: "external_offset", currency: "USD" },
    { user_id: userId, account_code: "hold:card", account_kind: "card_hold", currency: "USD" },
    { user_id: userId, account_code: "hold:bill", account_kind: "bill_hold", currency: "USD" },
    { user_id: userId, account_code: "clearing:transfer", account_kind: "transfer_clearing", currency: "USD" },
    { user_id: userId, account_code: "expense:reward", account_kind: "reward_expense", currency: "USD" },
    { user_id: userId, account_code: "payable:reward", account_kind: "reward_payable", currency: "USD" },
  ];
  for (const key of ["bills", "essentials", "lifestyle", "savings"]) {
    const env = envByKey.get(key) as AnyRecord | undefined;
    if (!env?.id) throw new Error("money_envelope_missing");
    accountRows.push({
      user_id: userId,
      account_code: "envelope:" + key,
      account_kind: "envelope_available",
      currency: "USD",
      envelope_id: env.id,
    });
  }

  const ledgerUpsert = await admin.from("tw_money_ledger_accounts")
    .upsert(accountRows, { onConflict: "user_id,account_code" })
    .select("id,account_code,account_kind,currency,status,envelope_id");
  if (ledgerUpsert.error) throw new Error("money_ledger_bootstrap_failed");

  return {
    customer: {
      id: customer.id,
      onboardingState: customer.onboarding_state,
      kycState: customer.kyc_state,
      provider: customer.banking_provider,
    },
    envelopes: envUpsert.data || [],
    ledgerAccounts: ledgerUpsert.data || [],
  };
}

async function moneySummary(admin: ReturnType<typeof createClient>, userId: string) {
  const [accountsResult, entriesResult, depositsResult, cardsResult, billsResult, transfersResult] = await Promise.all([
    admin.from("tw_money_ledger_accounts")
      .select("id,account_code,account_kind,currency,status,envelope_id")
      .eq("user_id", userId)
      .order("account_code"),
    admin.from("tw_money_ledger_entries")
      .select("ledger_account_id,amount_cents")
      .eq("user_id", userId),
    admin.from("tw_money_deposit_accounts")
      .select("id,provider,account_kind,status,currency,account_last4,routing_last4,capabilities")
      .eq("user_id", userId),
    admin.from("tw_money_virtual_cards")
      .select("id,label,card_mode,status,last4,spend_limit_cents,envelope_id,biller_id,provider")
      .eq("user_id", userId),
    admin.from("tw_money_billers")
      .select("id,display_name,bill_type,status,autopay_state,due_day,discovery_provider")
      .eq("user_id", userId),
    admin.from("tw_money_transfers")
      .select("id,transfer_type,rail,amount_cents,currency,state,provider,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (accountsResult.error || entriesResult.error || depositsResult.error || cardsResult.error || billsResult.error || transfersResult.error) {
    throw new Error("money_summary_read_failed");
  }
  const sums = new Map<string, number>();
  for (const e of entriesResult.data || []) {
    sums.set(e.ledger_account_id, (sums.get(e.ledger_account_id) || 0) + Number(e.amount_cents || 0));
  }
  return {
    ledgerAccounts: (accountsResult.data || []).map((a) => ({
      ...a,
      balance_cents: sums.get(a.id) || 0,
    })),
    depositAccounts: depositsResult.data || [],
    cards: cardsResult.data || [],
    bills: billsResult.data || [],
    recentTransfers: transfersResult.data || [],
  };
}

async function requireAal2ForProduction(userClient: ReturnType<typeof createClient>) {
  if (MONEY_EXECUTION_MODE !== "production") return;
  const { data, error } = await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || data?.currentLevel !== "aal2") throw new Error("mfa_aal2_required");
}

async function directDepositLink(
  admin: ReturnType<typeof createClient>,
  userId: string,
  depositAccountId: string,
) {
  if (!canExecuteProvider("unit") || !canExecuteProvider("pinwheel")) {
    throw new Error("direct_deposit_providers_not_configured");
  }
  const { data: account, error } = await admin.from("tw_money_deposit_accounts")
    .select("id,provider,provider_account_id,account_kind,status")
    .eq("id", depositAccountId).eq("user_id", userId).maybeSingle();
  if (error || !account) throw new Error("deposit_account_not_found");
  if (account.provider !== "unit" || account.status !== "open") throw new Error("deposit_account_not_ready");

  const unit = await unitRequest("/accounts/" + encodeURIComponent(account.provider_account_id));
  const data = unit.data && typeof unit.data === "object" ? unit.data as AnyRecord : {};
  const attrs = data.attributes && typeof data.attributes === "object" ? data.attributes as AnyRecord : {};
  const routingNumber = safeText(attrs.routingNumber, 20);
  const accountNumber = safeText(attrs.accountNumber, 32);
  if (!routingNumber || !accountNumber) throw new Error("deposit_account_details_unavailable");

  const pinwheel = await pinwheelLinkToken({
    org_name: "This Week",
    end_user_id: userId,
    solution: "Deposit Switch",
    features: ["direct_deposit_switch"],
    allocation: {
      targets: [{
        name: "This Week Cash",
        type: account.account_kind === "savings" ? "savings" : "checking",
        routing_number: routingNumber,
        account_number: accountNumber,
      }],
    },
  });
  const pwData = pinwheel.data && typeof pinwheel.data === "object" ? pinwheel.data as AnyRecord : {};
  const linkId = safeText(pwData.id, 120);
  const linkToken = safeText(pwData.token, 3000);
  const expires = safeText(pwData.expires, 100);
  if (!linkId || !linkToken) throw new Error("pinwheel_link_invalid");

  const created = await admin.from("tw_money_direct_deposit_switches").insert({
    user_id: userId,
    target_deposit_account_id: account.id,
    provider: "pinwheel",
    provider_link_id: linkId,
    state: "link_created",
  }).select("id,state,provider_link_id,created_at").single();
  if (created.error || !created.data) throw new Error("direct_deposit_switch_store_failed");

  return {
    switch: created.data,
    linkToken,
    expires,
    mode: MONEY_EXECUTION_MODE,
  };
}

async function createUnitVirtualCard(
  admin: ReturnType<typeof createClient>,
  userId: string,
  body: AnyRecord,
) {
  if (!canExecuteProvider("unit")) throw new Error("unit_not_configured");
  const depositAccountId = safeText(body.depositAccountId, 80);
  const envelopeId = safeText(body.envelopeId, 80);
  const billerId = safeText(body.billerId, 80) || null;
  const mode = safeText(body.cardMode, 40);
  const label = safeText(body.label, 80);
  const clientRequestId = safeText(body.clientRequestId, 120);
  const spendLimit = body.spendLimitCents == null ? null : moneyInt(body.spendLimitCents, 1, 10_000_000);

  if (!depositAccountId || !envelopeId || !label || !clientRequestId) throw new Error("card_request_incomplete");
  if (!["category", "bill"].includes(mode)) throw new Error("card_mode_requires_authorization_controller");

  const { data: deposit } = await admin.from("tw_money_deposit_accounts")
    .select("id,provider,provider_account_id,money_customer_id,status")
    .eq("id", depositAccountId).eq("user_id", userId).maybeSingle();
  if (!deposit || deposit.provider !== "unit" || deposit.status !== "open") throw new Error("deposit_account_not_ready");

  const { data: customer } = await admin.from("tw_money_customers")
    .select("id,banking_provider,provider_customer_id,onboarding_state")
    .eq("id", deposit.money_customer_id).eq("user_id", userId).maybeSingle();
  if (!customer?.provider_customer_id || customer.banking_provider !== "unit" || customer.onboarding_state !== "approved") {
    throw new Error("unit_customer_not_ready");
  }

  const { data: envelope } = await admin.from("tw_money_envelopes")
    .select("id,status").eq("id", envelopeId).eq("user_id", userId).maybeSingle();
  if (!envelope || envelope.status !== "active") throw new Error("envelope_not_available");

  if (billerId) {
    const { data: biller } = await admin.from("tw_money_billers")
      .select("id").eq("id", billerId).eq("user_id", userId).maybeSingle();
    if (!biller) throw new Error("biller_not_found");
  }

  const unit = await unitRequest("/cards", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "individualVirtualDebitCard",
        attributes: { idempotencyKey: clientRequestId },
        relationships: {
          account: { data: { type: "depositAccount", id: deposit.provider_account_id } },
          customer: { data: { type: "individualCustomer", id: customer.provider_customer_id } },
        },
      },
    }),
  });
  const cardData = unit.data && typeof unit.data === "object" ? unit.data as AnyRecord : {};
  const attrs = cardData.attributes && typeof cardData.attributes === "object" ? cardData.attributes as AnyRecord : {};
  const providerCardId = safeText(cardData.id, 180);
  if (!providerCardId) throw new Error("unit_card_invalid");

  const inserted = await admin.from("tw_money_virtual_cards").insert({
    user_id: userId,
    deposit_account_id: deposit.id,
    envelope_id: envelope.id,
    biller_id: billerId,
    provider: "unit",
    provider_card_id: providerCardId,
    card_mode: mode,
    label,
    status: "active",
    spend_limit_cents: spendLimit,
    last4: safeText(attrs.last4Digits, 4) || null,
    expires_at: attrs.expirationDate ? String(attrs.expirationDate) + "-01T00:00:00Z" : null,
  }).select("id,label,card_mode,status,last4,spend_limit_cents,provider").single();
  if (inserted.error || !inserted.data) throw new Error("card_store_failed");
  return inserted.data;
}

async function authorizeBillPayment(
  admin: ReturnType<typeof createClient>,
  userId: string,
  body: AnyRecord,
) {
  const billerId = safeText(body.billerId, 80);
  const fundingAccountId = safeText(body.fundingAccountId, 80);
  const envelopeId = safeText(body.envelopeId, 80);
  const amount = moneyInt(body.amountCents, 1, 25_000_000);
  const clientRequestId = safeText(body.clientRequestId, 120);
  const termsVersion = safeText(body.termsVersion, 80);
  const consentTextHash = safeText(body.consentTextHash, 180);
  if (!billerId || !fundingAccountId || !envelopeId || !clientRequestId || !termsVersion || !consentTextHash) {
    throw new Error("bill_payment_request_incomplete");
  }

  const [biller, funding, envelope] = await Promise.all([
    admin.from("tw_money_billers").select("id,status,display_name,discovery_provider,provider_biller_id")
      .eq("id", billerId).eq("user_id", userId).maybeSingle(),
    admin.from("tw_money_funding_accounts").select("id,status,processor_provider,processor_reference")
      .eq("id", fundingAccountId).eq("user_id", userId).maybeSingle(),
    admin.from("tw_money_envelopes").select("id,status")
      .eq("id", envelopeId).eq("user_id", userId).maybeSingle(),
  ]);
  if (!biller.data || biller.data.status !== "active") throw new Error("biller_not_available");
  if (!funding.data || funding.data.status !== "verified") throw new Error("funding_account_not_verified");
  if (!envelope.data || envelope.data.status !== "active") throw new Error("envelope_not_available");

  const auth = await admin.from("tw_money_authorizations").insert({
    user_id: userId,
    authorization_kind: "bill_payment",
    terms_version: termsVersion,
    consent_text_hash: consentTextHash,
    provider: "method",
  }).select("id,accepted_at").single();
  if (auth.error || !auth.data) throw new Error("bill_payment_authorization_store_failed");

  const payment = await admin.from("tw_money_bill_payments").insert({
    user_id: userId,
    biller_id: billerId,
    source_funding_account_id: fundingAccountId,
    source_envelope_id: envelopeId,
    authorization_id: auth.data.id,
    amount_cents: amount,
    currency: "USD",
    payment_rail: "method",
    provider: "method",
    state: "authorized",
    idempotency_key: clientRequestId,
  }).select("id,state,amount_cents,currency,created_at").single();
  if (payment.error || !payment.data) throw new Error("bill_payment_store_failed");
  return payment.data;
}

async function submitMethodBillPayment(
  admin: ReturnType<typeof createClient>,
  userId: string,
  paymentId: string,
) {
  if (!canExecuteProvider("method")) throw new Error("method_not_configured");
  const { data: payment } = await admin.from("tw_money_bill_payments")
    .select("id,biller_id,source_funding_account_id,amount_cents,state,idempotency_key")
    .eq("id", paymentId).eq("user_id", userId).maybeSingle();
  if (!payment) throw new Error("bill_payment_not_found");
  if (!["authorized", "scheduled"].includes(payment.state)) throw new Error("bill_payment_not_submittable");

  const [biller, funding] = await Promise.all([
    admin.from("tw_money_billers").select("id,provider_biller_id,display_name")
      .eq("id", payment.biller_id).eq("user_id", userId).maybeSingle(),
    admin.from("tw_money_funding_accounts").select("id,processor_provider,processor_reference,status")
      .eq("id", payment.source_funding_account_id).eq("user_id", userId).maybeSingle(),
  ]);
  if (!biller.data?.provider_biller_id) throw new Error("method_destination_missing");
  if (!funding.data || funding.data.processor_provider !== "method" || funding.data.status !== "verified" || !funding.data.processor_reference) {
    throw new Error("method_source_missing");
  }

  const result = await methodPayment({
    amount: payment.amount_cents,
    source: funding.data.processor_reference,
    destination: biller.data.provider_biller_id,
    description: safeText("This Week " + (biller.data.display_name || "Bill"), 80),
  }, payment.idempotency_key);

  const providerPaymentId = safeText(result.id || (result.data as AnyRecord)?.id, 180);
  const providerStatus = safeText(result.status || (result.data as AnyRecord)?.status, 60).toLowerCase();
  const nextState = providerStatus === "completed" || providerStatus === "paid" ? "paid" : "processing";

  const updated = await admin.from("tw_money_bill_payments").update({
    provider_payment_id: providerPaymentId || null,
    state: nextState,
    updated_at: new Date().toISOString(),
    paid_at: nextState === "paid" ? new Date().toISOString() : null,
  }).eq("id", payment.id).eq("user_id", userId)
    .select("id,state,provider_payment_id,amount_cents,updated_at").single();
  if (updated.error || !updated.data) throw new Error("bill_payment_update_failed");
  return updated.data;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return json(origin, 403, { error: "origin_not_allowed" });
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return json(origin, 405, { error: "method_not_allowed" });
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json(origin, 403, { error: "origin_not_allowed" });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(origin, 503, { error: "backend_not_configured" });
  }

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json(origin, 401, { error: "authentication_required" });
  const token = authorization.slice("Bearer ".length);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return json(origin, 401, { error: "invalid_session" });
  if ((user as AnyRecord).is_anonymous === true) return json(origin, 403, { error: "recoverable_auth_required" });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: AnyRecord = {};
  try { body = await req.json() as AnyRecord; }
  catch { return json(origin, 400, { error: "invalid_json" }); }
  const action = safeText(body.action, 80);

  try {
    if (action === "status") {
      const [customer, deposits, transfers, cards, bills, rewards] = await Promise.all([
        admin.from("tw_money_customers").select("id,onboarding_state,kyc_state,banking_provider")
          .eq("user_id", user.id).maybeSingle(),
        admin.from("tw_money_deposit_accounts").select("id,status,provider,account_last4")
          .eq("user_id", user.id),
        admin.from("tw_money_transfers").select("id,state").eq("user_id", user.id),
        admin.from("tw_money_virtual_cards").select("id,status").eq("user_id", user.id),
        admin.from("tw_money_billers").select("id,status").eq("user_id", user.id),
        admin.from("tw_money_reward_offers").select("id,offer_code,title,reward_amount_cents,minimum_qualifying_deposit_cents,active")
          .eq("active", true),
      ]);
      return json(origin, 200, {
        ok: true,
        executionMode: MONEY_EXECUTION_MODE,
        liveMoneyEnabled: LIVE_MONEY_ENABLED,
        providers: providerFlags(),
        providerExecution: {
          unit: canExecuteProvider("unit"),
          pinwheel: canExecuteProvider("pinwheel"),
          method: canExecuteProvider("method"),
          plaid: canExecuteProvider("plaid"),
        },
        customer: customer.data || null,
        counts: {
          depositAccounts: deposits.data?.length || 0,
          transfers: transfers.data?.length || 0,
          cards: cards.data?.length || 0,
          bills: bills.data?.length || 0,
        },
        activeRewards: rewards.data || [],
        safety: {
          planAuthority: "browser_local",
          moneyLedgerAuthority: "server_double_entry",
          providerCallsLockedByDefault: true,
        },
      });
    }

    if (action === "bootstrap") {
      const result = await bootstrapMoney(admin, user.id);
      return json(origin, 200, { ok: true, ...result });
    }

    if (action === "summary") {
      const result = await moneySummary(admin, user.id);
      return json(origin, 200, { ok: true, ...result });
    }

    if (action === "sandbox_credit") {
      if (MONEY_EXECUTION_MODE !== "sandbox") return json(origin, 403, { error: "sandbox_action_disabled" });
      const amount = moneyInt(body.amountCents, 1, 10_000_000);
      const requestId = safeText(body.clientRequestId, 120);
      if (!requestId) throw new Error("client_request_id_required");
      await bootstrapMoney(admin, user.id);
      const { data: accounts } = await admin.from("tw_money_ledger_accounts")
        .select("id,account_code").eq("user_id", user.id)
        .in("account_code", ["cash:unallocated", "external:offset"]);
      const byCode = new Map((accounts || []).map((a) => [a.account_code, a.id]));
      const cash = byCode.get("cash:unallocated"), offset = byCode.get("external:offset");
      if (!cash || !offset) throw new Error("ledger_bootstrap_incomplete");
      const posted = await admin.rpc("tw_money_post_journal", {
        p_user_id: user.id,
        p_event_type: "sandbox_cash_credit",
        p_idempotency_key: requestId,
        p_currency: "USD",
        p_entries: [
          { ledger_account_id: cash, amount_cents: amount },
          { ledger_account_id: offset, amount_cents: -amount },
        ],
        p_provider: "sandbox",
        p_provider_event_id: null,
        p_metadata: { source: "money_gateway_sandbox" },
      });
      if (posted.error) throw new Error("sandbox_credit_failed");
      return json(origin, 200, { ok: true, journalId: posted.data });
    }

    if (action === "allocate") {
      const amount = moneyInt(body.amountCents, 1, 10_000_000);
      const envelopeKey = safeText(body.envelopeKey, 40);
      const requestId = safeText(body.clientRequestId, 120);
      if (!["bills", "essentials", "lifestyle", "savings"].includes(envelopeKey)) throw new Error("invalid_envelope");
      if (!requestId) throw new Error("client_request_id_required");
      await bootstrapMoney(admin, user.id);
      const { data: accounts } = await admin.from("tw_money_ledger_accounts")
        .select("id,account_code").eq("user_id", user.id)
        .in("account_code", ["cash:unallocated", "envelope:" + envelopeKey]);
      const byCode = new Map((accounts || []).map((a) => [a.account_code, a.id]));
      const source = byCode.get("cash:unallocated"), destination = byCode.get("envelope:" + envelopeKey);
      if (!source || !destination) throw new Error("ledger_bootstrap_incomplete");
      const moved = await admin.rpc("tw_money_move_balance", {
        p_user_id: user.id,
        p_source_account_id: source,
        p_destination_account_id: destination,
        p_amount_cents: amount,
        p_event_type: "allocate_" + envelopeKey,
        p_idempotency_key: requestId,
        p_metadata: { envelope: envelopeKey },
      });
      if (moved.error) throw new Error(safeText(moved.error.message, 120) || "allocation_failed");
      return json(origin, 200, { ok: true, journalId: moved.data });
    }


    if (action === "unit_sandbox_application") {
      const result = await createUnitSandboxApplication(admin, user.id);
      return json(origin, 200, { ok: true, application: result });
    }

    if (action === "unit_application_status") {
      const result = await refreshUnitApplication(admin, user.id);
      return json(origin, 200, { ok: true, application: result });
    }

    if (action === "unit_create_deposit_account") {
      await requireAal2ForProduction(userClient);
      const requestId = safeText(body.clientRequestId, 120);
      if (!requestId) throw new Error("client_request_id_required");
      const result = await createUnitDepositAccount(admin, user.id, requestId);
      return json(origin, 200, { ok: true, ...result });
    }

    if (action === "unit_sandbox_fund") {
      const depositAccountId = safeText(body.depositAccountId, 80);
      const amount = moneyInt(body.amountCents, 1, 5_000_000);
      if (!depositAccountId) throw new Error("deposit_account_id_required");
      const result = await sandboxFundUnitAccount(admin, user.id, depositAccountId, amount);
      return json(origin, 200, { ok: true, funding: result });
    }

    if (action === "plaid_unit_funding_link") {
      await requireAal2ForProduction(userClient);
      const providerAccountRowId = safeText(body.providerAccountRowId, 80);
      const requestId = safeText(body.clientRequestId, 120);
      if (!providerAccountRowId || !requestId) throw new Error("provider_account_and_request_id_required");
      const result = await createUnitFundingAccountFromPlaid(admin, user.id, providerAccountRowId, requestId);
      return json(origin, 200, { ok: true, ...result });
    }

    if (action === "unit_fund_from_external") {
      await requireAal2ForProduction(userClient);
      const result = await fundUnitFromExternal(admin, user.id, body);
      return json(origin, 200, { ok: true, transfer: result });
    }

    if (action === "unit_sandbox_authorization") {
      const result = await simulateUnitAuthorization(admin, user.id, body);
      return json(origin, 200, { ok: true, simulation: result });
    }

    if (action === "direct_deposit_link") {
      await requireAal2ForProduction(userClient);
      const depositAccountId = safeText(body.depositAccountId, 80);
      if (!depositAccountId) throw new Error("deposit_account_id_required");
      const result = await directDepositLink(admin, user.id, depositAccountId);
      return json(origin, 200, { ok: true, ...result });
    }

    if (action === "create_virtual_card") {
      await requireAal2ForProduction(userClient);
      const result = await createUnitVirtualCard(admin, user.id, body);
      return json(origin, 200, { ok: true, card: result });
    }

    if (action === "authorize_bill_payment") {
      const result = await authorizeBillPayment(admin, user.id, body);
      return json(origin, 200, { ok: true, payment: result });
    }

    if (action === "submit_bill_payment") {
      await requireAal2ForProduction(userClient);
      const paymentId = safeText(body.paymentId, 80);
      if (!paymentId) throw new Error("payment_id_required");
      const result = await submitMethodBillPayment(admin, user.id, paymentId);
      return json(origin, 200, { ok: true, payment: result });
    }

    return json(origin, 400, { error: "unsupported_action" });
  } catch (error) {
    const code = safeText((error as Error)?.message || "money_gateway_error", 120) || "money_gateway_error";
    const status = code.endsWith("_not_configured") || code.includes("providers_not_configured") ? 503
      : code.includes("required") || code.includes("invalid") || code.includes("not_ready") || code.includes("not_found") || code.includes("not_available") ? 400
      : code.includes("mfa_") || code.includes("disabled") ? 403
      : 500;
    return json(origin, status, { error: code });
  }
});
