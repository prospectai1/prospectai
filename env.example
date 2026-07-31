// Thin wrapper around Supabase's auto-generated REST API (PostgREST).
// Deliberately dependency-free (no @supabase/supabase-js) so Vercel's build
// has nothing to install and nothing that can fail to install.
//
// Uses the SERVICE ROLE key, which bypasses Row Level Security. This file
// must only ever run server-side (inside /api functions) — never import
// it from anything in /public.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertConfigured() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    const err = new Error(
      "Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. " +
      "Set them in Vercel -> Project -> Settings -> Environment Variables, then redeploy."
    );
    err.statusCode = 500;
    throw err;
  }
}

function headers(extra) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function handle(res) {
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const err = new Error(
      (data && (data.message || data.error_description || data.error)) || `Supabase request failed (${res.status})`
    );
    err.statusCode = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

// ---- Query helpers over any table ----

async function select(table, { filter = "", select: cols = "*", order = "", limit = "" } = {}) {
  assertConfigured();
  const params = new URLSearchParams();
  params.set("select", cols);
  if (order) params.set("order", order);
  if (limit) params.set("limit", limit);
  const qs = params.toString() + (filter ? `&${filter}` : "");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: headers() });
  return handle(res);
}

async function insert(table, rows) {
  assertConfigured();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(rows),
  });
  return handle(res);
}

async function update(table, filter, patch) {
  assertConfigured();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(patch),
  });
  return handle(res);
}

async function remove(table, filter) {
  assertConfigured();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: headers({ Prefer: "return=representation" }),
  });
  return handle(res);
}

// ---- Convenience: run raw SQL via the PostgREST RPC is not available by
// default, so all access here stays within plain REST semantics. ----

module.exports = { select, insert, update, remove, SUPABASE_URL };
