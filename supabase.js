// GET /api/activity/list?limit=30
const { withErrorHandling, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

const ICONS = {
  lead_discovery: "🧲", lead_rescored: "🎯", outreach_drafted: "✉️", outreach_sent: "✉️",
  proposal_auto_drafted: "📄", project_plan_generated: "📋", weights_updated: "🎯",
};
const LABELS = {
  lead_discovery: "Lead Discovery Agent", lead_rescored: "Lead Qualification Agent",
  outreach_drafted: "Outreach Agent", outreach_sent: "Outreach Agent",
  proposal_auto_drafted: "Proposal Agent", project_plan_generated: "Project Management Agent",
  weights_updated: "Lead Qualification Agent",
};
const TEXT = {
  lead_discovery: (d) => `sourced ${(d && d.count) || 0} new lead(s)`,
  lead_rescored: (d) => `re-scored a lead — ${(d && d.score) || "?"}/100 (${(d && d.tier) || "?"})`,
  outreach_drafted: () => `drafted an outreach email`,
  outreach_sent: () => `sent an outreach email`,
  proposal_auto_drafted: () => `auto-drafted a proposal`,
  project_plan_generated: () => `generated a project plan`,
  weights_updated: (d) => `recomputed ${(d && d.recomputed) || 0} lead score(s) after a weights change`,
};

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const limit = req.query.limit || "20";
  const rows = await db.select("agent_activity_log", { order: "created_at.desc", limit });
  const feed = rows.map((r) => ({
    id: r.id,
    icon: ICONS[r.action] || "🤖",
    agentName: LABELS[r.action] || "Agent",
    text: (TEXT[r.action] ? TEXT[r.action](r.details) : r.action),
    timestamp: r.created_at,
  }));
  json(res, 200, { activity: feed });
});
