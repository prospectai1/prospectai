// Vercel Edge Middleware — framework-agnostic, runs before every request.
// Gates the ENTIRE site (frontend pages + /api routes) behind a single
// shared username/password (HTTP Basic Auth), since this is a private,
// single-firm tool with no per-user accounts.
//
// Set BASIC_AUTH_USER and BASIC_AUTH_PASS in Vercel -> Settings ->
// Environment Variables. Change them any time; no redeploy needed if you
// only edit env vars marked to apply immediately (Vercel may ask you to
// redeploy — if so, just click "Redeploy" once).

export const config = {
  matcher: "/((?!_vercel).*)", // everything except Vercel's own internal assets
};

export default function middleware(request) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // If credentials aren't configured yet, fail CLOSED (block everything)
  // rather than open, so a missing env var never accidentally exposes the site.
  if (!user || !pass) {
    return new Response(
      "Site is not yet configured: BASIC_AUTH_USER / BASIC_AUTH_PASS environment variables are missing. Set them in Vercel -> Settings -> Environment Variables, then redeploy.",
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      try {
        const decoded = atob(encoded);
        const sepIndex = decoded.indexOf(":");
        const suppliedUser = decoded.slice(0, sepIndex);
        const suppliedPass = decoded.slice(sepIndex + 1);
        if (suppliedUser === user && suppliedPass === pass) {
          return; // credentials correct — let the request continue through
        }
      } catch (e) {
        // fall through to 401 below
      }
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ProspectAI", charset="UTF-8"' },
  });
}
