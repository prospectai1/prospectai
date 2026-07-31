// POST /api/leads/status
// Body: { contactId, status }
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

const VALID = ["New", "Enriched", "Scored", "In Outreach", "Engaged", "Meeting Booked", "Opportunity"];

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { contactId, status } = readBody(req);
  if (!contactId || !VALID.includes(status)) return json(res, 400, { error: `status must be one of: ${VALID.join(", ")}` });
  const [updated] = await db.update("contacts", `id=eq.${contactId}`, { status });
  json(res, 200, { contact: updated });
});
