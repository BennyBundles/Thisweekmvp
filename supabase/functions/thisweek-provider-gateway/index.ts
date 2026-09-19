import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import postgres from "npm:postgres@3.4.7";

type AnyRecord = Record<string, unknown>;

const CONSENT_VERSION = "2026-09";
const PROVIDER = "plaid";
const DEFAULT_APP_URL = "https://bennybundles.github.io/Thisweekmvp/";

function parseKeySet(name: string): string {
  try {
    const raw = Deno.env.get(name);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") {
      const values = Object.values(parsed).filter((v) => typeof v === "string") as string[];
      return String((parsed as AnyRecord).default || values[0] || "");
    }
  } catch {}
  return "";
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const PUBLISHABLE_KEY = parseKeySet("SUPABASE_PUBLISHABLE_KEYS") || Deno.env.get("SUPABASE_ANON_KEY") || "";
const SECRET_KEY = parseKeySet("SUPABASE_SECRET_KEYS") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const DB_URL = Deno.env.get("SUPABASE_DB_URL") || "";
const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID") || "";
const PLAID_SECRET = Deno.env.get("PLAID_SECRET") || "";
const PLAID_BASE_URL = (Deno.env.get("PLAID_BASE_URL") || "https://sandbox.plaid.com").replace(/\/$/, "");
const APP_URL = Deno.env.get("THISWEEK_APP_URL") || DEFAULT_APP_URL;
const PLAID_OAUTH_REDIRECT_URI = Deno.env.get("PLAID_OAUTH_REDIRECT_URI") || "";
const PLAID_WEBHOOK_URL = Deno.env.get("PLAID_WEBHOOK_URL") || "";
const ALLOWED_ORIGINS = (Deno.env.get("THISWEEK_ALLOWED_ORIGINS") || "https://bennybundles.github.io")
  .split(",").map((v) => v.trim()).filter(Boolean);

const sql = DB_URL ? postgres(DB_URL, { prepare: false, max: 1 }) : null;

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

function json(origin: string | null, status: number, body: AnyRecord): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function safeText(value: unknown, max = 180): string {
  return String(value ?? "").normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
    .trim().slice(0, max);
}

function providerConfigured(): boolean {
  return !!(SUPABASE_URL && PUBLISHABLE_KEY && SECRET_KEY && DB_URL && PLAID_CLIENT_ID && PLAID_SECRET);
}

async function plaidPost(path: string, payload: AnyRecord): Promise<AnyRecord> {
  if (!PLAID_CLIENT_ID || !PLAID_SECRET) throw new Error("provider_not_configured");
  const response = await fetch(PLAID_BASE_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = safeText((data as AnyRecord).error_code || "provider_request_failed", 80);
    throw new Error(code || "provider_request_failed");
  }
  return data as AnyRecord;
}

async function vaultCreate(secret: string, name: string, description: string): Promise<string> {
  if (!sql) throw new Error("vault_unavailable");
  const rows = await sql.unsafe(
    "select vault.create_secret($1, $2, $3)::text as id",
    [secret, name, description],
  );
  return String(rows[0]?.id || "");
}

async function vaultRead(id: string): Promise<string> {
  if (!sql) throw new Error("vault_unavailable");
  const rows = await sql.unsafe(
    "select decrypted_secret from vault.decrypted_secrets where id = $1::uuid limit 1",
    [id],
  );
  const value = rows[0]?.decrypted_secret;
  if (!value) throw new Error("provider_token_missing");
  return String(value);
}

async function vaultDelete(id: string | null | undefined): Promise<void> {
  if (!id || !sql) return;
  await sql.unsafe("delete from vault.secrets where id = $1::uuid", [id]);
}

