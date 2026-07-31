// Minimal Anthropic Messages API client via plain fetch — no SDK dependency.
// Docs: https://platform.claude.com/docs/en/api/messages

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001"; // cheap + fast, right-sized for short rationale/draft generation

async function askClaude({ system, prompt, maxTokens = 400 }) {
  if (!ANTHROPIC_API_KEY) {
    const err = new Error("Server is missing ANTHROPIC_API_KEY. Set it in Vercel -> Settings -> Environment Variables.");
    err.statusCode = 500;
    throw err;
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error((data && data.error && data.error.message) || `Anthropic API error (${res.status})`);
    err.statusCode = res.status === 401 || res.status === 403 ? 502 : 500; // don't leak our auth failure as a 401 to the caller
    err.details = data;
    throw err;
  }
  const text = (data.content || []).map((b) => b.text || "").join("").trim();
  return text;
}

module.exports = { askClaude };
