// POST /api/outreach/unsubscribe
// Body: { email, reason }
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { email, reason } = readBody(req);
  if (!email) return json(res, 400, { error: "email is required" });

  const existing = await db.select("suppression_list", { filter: `email=eq.${encodeURIComponent(email)}` });
  if (existing.length) return json(res, 200, { suppression: existing[0], alreadySuppressed: true });

  const [row] = await db.insert("suppression_list", [{ email, reason: reason || "unsubscribed" }]);
  json(res, 200, { suppression: row });
});
