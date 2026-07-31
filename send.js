// POST /api/leads/score
// Body: { contactId }
// Recomputes the deterministic score from subscores + the division's
// current weights, then asks Claude for a short plain-English rationale
// that may only reference fields already on the record.

const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");
const { askClaude } = require("../_lib/anthropic");
const { computeScore, scoreToTier, fallbackRationale } = require("../_lib/scoring");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { contactId } = readBody(req);
  if (!contactId) return json(res, 400, { error: "contactId is required" });

  const contacts = await db.select("contacts", { filter: `id=eq.${contactId}`, select: "*,companies(name,industry)" });
  const contact = contacts[0];
  if (!contact) return json(res, 404, { error: "Contact not found" });

  const divisions = await db.select("divisions", { filter: `id=eq.${contact.division_id}` });
  const division = divisions[0] || { name: "this division", scoring_weights: null };

  const score = computeScore(contact.subscores, division.scoring_weights);
  const tier = scoreToTier(score);

  const company = contact.companies || { name: "the company", industry: "" };
  let rationale;
  try {
    rationale = await askClaude({
      system:
        "You write a short, factual 2-3 sentence lead-scoring rationale for a B2B sales team. " +
        "You MUST only reference the specific field values given to you (name, title, company, industry, subscore numbers, source). " +
        "Never invent facts, news, funding events, or details not explicitly provided. If information is missing, say so plainly instead of guessing.",
      prompt:
        `Contact: ${contact.name}, title: ${contact.title || "unknown"}.\n` +
        `Company: ${company.name}, industry: ${company.industry || "unknown"}.\n` +
        `Division rubric: ${division.name}.\n` +
        `Subscores (0-100): ICP fit ${contact.subscores.icpFit}, intent signal ${contact.subscores.intentSignal}, seniority ${contact.subscores.seniority}, engagement ${contact.subscores.engagement}.\n` +
        `Lead source: ${contact.source || "not recorded"}.\n` +
        `Computed overall score: ${score}/100 (${tier}).\n` +
        `Write the rationale now.`,
      maxTokens: 200,
    });
  } catch (e) {
    // Claude call failed (bad key, rate limit, etc.) — degrade gracefully to the deterministic template rather than failing the whole request.
    rationale = fallbackRationale(contact, company, division.name) + ` (AI rationale unavailable: ${e.message})`;
  }

  const [updated] = await db.update(
    "contacts",
    `id=eq.${contactId}`,
    { score, score_tier: tier, score_rationale: rationale }
  );

  await db.insert("agent_activity_log", [{ action: "lead_rescored", entity_type: "contact", entity_id: contactId, details: { score, tier } }]);

  json(res, 200, { contact: updated });
});
