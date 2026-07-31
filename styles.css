// GET /api/divisions
// POST /api/divisions  { name, icon, color, icp, compliance[], sources[], kpiFocus }
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");
const { DEFAULT_WEIGHTS } = require("../_lib/scoring");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method === "GET") {
    const divisions = await db.select("divisions", { order: "created_at.asc" });
    return json(res, 200, { divisions });
  }
  if (req.method === "POST") {
    const b = readBody(req);
    if (!b.name) return json(res, 400, { error: "name is required" });
    const [division] = await db.insert("divisions", [{
      name: b.name,
      icon: b.icon || "🧩",
      color: b.color || "#6366f1",
      icp: b.icp || "",
      compliance: b.compliance || [],
      sources: b.sources || [],
      kpi_focus: b.kpiFocus || "Cost per qualified lead",
      scoring_weights: DEFAULT_WEIGHTS,
    }]);
    return json(res, 200, { division });
  }
  methodNotAllowed(res, ["GET", "POST"]);
});
