-- ============================================================
-- ProspectAI — Supabase schema
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run: uses "create table if not exists".
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Divisions (ICP + scoring config) ----------
create table if not exists divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text default '🧩',
  color text default '#6366f1',
  icp text default '',
  compliance text[] default '{}',
  sources text[] default '{}',
  kpi_focus text default 'Cost per qualified lead',
  scoring_weights jsonb not null default '{"icpFit":0.4,"intentSignal":0.3,"seniority":0.2,"engagement":0.1}',
  created_at timestamptz not null default now()
);

-- ---------- Companies ----------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  division_id uuid references divisions(id) on delete set null,
  name text not null,
  domain text,
  industry text,
  employee_count int,
  source text default 'apollo',
  apollo_org_id text,
  created_at timestamptz not null default now()
);

-- ---------- Contacts (the "leads") ----------
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  division_id uuid references divisions(id) on delete set null,
  name text not null,
  title text,
  email text,
  email_verified boolean default false,
  phone text,
  linkedin_url text,
  apollo_person_id text,
  signal_type text default 'static-icp', -- static-icp | intent-signal | trigger-event
  source text,
  subscores jsonb default '{"icpFit":50,"intentSignal":30,"seniority":50,"engagement":30}',
  score int default 0,
  score_tier text default 'Cold', -- Hot | Warm | Cold | Disqualified
  score_rationale text,
  status text default 'New', -- New | Enriched | Scored | In Outreach | Engaged | Meeting Booked | Opportunity
  created_at timestamptz not null default now()
);

create index if not exists idx_contacts_division on contacts(division_id);
create index if not exists idx_contacts_company on contacts(company_id);
create index if not exists idx_contacts_email on contacts(email);

-- ---------- Outreach messages ----------
create table if not exists outreach_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  channel text default 'email',
  subject text,
  body text,
  status text default 'draft', -- draft | sent | opened | replied | bounced
  resend_email_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_outreach_contact on outreach_messages(contact_id);

-- ---------- Suppression list (bounced / unsubscribed) ----------
create table if not exists suppression_list (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  reason text, -- bounced | unsubscribed | manual
  added_at timestamptz not null default now()
);

-- ---------- Lead disputes (replacement guarantee) ----------
create table if not exists lead_disputes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  reason text,
  status text default 'Open',
  created_at timestamptz not null default now()
);

-- ---------- Clients (pipeline) ----------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  division_id uuid references divisions(id) on delete set null,
  name text not null,
  tier text default 'Retainer', -- Subscription | Retainer | Performance | Enterprise
  stage text default 'New Inquiry',
  contract_value numeric default 0,
  health_score int default 70,
  sla_target_leads int default 30,
  leads_delivered int default 0,
  renewal_probability int default 60,
  csm text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_division on clients(division_id);

-- ---------- Proposals ----------
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  content text,
  value numeric default 0,
  status text default 'Draft', -- Draft | Sent | Viewed | Signed
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Invoices ----------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  amount numeric default 0,
  status text default 'Draft', -- Draft | Sent | Paid | Overdue
  due_date timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Team ----------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  role text default 'RESEARCHER', -- SUPER_ADMIN | SALES | RESEARCHER
  created_at timestamptz not null default now()
);

-- ---------- Agent activity ledger ----------
create table if not exists agent_activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Deliverability metrics (single row) ----------
create table if not exists deliverability (
  id int primary key default 1,
  sent_today int default 0,
  daily_cap int default 50,
  bounce_rate numeric default 0,
  spam_rate numeric default 0,
  sends_blocked boolean default false,
  constraint single_row check (id = 1)
);
insert into deliverability (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- Row Level Security: lock every table down completely.
-- Nothing is reachable via the public anon/publishable key.
-- All access goes through Vercel serverless functions using the
-- service_role key, which bypasses RLS by design (server-side only,
-- never shipped to the browser).
-- ============================================================
alter table divisions enable row level security;
alter table companies enable row level security;
alter table contacts enable row level security;
alter table outreach_messages enable row level security;
alter table suppression_list enable row level security;
alter table lead_disputes enable row level security;
alter table clients enable row level security;
alter table proposals enable row level security;
alter table invoices enable row level security;
alter table users enable row level security;
alter table agent_activity_log enable row level security;
alter table deliverability enable row level security;
-- No policies are created, which means: zero access via the anon key.
-- This is intentional — the site's own backend is the only door in.

-- ---------- Seed one starter division so the app isn't empty on first load ----------
insert into divisions (name, icon, color, icp, compliance, sources, kpi_focus)
select 'General', '🧩', '#6366f1', 'Describe your ideal customer profile here', '{}', '{"Apollo.io"}', 'Cost per qualified lead'
where not exists (select 1 from divisions);
