// GET /api/outreach/list?contactId=<optional>
const { withErrorHandling, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const contactId = req.query.contactId;
  const filter = contactId ? `contact_id=eq.${contactId}` : "";
  const messages = await db.select("outreach_messages", { filter, order: "created_at.desc", limit: "500" });
  json(res, 200, { messages });
});
