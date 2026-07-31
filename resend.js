// GET /api/leads/disputes
const { withErrorHandling, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const disputes = await db.select("lead_disputes", { order: "created_at.desc", limit: "500" });
  json(res, 200, { disputes });
});
