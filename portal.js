// POST /api/leads/search
// Body: { divisionId, titles?: string[], industries?: string[], keywords?: string, perPage?: number }
// Calls Apollo's People Search, upserts Company + Contact rows into Supabase,
// computes each lead's deterministic score, and logs the run.

const { withErrorHandling, readBody, json, methodNotAllowed } = require("../_lib/http");
const { searchPeople } = require("../_lib/apollo");
const db = require("../_lib/supabase");
const { computeScore, seniorityForTitle, scoreToTier, fallbackRationale } = require("../_lib/scoring");

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const body = readBody(req);
  const { divisionId, titles, industries, keywords, perPage } = body;

  if (!divisionId) return json(res, 400, { error: "divisionId is required" });

  const divisions = await db.select("divisions", { filter: `id=eq.${divisionId}` });
  const division = divisions[0];
  if (!division) return json(res, 404, { error: "Division not found" });

  const people = await searchPeople({ titles, industries, keywords, perPage: perPage || 10 });

  const created = [];
  for (const person of people) {
    const org = person.organization || {};

    // Upsert company by domain (simple existence check, then insert if missing)
    let companyId;
    const domain = org.primary_domain || org.website_url || null;
    if (domain) {
      const existing = await db.select("companies", { filter: `domain=eq.${encodeURIComponent(domain)}` });
      if (existing.length) companyId = existing[0].id;
    }
    if (!companyId) {
      const [company] = await db.insert("companies", [{
        division_id: divisionId,
        name: org.name || "Unknown Company",
        domain,
        industry: (org.industry || "").toString(),
        employee_count: org.estimated_num_employees || null,
        source: "apollo",
        apollo_org_id: org.id || null,
      }]);
      companyId = company.id;
    }

    const title = person.title || "";
    const subscores = {
      icpFit: 60, // static-ICP baseline; refine later by comparing against division.icp text if desired
      intentSignal: 30,
      seniority: seniorityForTitle(title),
      engagement: 20,
    };
    const score = computeScore(subscores, division.scoring_weights);

    const contactRow = {
      company_id: companyId,
      division_id: divisionId,
      name: [person.first_name, person.last_name].filter(Boolean).join(" ") || person.name || "Unknown",
      title,
      email: person.email || null,
      email_verified: person.email_status === "verified",
      phone: (person.phone_numbers && person.phone_numbers[0] && person.phone_numbers[0].raw_number) || null,
      linkedin_url: person.linkedin_url || null,
      apollo_person_id: person.id || null,
      signal_type: "static-icp",
      source: "Apollo people search",
      subscores,
      score,
      score_tier: scoreToTier(score),
      status: "New",
    };
    contactRow.score_rationale = fallbackRationale(contactRow, { name: contactRow.name && org.name ? org.name : "the company" }, division.name);

    const [contact] = await db.insert("contacts", [contactRow]);
    created.push(contact);
  }

  await db.insert("agent_activity_log", [{
    action: "lead_discovery",
    entity_type: "division",
    entity_id: divisionId,
    details: { count: created.length, titles, industries, keywords },
  }]);

  json(res, 200, { created: created.length, contacts: created });
});
