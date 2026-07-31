// GET /api/invoices?divisionId=<optional>
// POST /api/invoices  { clientId, amount, dueInDays }
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method === "GET") {
    const invoices = await db.select("invoices", { select: "*,clients(name,division_id)", order: "created_at.desc" });
    return json(res, 200, { invoices });
  }
  if (req.method === "POST") {
    const b = readBody(req);
    if (!b.clientId || !b.amount) return json(res, 400, { error: "clientId and amount are required" });
    const due = new Date();
    due.setDate(due.getDate() + (b.dueInDays || 30));
    const [invoice] = await db.insert("invoices", [{
      client_id: b.clientId,
      amount: b.amount,
      status: "Draft",
      due_date: due.toISOString(),
    }]);
    return json(res, 200, { invoice });
  }
  methodNotAllowed(res, ["GET", "POST"]);
});
