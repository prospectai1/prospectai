// PATCH /api/invoices/:id  { status: "Sent" | "Paid" }
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "PATCH") return methodNotAllowed(res, ["PATCH"]);
  const { id } = req.query;
  const { status } = readBody(req);
  if (!["Draft", "Sent", "Paid", "Overdue"].includes(status)) return json(res, 400, { error: "Invalid status" });
  const [updated] = await db.update("invoices", `id=eq.${id}`, { status });
  json(res, 200, { invoice: updated });
});
