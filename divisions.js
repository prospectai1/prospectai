/* ProspectAI — static reference constants shared by the frontend views.
   (No fake-data generators here anymore — real data comes from /api/*,
   backed by Supabase. See js/store.js.) */

const CLIENT_STAGES = [
  "New Inquiry", "Discovery Call", "Proposal Sent", "Negotiation",
  "Contract Signed", "Onboarding", "Active Project", "Delivery", "Renewal / Upsell",
];

const LEAD_STATUSES = ["New", "Enriched", "Scored", "In Outreach", "Engaged", "Meeting Booked", "Opportunity"];

const ROLES = [
  { id: "ceo", label: "CEO / Owner", scope: "company" },
  { id: "sales_head", label: "Sales Head", scope: "company" },
  { id: "bde", label: "BDE (Sales)", scope: "division" },
  { id: "delivery_pm", label: "Delivery PM", scope: "division" },
  { id: "csm", label: "Customer Success Manager", scope: "company" },
  { id: "revops", label: "RevOps Director", scope: "company" },
  { id: "client", label: "Client (Portal View)", scope: "client" },
];

const DEFAULT_SCORING_WEIGHTS = { icpFit: 0.4, intentSignal: 0.3, seniority: 0.2, engagement: 0.1 };

function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function uid(prefix){ return prefix + "_" + Math.random().toString(36).slice(2,9); }
