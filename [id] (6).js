// Small helpers shared by every /api function.

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

// Wraps a handler so thrown errors become clean JSON error responses
// instead of a raw 500 with an HTML stack trace.
function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      const status = err.statusCode || 500;
      // eslint-disable-next-line no-console
      console.error("API error:", err.message, err.details || "");
      json(res, status, { error: err.message || "Internal server error" });
    }
  };
}

function readBody(req) {
  // Vercel Node functions already parse JSON bodies into req.body for
  // Content-Type: application/json, but guard for edge cases.
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; }
}

function methodNotAllowed(res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  json(res, 405, { error: `Method not allowed. Use: ${allowed.join(", ")}` });
}

module.exports = { json, withErrorHandling, readBody, methodNotAllowed };