function cents(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const c = Math.round(n * 100);
  return Number.isSafeInteger(c) ? c : null;
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function completionRedirect(sessionId: string): string {
  const base = APP_URL.replace(/#.*$/, "");
  return base + "#connections?providerReturn=" + encodeURIComponent(sessionId);
}

function publicAccount(row: AnyRecord): AnyRecord {
  return {
    id: row.id,
    connectionId: row.connection_id,
    providerAccountId: row.provider_account_id,
    displayName: row.display_name,
    maskLast4: row.mask_last4,
    accountType: row.account_type,
    accountSubtype: row.account_subtype,
    currency: row.currency,
    availableBalanceCents: row.available_balance_cents,
    currentBalanceCents: row.current_balance_cents,
    balanceAsOf: row.balance_as_of,
    status: row.status,
    provenance: "external_provider",
  };
}

function publicTransaction(row: AnyRecord): AnyRecord {
  return {
    id: row.id,
    connectionId: row.connection_id,
    accountId: row.account_id,
    providerTransactionId: row.provider_transaction_id,
    providerAccountId: row.provider_account_id,
    pendingProviderTransactionId: row.pending_provider_transaction_id,
    status: row.status,
    direction: row.direction,
    amountCents: row.amount_cents,
    currency: row.iso_currency_code,
    date: row.transaction_date,
    authorizedAt: row.authorized_at,
    description: row.description,
    merchantName: row.merchant_name,
    categoryHint: row.category_hint,
    provenance: "external_provider",
    reconciliationState: "reference",
  };
}

async function upsertAccounts(admin: ReturnType<typeof createClient>, userId: string, connectionId: string, accessToken: string) {
  const response = await plaidPost("/accounts/get", { access_token: accessToken });
  const accounts = Array.isArray(response.accounts) ? response.accounts as AnyRecord[] : [];
  const now = new Date().toISOString();
  const rows = accounts.map((account) => {
    const balances = (account.balances && typeof account.balances === "object") ? account.balances as AnyRecord : {};
    return {
      user_id: userId,
      connection_id: connectionId,
      provider_account_id: safeText(account.account_id, 180),
      display_name: safeText(account.name || account.official_name || "Connected account", 120),
      mask_last4: safeText(account.mask, 4) || null,
      account_type: safeText(account.type, 40) || null,
      account_subtype: safeText(account.subtype, 60) || null,
      currency: safeText(balances.iso_currency_code, 12) || null,
      available_balance_cents: cents(balances.available),
      current_balance_cents: cents(balances.current),
      balance_as_of: now,
      status: "active",
      updated_at: now,
    };
  });
  if (rows.length) {
    const { error } = await admin.from("tw_provider_accounts")
      .upsert(rows, { onConflict: "user_id,connection_id,provider_account_id" });
    if (error) throw new Error("account_store_failed");
  }
  return rows.length;
}

async function syncConnection(admin: ReturnType<typeof createClient>, userId: string, connectionId: string) {
  const { data: connection, error: connectionError } = await admin.from("tw_provider_connections")
    .select("id,user_id,vault_secret_id,sync_cursor,status")
    .eq("id", connectionId).eq("user_id", userId).maybeSingle();
  if (connectionError || !connection) throw new Error("connection_not_found");
  if (connection.status === "disconnected") throw new Error("connection_disconnected");

  const accessToken = await vaultRead(connection.vault_secret_id);
  const runId = crypto.randomUUID();
  await admin.from("tw_provider_sync_runs").insert({
    id: runId, user_id: userId, connection_id: connectionId, status: "running",
  });

  let cursor = connection.sync_cursor || null;
  let hasMore = true;
  let page = 0;
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;

  try {
    await upsertAccounts(admin, userId, connectionId, accessToken);
    const { data: accountRows, error: accountError } = await admin.from("tw_provider_accounts")
      .select("id,provider_account_id").eq("user_id", userId).eq("connection_id", connectionId);
    if (accountError) throw new Error("account_lookup_failed");
    const accountMap = new Map((accountRows || []).map((r) => [r.provider_account_id, r.id]));

    while (hasMore && page < 20) {
      page += 1;
      const payload: AnyRecord = { access_token: accessToken, count: 500 };
      if (cursor) payload.cursor = cursor;
      const response = await plaidPost("/transactions/sync", payload);
      const added = Array.isArray(response.added) ? response.added as AnyRecord[] : [];
      const modified = Array.isArray(response.modified) ? response.modified as AnyRecord[] : [];
      const removed = Array.isArray(response.removed) ? response.removed as AnyRecord[] : [];

      for (const group of [{ rows: added }, { rows: modified }]) {
        if (!group.rows.length) continue;
        const normalized = [];
        for (const tx of group.rows) {
          const amount = Number(tx.amount);
          const amountCents = cents(Math.abs(amount));
          if (amountCents === null) continue;
          const providerAccountId = safeText(tx.account_id, 180);
          const providerTransactionId = safeText(tx.transaction_id, 220);
          if (!providerAccountId || !providerTransactionId) continue;
          const status = tx.pending === true ? "pending" : "posted";
          const direction = amount >= 0 ? "outflow" : "inflow";
          const date = safeText(tx.date, 10);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
          const description = safeText(tx.name || tx.original_description || "Transaction", 240) || "Transaction";
          const merchantName = safeText(tx.merchant_name, 180) || null;
          const personal = tx.personal_finance_category && typeof tx.personal_finance_category === "object"
            ? tx.personal_finance_category as AnyRecord : {};
          const categoryHint = safeText(personal.primary, 120) || null;
          const providerPayloadHash = await sha256(JSON.stringify([
            providerTransactionId, providerAccountId, amountCents, status, direction, date, description,
          ]));
          normalized.push({
            user_id: userId,
            connection_id: connectionId,
            account_id: accountMap.get(providerAccountId) || null,
            provider_transaction_id: providerTransactionId,
            provider_account_id: providerAccountId,
            pending_provider_transaction_id: safeText(tx.pending_transaction_id, 220) || null,
            status,
            direction,
            amount_cents: amountCents,
            iso_currency_code: safeText(tx.iso_currency_code, 12) || null,
            transaction_date: date,
            authorized_at: tx.authorized_datetime || tx.authorized_date || null,
            description,
            merchant_name: merchantName,
            category_hint: categoryHint,
            provider_payload_hash: providerPayloadHash,
            updated_at: new Date().toISOString(),
          });
        }
        if (normalized.length) {
          const { error } = await admin.from("tw_provider_transactions")
            .upsert(normalized, { onConflict: "user_id,connection_id,provider_transaction_id" });
          if (error) throw new Error("transaction_store_failed");
        }
      }

      for (const removedTx of removed) {
        const providerTransactionId = safeText(removedTx.transaction_id, 220);
        if (!providerTransactionId) continue;
        await admin.from("tw_provider_transactions")
          .update({ status: "removed", updated_at: new Date().toISOString() })
          .eq("user_id", userId).eq("connection_id", connectionId)
          .eq("provider_transaction_id", providerTransactionId);
      }

      addedCount += added.length;
      modifiedCount += modified.length;
      removedCount += removed.length;
      cursor = safeText(response.next_cursor, 500) || cursor;
      hasMore = response.has_more === true;
    }

    if (hasMore) throw new Error("sync_page_limit_reached");
    const completedAt = new Date().toISOString();
    await admin.from("tw_provider_connections").update({
      sync_cursor: cursor, last_success_at: completedAt, last_error_code: null,
      status: "active", updated_at: completedAt,
    }).eq("id", connectionId).eq("user_id", userId);

    await admin.from("tw_provider_sync_runs").update({
      status: "success", added_count: addedCount, modified_count: modifiedCount,
      removed_count: removedCount, completed_at: completedAt,
    }).eq("id", runId).eq("user_id", userId);

    return { addedCount, modifiedCount, removedCount };
  } catch (error) {
    const code = safeText((error as Error)?.message || "sync_failed", 80);
    const completedAt = new Date().toISOString();
    await admin.from("tw_provider_connections")
      .update({ last_error_code: code, updated_at: completedAt })
      .eq("id", connectionId).eq("user_id", userId);
    await admin.from("tw_provider_sync_runs")
      .update({ status: "failed", error_code: code, completed_at: completedAt })
      .eq("id", runId).eq("user_id", userId);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return json(origin, 403, { error: "origin_not_allowed" });
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return json(origin, 405, { error: "method_not_allowed" });
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json(origin, 403, { error: "origin_not_allowed" });
  if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SECRET_KEY) return json(origin, 503, { error: "backend_not_configured" });

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json(origin, 401, { error: "authentication_required" });

  const token = authorization.slice("Bearer ".length);
  const userClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return json(origin, 401, { error: "invalid_session" });

  const admin = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: AnyRecord = {};
  try { body = (await req.json()) as AnyRecord; }
  catch { return json(origin, 400, { error: "invalid_json" }); }
  const action = safeText(body.action, 60);

  try {
    if (action === "status") {
      const { data: connections } = await admin.from("tw_provider_connections")
        .select("id,provider,institution_name,status,last_success_at,last_error_code")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      return json(origin, 200, {
        ok: true, provider: PROVIDER, configured: providerConfigured(),
        consentVersion: CONSENT_VERSION, connections: connections || [],
      });
    }

    if (action === "consent") {
      if (body.accepted !== true) return json(origin, 400, { error: "consent_required" });
      const scopes = Array.isArray(body.scopes)
        ? body.scopes.map((v) => safeText(v, 40)).filter((v) => ["transactions", "balances"].includes(v))
        : ["transactions", "balances"];
      const { data, error } = await admin.from("tw_provider_consents").upsert({
        user_id: user.id, provider: PROVIDER, consent_version: CONSENT_VERSION,
        scopes, accepted_at: new Date().toISOString(), revoked_at: null,
      }, { onConflict: "user_id,provider,consent_version" })
        .select("id,provider,consent_version,scopes,accepted_at").single();
      if (error) throw new Error("consent_store_failed");
      return json(origin, 200, { ok: true, consent: data });
    }

    if (action === "begin_connect") {
      if (!providerConfigured()) return json(origin, 503, { error: "provider_not_configured" });
      const { data: consent } = await admin.from("tw_provider_consents").select("id")
        .eq("user_id", user.id).eq("provider", PROVIDER)
        .eq("consent_version", CONSENT_VERSION).is("revoked_at", null).maybeSingle();
      if (!consent) return json(origin, 409, { error: "consent_required" });

      const sessionId = crypto.randomUUID();
      const payload: AnyRecord = {
        client_name: "This Week",
        user: { client_user_id: user.id },
        products: ["transactions"],
        country_codes: ["US"],
        language: "en",
        hosted_link: {
          completion_redirect_uri: completionRedirect(sessionId),
          is_mobile_app: false,
          url_lifetime_seconds: 1800,
        },
      };
      if (PLAID_OAUTH_REDIRECT_URI) payload.redirect_uri = PLAID_OAUTH_REDIRECT_URI;
      if (PLAID_WEBHOOK_URL) payload.webhook = PLAID_WEBHOOK_URL;

      const response = await plaidPost("/link/token/create", payload);
      const linkToken = safeText(response.link_token, 600);
      const hostedLinkUrl = safeText(response.hosted_link_url, 1200);
      const expiration = safeText(response.expiration, 80);
      if (!linkToken || !hostedLinkUrl || !expiration) throw new Error("link_session_invalid");

      const vaultSecretId = await vaultCreate(linkToken, "thisweek-link-" + sessionId, "Temporary This Week Hosted Link token");
      const { error } = await admin.from("tw_provider_link_sessions").insert({
        id: sessionId, user_id: user.id, provider: PROVIDER,
        vault_secret_id: vaultSecretId, status: "created", expires_at: expiration,
      });
      if (error) {
        await vaultDelete(vaultSecretId);
        throw new Error("link_session_store_failed");
      }
      return json(origin, 200, { ok: true, sessionId, hostedLinkUrl, expiresAt: expiration });
    }

    if (action === "finalize_connect") {
      if (!providerConfigured()) return json(origin, 503, { error: "provider_not_configured" });
      const sessionId = safeText(body.sessionId, 80);
      if (!sessionId) return json(origin, 400, { error: "session_id_required" });

      const { data: session } = await admin.from("tw_provider_link_sessions")
        .select("id,user_id,vault_secret_id,status,expires_at")
        .eq("id", sessionId).eq("user_id", user.id).maybeSingle();
      if (!session) return json(origin, 404, { error: "link_session_not_found" });
      if (session.status === "completed") return json(origin, 200, { ok: true, status: "completed" });
      if (new Date(session.expires_at).getTime() < Date.now()) {
        await admin.from("tw_provider_link_sessions").update({ status: "expired" })
          .eq("id", sessionId).eq("user_id", user.id);
        await vaultDelete(session.vault_secret_id);
        return json(origin, 410, { error: "link_session_expired" });
      }

      const linkToken = await vaultRead(session.vault_secret_id);
      const linkStatus = await plaidPost("/link/token/get", { link_token: linkToken });
      const results = linkStatus.results && typeof linkStatus.results === "object"
        ? linkStatus.results as AnyRecord : {};
      const itemAdds = Array.isArray(results.item_add_results)
        ? results.item_add_results as AnyRecord[] : [];
      const legacySuccess = linkStatus.on_success && typeof linkStatus.on_success === "object"
        ? linkStatus.on_success as AnyRecord : {};
      const firstAdd = itemAdds[0] || legacySuccess;
      const publicToken = safeText(firstAdd.public_token, 600);
      if (!publicToken) return json(origin, 202, { ok: true, status: "pending" });

      const metadata = firstAdd.metadata && typeof firstAdd.metadata === "object"
        ? firstAdd.metadata as AnyRecord : firstAdd;
      const institution = metadata.institution && typeof metadata.institution === "object"
        ? metadata.institution as AnyRecord : {};
      const exchange = await plaidPost("/item/public_token/exchange", { public_token: publicToken });
      const accessToken = safeText(exchange.access_token, 700);
      const itemId = safeText(exchange.item_id, 220);
      if (!accessToken || !itemId) throw new Error("token_exchange_invalid");

      const connectionId = crypto.randomUUID();
      const accessSecretId = await vaultCreate(accessToken, "thisweek-provider-" + connectionId, "This Week Plaid access token");
      const institutionName = safeText(institution.name, 120) || null;
      const institutionId = safeText(institution.institution_id, 120) || null;
      const { data: consent } = await admin.from("tw_provider_consents").select("id")
        .eq("user_id", user.id).eq("provider", PROVIDER)
        .eq("consent_version", CONSENT_VERSION).is("revoked_at", null).maybeSingle();

      const { error: connectionError } = await admin.from("tw_provider_connections").insert({
        id: connectionId, user_id: user.id, provider: PROVIDER,
        provider_item_id: itemId, institution_id: institutionId,
        institution_name: institutionName, vault_secret_id: accessSecretId,
        status: "active", consent_id: consent?.id || null,
      });
      if (connectionError) {
        await vaultDelete(accessSecretId);
        throw new Error("connection_store_failed");
      }

      await vaultDelete(session.vault_secret_id);
      await admin.from("tw_provider_link_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sessionId).eq("user_id", user.id);

      const sync = await syncConnection(admin, user.id, connectionId);
      return json(origin, 200, { ok: true, status: "completed", connectionId, sync });
    }

    if (action === "sync") {
      const connectionId = safeText(body.connectionId, 80);
      if (!connectionId) return json(origin, 400, { error: "connection_id_required" });
      const sync = await syncConnection(admin, user.id, connectionId);
      return json(origin, 200, { ok: true, sync });
    }

    if (action === "accounts") {
      const { data, error } = await admin.from("tw_provider_accounts").select("*")
        .eq("user_id", user.id).order("display_name", { ascending: true });
      if (error) throw new Error("account_read_failed");
      return json(origin, 200, { ok: true, accounts: (data || []).map(publicAccount) });
    }

    if (action === "transactions") {
      const connectionId = safeText(body.connectionId, 80);
      const limit = Math.max(1, Math.min(250, Number(body.limit) || 100));
      let query = admin.from("tw_provider_transactions").select("*")
        .eq("user_id", user.id).neq("status", "removed")
        .order("transaction_date", { ascending: false }).limit(limit);
      if (connectionId) query = query.eq("connection_id", connectionId);
      const { data, error } = await query;
      if (error) throw new Error("transaction_read_failed");
      return json(origin, 200, { ok: true, transactions: (data || []).map(publicTransaction) });
    }

    if (action === "disconnect") {
      const connectionId = safeText(body.connectionId, 80);
      if (!connectionId) return json(origin, 400, { error: "connection_id_required" });
      const { data: connection } = await admin.from("tw_provider_connections")
        .select("id,vault_secret_id,status").eq("id", connectionId)
        .eq("user_id", user.id).maybeSingle();
      if (!connection) return json(origin, 404, { error: "connection_not_found" });

      if (connection.status !== "disconnected" && connection.vault_secret_id) {
        const accessToken = await vaultRead(connection.vault_secret_id);
        await plaidPost("/item/remove", { access_token: accessToken });
        await vaultDelete(connection.vault_secret_id);
        await admin.from("tw_provider_connections").update({
          status: "disconnected", vault_secret_id: null, sync_cursor: null,
          updated_at: new Date().toISOString(),
        }).eq("id", connectionId).eq("user_id", user.id);
      }
      return json(origin, 200, { ok: true, disconnected: true });
    }

    return json(origin, 400, { error: "unsupported_action" });
  } catch (error) {
    const code = safeText((error as Error)?.message || "provider_gateway_error", 100) || "provider_gateway_error";
    return json(origin, code.endsWith("_not_configured") ? 503 : 400, { error: code });
  }
});
