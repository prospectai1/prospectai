// GET /api/clients?divisionId=<optional>  — list
// POST /api/clients  — create { name, divisionId, tier, contractValue, slaTargetLeads, csm }
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method === "GET") {
    const divisionId = req.query.divisionId;
    const filter = divisionId && divisionId !== "all" ? `division_id=eq.${divisionId}` : "";
    const clients = await db.select("clients", { filter, order: "created_at.desc" });
    return json(res, 200, { clients });
  }
  if (req.method === "POST") {
    const b = readBody(req);
    if (!b.name) return json(res, 400, { error: "name is required" });
    const [client] = await db.insert("clients", [{
      name: b.name,
      division_id: b.divisionId || null,
      tier: b.tier || "Retainer",
      stage: "New Inquiry",
      contract_value: b.contractValue || 0,
      sla_target_leads: b.slaTargetLeads || 30,
      csm: b.csm || null,
      health_score: 70,
      renewal_probability: 60,
    }]);
    return json(res, 200, { client });
  }
  methodNotAllowed(res, ["GET", "POST"]);
});
