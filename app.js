/* ProspectAI — real backend-backed state store.
   Replaces the old localStorage demo store: this one calls /api/* (which
   talks to Supabase, Apollo, Anthropic, Resend) and keeps an in-memory
   cache that views render from. Same subscribe/emit/get() shape as before,
   so app.js and the view files barely had to change. */

const Store = (function () {
  let state = {
    divisions: [], leads: [], clients: [], proposals: [], invoices: [],
    users: [], agentLog: [], disputes: [], suppressionList: [], outreachMessages: [],
    deliverability: { sentToday: 0, dailyCap: 50, bounceRate: 0, spamRate: 0, sendsBlocked: false, spfDkimDmarc: true },
    currentRole: "ceo",
    currentDivisionFilter: "all",
    loading: true,
    lastError: null,
  };
  const listeners = [];

  function emit() { listeners.forEach((fn) => fn(state)); }
  function subscribe(fn) { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1); }; }
  function get() { return state; }

  function toast(msg, isError) {
    const host = document.getElementById("toast-host");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "toast";
    if (isError) el.style.borderLeftColor = "var(--red)";
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 300); }, isError ? 5000 : 3200);
  }

  async function api(path, opts) {
    const res = await fetch(path, {
      method: (opts && opts.method) || "GET",
      headers: { "Content-Type": "application/json" },
      body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data;
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) {
      const message = data.error || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data;
  }

  async function guarded(fn, errorLabel) {
    try {
      return await fn();
    } catch (e) {
      state.lastError = e.message;
      toast(`${errorLabel || "Something went wrong"}: ${e.message}`, true);
      emit();
      throw e;
    }
  }

  // ---- Mappers: Postgres/API row shape -> the shape the views expect ----

  function mapDivision(d) {
    const clients = state.clients.filter((c) => c.divisionId === d.id);
    return {
      id: d.id, name: d.name, icon: d.icon, color: d.color, icp: d.icp,
      compliance: d.compliance || [], sources: d.sources || [], kpiFocus: d.kpi_focus,
      scoringWeights: d.scoring_weights || DEFAULT_SCORING_WEIGHTS,
      geographies: ["—"],
      arr: clients.reduce((s, c) => s + (c.contractValue || 0), 0),
      activeClients: clients.length,
    };
  }

  function mapContact(c) {
    return {
      id: c.id,
      divisionId: c.division_id,
      company: (c.companies && c.companies.name) || "Unknown company",
      contactName: c.name,
      email: c.email,
      title: c.title || "",
      source: c.source || "",
      signalType: c.signal_type || "static-icp",
      subscores: c.subscores || { icpFit: 0, intentSignal: 0, seniority: 0, engagement: 0 },
      score: c.score,
      tier: c.score_tier,
      scoreRationale: c.score_rationale,
      status: c.status,
      emailVerified: c.email_verified,
      createdAt: c.created_at,
    };
  }

  function mapClient(c) {
    const health = c.health_score;
    return {
      id: c.id, divisionId: c.division_id, name: c.name, tier: c.tier, stage: c.stage,
      contractValue: Number(c.contract_value) || 0,
      healthScore: health, healthBand: health >= 70 ? "Green" : health >= 45 ? "Yellow" : "Red",
      slaTarget: c.sla_target_leads, leadsDelivered: c.leads_delivered,
      csm: c.csm || "Unassigned", renewalProbability: c.renewal_probability,
      createdAt: c.created_at,
    };
  }

  function mapProposal(p) {
    return {
      id: p.id, clientId: p.client_id,
      clientName: (p.clients && p.clients.name) || "",
      divisionId: (p.clients && p.clients.division_id) || null,
      value: Number(p.value) || 0, status: p.status, createdAt: p.created_at,
    };
  }

  function mapUser(u) {
    return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.created_at };
  }

  function mapInvoice(i) {
    return {
      id: i.id, clientId: i.client_id,
      clientName: (i.clients && i.clients.name) || "",
      divisionId: (i.clients && i.clients.division_id) || null,
      amount: Number(i.amount) || 0, status: i.status, dueDate: i.due_date, createdAt: i.created_at,
    };
  }

  // ---- Initial load ----

  async function loadAll() {
    state.loading = true; emit();
    await guarded(async () => {
      const [divRes, clientsRes, proposalsRes, invoicesRes, usersRes, activityRes, suppRes, dlvRes, disputesRes, outreachRes] = await Promise.all([
        api("/api/divisions"),
        api("/api/clients"),
        api("/api/proposals"),
        api("/api/invoices"),
        api("/api/settings/team"),
        api("/api/activity/list?limit=30"),
        api("/api/settings/suppression"),
        api("/api/settings/deliverability"),
        api("/api/leads/disputes"),
        api("/api/outreach/list"),
      ]);
      state.disputes = disputesRes.disputes.map((d) => ({ id: d.id, leadId: d.contact_id, reason: d.reason, status: d.status, createdAt: d.created_at }));
      state.outreachMessages = outreachRes.messages.map((m) => ({ id: m.id, leadId: m.contact_id, status: m.status, subject: m.subject, sentAt: m.sent_at, createdAt: m.created_at }));
      state.clients = clientsRes.clients.map(mapClient);
      state.divisions = divRes.divisions.map(mapDivision);
      state.proposals = proposalsRes.proposals.map(mapProposal);
      state.invoices = invoicesRes.invoices.map(mapInvoice);
      state.users = usersRes.users.map(mapUser);
      state.agentLog = activityRes.activity;
      state.suppressionList = suppRes.suppression;
      state.deliverability = {
        sentToday: dlvRes.deliverability.sent_today, dailyCap: dlvRes.deliverability.daily_cap,
        bounceRate: Number(dlvRes.deliverability.bounce_rate), spamRate: Number(dlvRes.deliverability.spam_rate),
        sendsBlocked: dlvRes.deliverability.sends_blocked, spfDkimDmarc: true,
      };
      await refreshLeads();
    }, "Failed to load data");
    state.loading = false;
    emit();
  }

  async function refreshLeads() {
    const divId = state.currentDivisionFilter;
    const qs = divId && divId !== "all" ? `?divisionId=${divId}` : "";
    const res = await api(`/api/leads/list${qs}`);
    state.leads = res.contacts.map(mapContact);
  }

  async function refreshActivity() {
    const res = await api("/api/activity/list?limit=30");
    state.agentLog = res.activity;
  }

  // ---- Role / filter (client-side only, no API call) ----

  function setRole(roleId) { state.currentRole = roleId; emit(); }

  async function setDivisionFilter(divId) {
    state.currentDivisionFilter = divId;
    emit();
    await guarded(async () => { await refreshLeads(); emit(); }, "Failed to refresh leads");
  }

  // ---- Leads / Apollo / scoring ----

  async function runLeadDiscovery(divisionId, opts) {
    return guarded(async () => {
      const body = { divisionId, titles: (opts && opts.titles) || [], industries: (opts && opts.industries) || [], keywords: opts && opts.keywords, perPage: (opts && opts.perPage) || 10 };
      const res = await api("/api/leads/search", { method: "POST", body });
      toast(`Apollo search added ${res.created} lead(s)`);
      await refreshLeads(); await refreshActivity();
      emit();
      return res;
    }, "Lead Discovery failed");
  }

  async function rescoreOneLead(leadId) {
    return guarded(async () => {
      const res = await api("/api/leads/score", { method: "POST", body: { contactId: leadId } });
      await refreshLeads(); await refreshActivity();
      toast(`Re-scored — ${res.contact.score}/100 (${res.contact.score_tier})`);
      emit();
      return res;
    }, "Scoring failed");
  }

  async function runQualificationPass(divisionId) {
    return guarded(async () => {
      const newLeads = state.leads.filter((l) => l.divisionId === divisionId && l.status === "New");
      for (const l of newLeads) { await api("/api/leads/score", { method: "POST", body: { contactId: l.id } }); }
      await refreshLeads(); await refreshActivity();
      toast(`Qualification pass scored ${newLeads.length} lead(s)`);
      emit();
    }, "Qualification pass failed");
  }

  async function moveLead(leadId, newStatus) {
    return guarded(async () => {
      await api("/api/leads/status", { method: "POST", body: { contactId: leadId, status: newStatus } });
      await refreshLeads();
      emit();
    }, "Failed to update lead status");
  }

  async function disputeLead(leadId, reason) {
    return guarded(async () => {
      await api("/api/leads/dispute", { method: "POST", body: { contactId: leadId, reason } });
      const disputesRes = await api("/api/leads/disputes");
      state.disputes = disputesRes.disputes.map((d) => ({ id: d.id, leadId: d.contact_id, reason: d.reason, status: d.status, createdAt: d.created_at }));
      toast("Lead dispute filed — replacement SLA clock started (5 business days).");
      emit();
    }, "Failed to file dispute");
  }

  // ---- Outreach ----

  async function draftOutreach(leadId, offer) {
    return guarded(async () => {
      const res = await api("/api/outreach/draft", { method: "POST", body: { contactId: leadId, offer } });
      toast("Outreach draft created (unsubscribe footer auto-injected)");
      await refreshActivity();
      emit();
      return res.message;
    }, "Drafting outreach failed");
  }

  async function listOutreachForLead(leadId) {
    return guarded(async () => {
      const res = await api(`/api/outreach/list?contactId=${leadId}`);
      return res.messages;
    }, "Failed to load outreach history");
  }

  async function sendOutreach(messageId) {
    try {
      const res = await api("/api/outreach/send", { method: "POST", body: { messageId } });
      toast(`Sent to lead successfully`);
      await refreshLeads(); await refreshActivity();
      const dlvRes = await api("/api/settings/deliverability");
      state.deliverability = {
        sentToday: dlvRes.deliverability.sent_today, dailyCap: dlvRes.deliverability.daily_cap,
        bounceRate: Number(dlvRes.deliverability.bounce_rate), spamRate: Number(dlvRes.deliverability.spam_rate),
        sendsBlocked: dlvRes.deliverability.sends_blocked, spfDkimDmarc: true,
      };
      emit();
      return { ok: true, ...res };
    } catch (e) {
      toast(e.message, true);
      emit();
      return { ok: false, reason: e.message };
    }
  }

  async function unsubscribeContact(email) {
    return guarded(async () => {
      await api("/api/outreach/unsubscribe", { method: "POST", body: { email } });
      const suppRes = await api("/api/settings/suppression");
      state.suppressionList = suppRes.suppression;
      toast(`${email} added to the suppression list`);
      emit();
    }, "Failed to add to suppression list");
  }

  async function acknowledgeDeliverabilityAlert() {
    return guarded(async () => {
      const res = await api("/api/settings/deliverability", { method: "POST", body: { action: "acknowledge" } });
      state.deliverability = {
        sentToday: res.deliverability.sent_today, dailyCap: res.deliverability.daily_cap,
        bounceRate: Number(res.deliverability.bounce_rate), spamRate: Number(res.deliverability.spam_rate),
        sendsBlocked: res.deliverability.sends_blocked, spfDkimDmarc: true,
      };
      toast("Deliverability alert acknowledged — sending resumed.");
      emit();
    }, "Failed to acknowledge alert");
  }

  // ---- Clients / pipeline ----

  async function moveClientStage(clientId, newStage) {
    return guarded(async () => {
      await api(`/api/clients/${clientId}`, { method: "PATCH", body: { stage: newStage } });
      await Promise.all([refreshClients(), refreshProposalsList(), refreshActivity()]);
      emit();
    }, "Failed to move client stage");
  }

  async function refreshClients() {
    const res = await api("/api/clients");
    state.clients = res.clients.map(mapClient);
    state.divisions = state.divisions.map((d) => mapDivision({
      id: d.id, name: d.name, icon: d.icon, color: d.color, icp: d.icp,
      compliance: d.compliance, sources: d.sources, kpi_focus: d.kpiFocus, scoring_weights: d.scoringWeights,
    }));
  }

  async function refreshProposalsList() {
    const res = await api("/api/proposals");
    state.proposals = res.proposals.map(mapProposal);
  }

  async function createDivision(payload) {
    return guarded(async () => {
      const res = await api("/api/divisions", { method: "POST", body: payload });
      state.divisions.push(mapDivision(res.division));
      toast(`Division "${payload.name}" created`);
      emit();
      return res.division;
    }, "Failed to create division");
  }

  async function createProposal(clientId) {
    return guarded(async () => {
      const res = await api("/api/proposals", { method: "POST", body: { clientId } });
      await refreshProposalsList();
      toast("Proposal drafted");
      emit();
      return res.proposal;
    }, "Failed to create proposal");
  }

  async function advanceProposal(proposalId) {
    return guarded(async () => {
      await api(`/api/proposals/${proposalId}`, { method: "PATCH", body: {} });
      await Promise.all([refreshProposalsList(), refreshClients()]);
      emit();
    }, "Failed to advance proposal");
  }

  // ---- Invoices ----

  async function createInvoice(clientId, amount, dueInDays) {
    return guarded(async () => {
      await api("/api/invoices", { method: "POST", body: { clientId, amount, dueInDays } });
      const res = await api("/api/invoices");
      state.invoices = res.invoices.map(mapInvoice);
      toast("Invoice created");
      emit();
    }, "Failed to create invoice");
  }

  async function markInvoicePaid(invoiceId) {
    return guarded(async () => {
      await api(`/api/invoices/${invoiceId}`, { method: "PATCH", body: { status: "Paid" } });
      const res = await api("/api/invoices");
      state.invoices = res.invoices.map(mapInvoice);
      emit();
    }, "Failed to update invoice");
  }

  async function advanceInvoice(invoiceId) {
    return guarded(async () => {
      const inv = state.invoices.find((i) => i.id === invoiceId);
      const next = inv.status === "Draft" ? "Sent" : "Paid";
      await api(`/api/invoices/${invoiceId}`, { method: "PATCH", body: { status: next } });
      const res = await api("/api/invoices");
      state.invoices = res.invoices.map(mapInvoice);
      emit();
    }, "Failed to advance invoice");
  }

  // ---- Settings: scoring weights + team ----

  async function updateDivisionWeights(divisionId, weights) {
    return guarded(async () => {
      const res = await api("/api/settings/weights", { method: "PATCH", body: { divisionId, weights } });
      await refreshLeads();
      const div = state.divisions.find((d) => d.id === divisionId);
      if (div) div.scoringWeights = res.weights;
      toast(`Scoring weights updated — ${res.recomputed} lead(s) recomputed`);
      emit();
    }, "Failed to update scoring weights");
  }

  async function inviteUser(payload) {
    return guarded(async () => {
      const res = await api("/api/settings/team", { method: "POST", body: payload });
      const user = mapUser(res.user);
      state.users.push(user);
      toast(`Invited ${user.name} (${user.role})`);
      emit();
      return user;
    }, "Failed to invite user");
  }

  async function updateUserRole(userId, role) {
    return guarded(async () => {
      await api("/api/settings/team", { method: "PATCH", body: { userId, role } });
      const u = state.users.find((u) => u.id === userId);
      if (u) u.role = role;
      emit();
    }, "Failed to update role");
  }

  function resetDemo() {
    toast("This is a live system backed by your real database — there's no demo data to reset. Delete rows directly in Supabase if you need to clear test data.");
  }

  function simulateAgentTick() { /* no-op: activity now reflects only real actions */ }

  return {
    get, subscribe, toast, loadAll,
    setRole, setDivisionFilter,
    runLeadDiscovery, runQualificationPass, rescoreOneLead, moveLead, disputeLead,
    draftOutreach, listOutreachForLead, sendOutreach, unsubscribeContact, acknowledgeDeliverabilityAlert,
    moveClientStage, createDivision, createProposal, advanceProposal,
    createInvoice, markInvoicePaid, advanceInvoice,
    updateDivisionWeights, inviteUser, updateUserRole,
    resetDemo, simulateAgentTick,
  };
})();
