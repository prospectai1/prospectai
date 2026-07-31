// GET /api/leads/list?divisionId=<uuid optional>
const { withErrorHandling, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const divisionId = req.query.divisionId;
  const filter = divisionId && divisionId !== "all" ? `division_id=eq.${divisionId}` : "";
  const contacts = await db.select("contacts", {
    filter,
    select: "*,companies(name,domain,industry)",
    order: "created_at.desc",
    limit: "500",
  });
  json(res, 200, { contacts });
});
