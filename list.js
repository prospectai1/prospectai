// Minimal Apollo.io API client via plain fetch — no SDK dependency.
// Docs: https://docs.apollo.io/reference/people-search

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const SEARCH_URL = "https://api.apollo.io/api/v1/mixed_people/search";

// params: { titles: string[], industries: string[], employeeRanges: string[], perPage }
async function searchPeople(params) {
  if (!APOLLO_API_KEY) {
    const err = new Error("Server is missing APOLLO_API_KEY. Set it in Vercel -> Settings -> Environment Variables.");
    err.statusCode = 500;
    throw err;
  }

  const body = {
    api_key: APOLLO_API_KEY, // Apollo also accepts this via the X-Api-Key header; sent both ways for compatibility across API versions
    page: 1,
    per_page: params.perPage || 10,
  };
  if (params.titles && params.titles.length) body.person_titles = params.titles;
  if (params.industries && params.industries.length) body.q_organization_industry_tag_ids = params.industries;
  if (params.employeeRanges && params.employeeRanges.length) body.organization_num_employees_ranges = params.employeeRanges;
  if (params.keywords) body.q_keywords = params.keywords;

  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": APOLLO_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || `Apollo API error (${res.status})`);
    err.statusCode = res.status === 401 || res.status === 403 ? 502 : 500;
    err.details = data;
    throw err;
  }
  return data.people || [];
}

module.exports = { searchPeople };
