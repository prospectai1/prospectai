// PATCH /api/proposals/:id  — advances Draft -> Sent -> Viewed -> Signed.
// Signing a proposal also moves the linked client to "Contract Signed".
const { withErrorHandling, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

const ORDER = ["Draft", "Sent", "Viewed", "Signed"];

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "PATCH") return methodNotAllowed(res, ["PATCH"]);
  const { id } = req.query;
  const rows = await db.select("proposals", { filter: `id=eq.${id}` });
  const proposal = rows[0];
  if (!proposal) return json(res, 404, { error: "Proposal not found" });

  const idx = ORDER.indexOf(proposal.status);
  if (idx >= ORDER.length - 1) return json(res, 200, { proposal }); // already Signed
  const nextStatus = ORDER[idx + 1];

  const patch = { status: nextStatus };
  if (nextStatus === "Sent") patch.sent_at = new Date().toISOString();
  const [updated] = await db.update("proposals", `id=eq.${id}`, patch);

  if (nextStatus === "Signed") {
    await db.update("clients", `id=eq.${proposal.client_id}`, { stage: "Contract Signed" });
    await db.insert("agent_activity_log", [{ action: "project_plan_generated", entity_type: "client", entity_id: proposal.client_id }]);
  }

  json(res, 200, { proposal: updated });
});
