// GET /api/settings/team
// POST /api/settings/team  { name, email, role }
// PATCH /api/settings/team { userId, role }
const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method === "GET") {
    const users = await db.select("users", { order: "created_at.asc" });
    return json(res, 200, { users });
  }
  if (req.method === "POST") {
    const { name, email, role } = readBody(req);
    if (!name || !email) return json(res, 400, { error: "name and email are required" });
    const [user] = await db.insert("users", [{ name, email, role: role || "RESEARCHER" }]);
    return json(res, 200, { user });
  }
  if (req.method === "PATCH") {
    const { userId, role } = readBody(req);
    if (!userId || !["SUPER_ADMIN", "SALES", "RESEARCHER"].includes(role)) return json(res, 400, { error: "userId and a valid role are required" });
    const [user] = await db.update("users", `id=eq.${userId}`, { role });
    return json(res, 200, { user });
  }
  methodNotAllowed(res, ["GET", "POST", "PATCH"]);
});
