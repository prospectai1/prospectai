// GET /api/settings/suppression
const { withErrorHandling, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const list = await db.select("suppression_list", { order: "added_at.desc", limit: "1000" });
  json(res, 200, { suppression: list });
});
