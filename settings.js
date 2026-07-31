// PATCH /api/settings/weights   { divisionId, weights: {icpFit,intentSignal,seniority,engagement} }
// Updates a division's scoring weights and recomputes every one of its
// leads' scores immediately (weights are normalized to sum to 1 first).
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");
const { computeScore, scoreToTier } = require("../_lib/scoring");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "PATCH") return methodNotAllowed(res, ["PATCH"]);
  const { divisionId, weights } = readBody(req);
  if (!divisionId || !weights) return json(res, 400, { error: "divisionId and weights are required" });

  const sum = ["icpFit", "intentSignal", "seniority", "engagement"].reduce((s, k) => s + (weights[k] || 0), 0) || 1;
  const normalized = {
    icpFit: weights.icpFit / sum,
    intentSignal: weights.intentSignal / sum,
    seniority: weights.seniority / sum,
    engagement: weights.engagement / sum,
  };

  await db.update("divisions", `id=eq.${divisionId}`, { scoring_weights: normalized });

  const contacts = await db.select("contacts", { filter: `division_id=eq.${divisionId}`, select: "id,subscores" });
  let n = 0;
  for (const c of contacts) {
    const score = computeScore(c.subscores, normalized);
    await db.update("contacts", `id=eq.${c.id}`, { score, score_tier: scoreToTier(score) });
    n++;
  }

  await db.insert("agent_activity_log", [{ action: "weights_updated", entity_type: "division", entity_id: divisionId, details: { normalized, recomputed: n } }]);

  json(res, 200, { weights: normalized, recomputed: n });
});
