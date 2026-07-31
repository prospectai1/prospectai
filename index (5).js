// POST /api/outreach/send
// Body: { messageId }
// Enforces every guardrail from the build spec's Section 6 before actually
// sending: suppression list, daily send cap (warm-up throttle), and a
// deliverability circuit breaker that blocks all sends once acknowledged
// thresholds are crossed.

const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const db = require("../_lib/supabase");
const { sendEmail } = require("../_lib/resend");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { messageId } = readBody(req);
  if (!messageId) return json(res, 400, { error: "messageId is required" });

  const messages = await db.select("outreach_messages", { filter: `id=eq.${messageId}` });
  const message = messages[0];
  if (!message) return json(res, 404, { error: "Message not found" });

  const contacts = await db.select("contacts", { filter: `id=eq.${message.contact_id}` });
  const contact = contacts[0];
  if (!contact || !contact.email) return json(res, 400, { error: "Contact has no email on file" });

  const [dlv] = await db.select("deliverability", { filter: "id=eq.1" });
  if (dlv.sends_blocked) {
    return json(res, 423, { error: "Sending is blocked: bounce/spam-complaint threshold was crossed. Acknowledge the alert before sending more (Settings)." });
  }
  if (dlv.sent_today >= dlv.daily_cap) {
    return json(res, 423, { error: `Daily send cap (${dlv.daily_cap}) reached — this is the warm-up throttle from Section 6 of the build spec.` });
  }

  const suppressed = await db.select("suppression_list", { filter: `email=eq.${encodeURIComponent(contact.email)}` });
  if (suppressed.length) {
    return json(res, 423, { error: `${contact.email} is on the suppression list (${suppressed[0].reason}). Send blocked.` });
  }

  const result = await sendEmail({ to: contact.email, subject: message.subject, text: message.body });

  const [updatedMessage] = await db.update("outreach_messages", `id=eq.${messageId}`, {
    status: "sent",
    sent_at: new Date().toISOString(),
    resend_email_id: result.id || null,
  });

  await db.update("deliverability", "id=eq.1", { sent_today: dlv.sent_today + 1 });

  if (["New", "Enriched", "Scored"].includes(contact.status)) {
    await db.update("contacts", `id=eq.${contact.id}`, { status: "In Outreach" });
  }

  await db.insert("agent_activity_log", [{ action: "outreach_sent", entity_type: "contact", entity_id: contact.id, details: { messageId, resendId: result.id } }]);

  json(res, 200, { message: updatedMessage, resend: result });
});
