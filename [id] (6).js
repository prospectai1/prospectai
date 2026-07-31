// Deterministic lead scoring — the number itself is plain arithmetic
// (never an LLM call), so every score is auditable. Only the plain-English
// rationale alongside it comes from Claude, and only ever references the
// real field values passed in — never invented facts.

const DEFAULT_WEIGHTS = { icpFit: 0.4, intentSignal: 0.3, seniority: 0.2, engagement: 0.1 };

const TITLE_SENIORITY = [
  { pattern: /\b(ceo|coo|cfo|cmo|cto|cio|chief|president|founder|owner)\b/i, score: 95 },
  { pattern: /\bvp\b|vice president/i, score: 82 },
  { pattern: /\bdirector\b/i, score: 70 },
  { pattern: /\bhead of\b/i, score: 74 },
  { pattern: /\bmanager\b|\blead\b/i, score: 55 },
];

function seniorityForTitle(title) {
  if (!title) return 40;
  const match = TITLE_SENIORITY.find((t) => t.pattern.test(title));
  return match ? match.score : 40;
}

function scoreToTier(score) {
  if (score >= 70) return "Hot";
  if (score >= 40) return "Warm";
  if (score >= 15) return "Cold";
  return "Disqualified";
}

function computeScore(subscores, weights) {
  const w = weights || DEFAULT_WEIGHTS;
  const raw =
    subscores.icpFit * w.icpFit +
    subscores.intentSignal * w.intentSignal +
    subscores.seniority * w.seniority +
    subscores.engagement * w.engagement;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

// Template-based fallback rationale (used if the Claude call fails or is
// skipped) — still references only the real fields passed in.
function fallbackRationale(contact, company, divisionName) {
  const s = contact.subscores;
  return `${contact.name} (${contact.title || "unknown title"} at ${company.name}) scores ${s.icpFit}/100 on ICP fit for the ${divisionName} rubric, ${s.intentSignal}/100 on intent signal (${contact.source || "source not recorded"}), ${s.seniority}/100 on title-based seniority, and ${s.engagement}/100 on recorded engagement. No unverified claims included.`;
}

module.exports = { DEFAULT_WEIGHTS, seniorityForTitle, scoreToTier, computeScore, fallbackRationale };
