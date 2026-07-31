// Minimal Resend API client via plain fetch — no SDK dependency.
// Docs: https://resend.com/docs/api-reference/emails/send-email

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SEND_URL = "https://api.resend.com/emails";

async function sendEmail({ to, subject, text, from }) {
  if (!RESEND_API_KEY) {
    const err = new Error("Server is missing RESEND_API_KEY. Set it in Vercel -> Settings -> Environment Variables.");
    err.statusCode = 500;
    throw err;
  }
  const fromAddress = from || process.env.RESEND_FROM_ADDRESS || "ProspectAI <outreach@yourdomain.com>";

  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      text,
      headers: {
        // RFC 8058 one-click unsubscribe — required before any real send (Section 6 of the build spec).
        "List-Unsubscribe": "<mailto:unsubscribe@yourdomain.com>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && data.message) || `Resend API error (${res.status})`);
    err.statusCode = res.status === 401 || res.status === 403 ? 502 : 500;
    err.details = data;
    throw err;
  }
  return data; // { id: "..." }
}

module.exports = { sendEmail };
