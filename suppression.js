// GET /api/proposals
// POST /api/proposals  { clientId }
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method === "GET") {
    const proposals = await db.select("proposals", { select: "*,clients(name,division_id)", order: "created_at.desc" });
    return json(res, 200, { proposals });
  }
  if (req.method === "POST") {
    const { clientId } = readBody(req);
    if (!clientId) return json(res, 400, { error: "clientId is required" });
    const clients = await db.select("clients", { filter: `id=eq.${clientId}` });
    const client = clients[0];
    if (!client) return json(res, 404, { error: "Client not found" });
    const [proposal] = await db.insert("proposals", [{ client_id: clientId, content: "", value: client.contract_value, status: "Draft" }]);
    return json(res, 200, { proposal });
  }
  methodNotAllowed(res, ["GET", "POST"]);
});
