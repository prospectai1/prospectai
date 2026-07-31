// POST /api/leads/dispute
// Body: { contactId, reason }
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { contactId, reason } = readBody(req);
  if (!contactId) return json(res, 400, { error: "contactId is required" });
  const [dispute] = await db.insert("lead_disputes", [{ contact_id: contactId, reason: reason || "Not specified", status: "Open" }]);
  json(res, 200, { dispute });
});
