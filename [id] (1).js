// PATCH /api/clients/:id  — body may include { stage, healthScore, leadsDelivered, ... }
// GET /api/clients/:id
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

const CLIENT_STAGES = [
  "New Inquiry", "Discovery Call", "Proposal Sent", "Negotiation",
  "Contract Signed", "Onboarding", "Active Project", "Delivery", "Renewal / Upsell",
];

module.exports = withErrorHandling(async (req, res) => {
  const { id } = req.query;

  if (req.method === "GET") {
    const rows = await db.select("clients", { filter: `id=eq.${id}` });
    if (!rows[0]) return json(res, 404, { error: "Client not found" });
    return json(res, 200, { client: rows[0] });
  }

  if (req.method === "PATCH") {
    const b = readBody(req);
    const rows = await db.select("clients", { filter: `id=eq.${id}` });
    const before = rows[0];
    if (!before) return json(res, 404, { error: "Client not found" });

    const patch = {};
    if (b.stage && CLIENT_STAGES.includes(b.stage)) patch.stage = b.stage;
    if (b.healthScore != null) patch.health_score = b.healthScore;
    if (b.leadsDelivered != null) patch.leads_delivered = b.leadsDelivered;
    if (b.contractValue != null) patch.contract_value = b.contractValue;
    if (b.renewalProbability != null) patch.renewal_probability = b.renewalProbability;

    const [updated] = await db.update("clients", `id=eq.${id}`, patch);

    // Stage-change automations, mirroring Part 5 of the blueprint.
    if (patch.stage && patch.stage !== before.stage) {
      if (patch.stage === "Proposal Sent") {
        await db.insert("proposals", [{ client_id: id, content: "", value: updated.contract_value, status: "Draft" }]);
        await db.insert("agent_activity_log", [{ action: "proposal_auto_drafted", entity_type: "client", entity_id: id }]);
      }
      if (patch.stage === "Contract Signed") {
        await db.insert("agent_activity_log", [{ action: "project_plan_generated", entity_type: "client", entity_id: id }]);
      }
    }

    return json(res, 200, { client: updated });
  }

  methodNotAllowed(res, ["GET", "PATCH"]);
});
