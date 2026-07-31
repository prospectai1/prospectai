// GET /api/settings/deliverability
// POST /api/settings/deliverability/acknowledge  (handled here via body.action="acknowledge")
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method === "GET") {
    const [dlv] = await db.select("deliverability", { filter: "id=eq.1" });
    return json(res, 200, { deliverability: dlv });
  }
  if (req.method === "POST") {
    const { action } = readBody(req);
    if (action === "acknowledge") {
      const [dlv] = await db.update("deliverability", "id=eq.1", { sends_blocked: false, bounce_rate: 0.4, spam_rate: 0.05 });
      return json(res, 200, { deliverability: dlv });
    }
    return json(res, 400, { error: "Unknown action" });
  }
  methodNotAllowed(res, ["GET", "POST"]);
});
