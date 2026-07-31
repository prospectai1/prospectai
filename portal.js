// POST /api/outreach/draft
// Body: { contactId, offer }
// Claude drafts subject + body personalized only from verified fields
// (name, title, company). Unsubscribe footer is appended in code afterward
// — never left to the model — matching the build spec's hard requirement.

const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");
const { askClaude } = require("../_lib/anthropic");

const UNSUB_EMAIL = process.env.UNSUBSCRIBE_EMAIL || "unsubscribe@yourdomain.com";
const UNSUB_FOOTER =
  `\n\n---\nYou're receiving this because your profile matched an active campaign. ` +
  `To unsubscribe, reply STOP or email ${UNSUB_EMAIL} (honored immediately).`;

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { contactId, offer } = readBody(req);
  if (!contactId) return json(res, 400, { error: "contactId is required" });

  const contacts = await db.select("contacts", { filter: `id=eq.${contactId}`, select: "*,companies(name)" });
  const contact = contacts[0];
  if (!contact) return json(res, 404, { error: "Contact not found" });
  const companyName = (contact.companies && contact.companies.name) || "your company";

  let subject = `Quick question for ${companyName}`;
  let bodyText;
  try {
    const draft = await askClaude({
      system:
        "You draft short, plain, professional first-touch B2B cold emails. " +
        "Personalize ONLY using the exact name, title, and company given to you. " +
        "NEVER invent specific facts about the company or person — no funding rounds, news, hires, or events unless explicitly given. " +
        "Keep it under 90 words. Output format exactly:\nSUBJECT: <subject line>\nBODY: <email body>",
      prompt:
        `Contact name: ${contact.name}\nTitle: ${contact.title || "unknown"}\nCompany: ${companyName}\n` +
        `What we're offering: ${offer || "a way to improve pipeline quality"}\n` +
        `Write the email now.`,
      maxTokens: 300,
    });
    const subjMatch = draft.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = draft.match(/BODY:\s*([\s\S]+)/i);
    if (subjMatch) subject = subjMatch[1].trim();
    bodyText = bodyMatch ? bodyMatch[1].trim() : draft.trim();
  } catch (e) {
    bodyText =
      `Hi ${contact.name.split(" ")[0]},\n\nI work with teams like ${companyName} on ${offer || "improving pipeline quality"}. ` +
      `Given your role as ${contact.title || "a decision-maker"}, thought it was worth a quick note.\n\n` +
      `Open to a 15-minute call this week?\n\nBest,\nProspectAI\n\n(AI draft unavailable, used template fallback: ${e.message})`;
  }

  const finalBody = bodyText + UNSUB_FOOTER;

  const [message] = await db.insert("outreach_messages", [{
    contact_id: contactId,
    channel: "email",
    subject,
    body: finalBody,
    status: "draft",
  }]);

  await db.insert("agent_activity_log", [{ action: "outreach_drafted", entity_type: "contact", entity_id: contactId, details: { messageId: message.id } }]);

  json(res, 200, { message });
});
