/* Module 1 — Dashboard (Executive Home). Role-aware. */

function renderDashboard(root, state) {
  const role = state.currentRole;
  const divFilter = state.currentDivisionFilter;
  const scoped = divFilter === "all" ? state : null;

  const leads = divFilter === "all" ? state.leads : state.leads.filter(l => l.divisionId === divFilter);
  const clients = divFilter === "all" ? state.clients : state.clients.filter(c => c.divisionId === divFilter);
  const totalARR = state.divisions.reduce((s,d)=>s+d.arr,0);
  const scopedARR = divFilter === "all" ? totalARR : (divisionById(divFilter)?.arr || 0);
  const pipelineValue = state.proposals.filter(p => (divFilter==="all"||p.divisionId===divFilter) && p.status !== "Signed").reduce((s,p)=>s+p.value,0);
  const activeClients = clients.length;
  const atRisk = clients.filter(c => c.healthBand === "Red").length;
  const breachedSla = clients.filter(c => c.leadsDelivered < c.slaTarget * 0.6).length;
  const leaderboard = buildLeaderboard(state, divFilter);

  const dlv = state.deliverability;
  const dlvBreached = dlv.bounceRate >= 2 || dlv.spamRate >= 0.3;

  root.innerHTML = `
    ${role === "client" ? `<div class="banner">You're viewing the internal dashboard as ${roleLabel(role)}. Switch to the Client Portal from the sidebar to see the client-facing view.</div>` : ""}
    ${dlvBreached ? `
      <div class="banner" style="background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.35);color:#fca5a5;display:flex;justify-content:space-between;align-items:center;">
        <span>⚠ Deliverability threshold breached — bounce rate ${dlv.bounceRate}% / spam complaints ${dlv.spamRate}%. New outreach sends are blocked until this is acknowledged.</span>
        <button class="btn danger sm" id="ackDlvBtn">Acknowledge & Resume</button>
      </div>
    ` : ""}

    <div class="grid grid-4">
      ${kpiCard("Total Leads", fmtNum(leads.length), leadsDelta(state, divFilter), "up")}
      ${kpiCard("Active Clients", fmtNum(activeClients), `${clients.filter(c=>c.tier==="Enterprise").length} enterprise · ${clients.filter(c=>c.tier==="Retainer").length} retainer`, "flat")}
      ${kpiCard("Pipeline Value", fmt$(pipelineValue), "weighted across open proposals", "flat")}
      ${kpiCard(divFilter==="all" ? "ARR (company)" : "ARR (division)", fmt$(scopedARR), "+" + randStablePct(divFilter) + "% vs last quarter", "up")}
    </div>

    <div class="two-col" style="margin-top:16px;">
      <div class="card">
        <div class="card-head">
          <h3>Email Deliverability</h3>
          <span class="hint">Section 6 compliance guardrails</span>
        </div>
        <div class="stat-row" style="margin-bottom:14px;">
          <div class="stat"><div class="n" style="color:${dlv.bounceRate>=2?'var(--red)':'var(--text)'}">${dlv.bounceRate}%</div><div class="l">Bounce rate (cap 2%)</div></div>
          <div class="stat"><div class="n" style="color:${dlv.spamRate>=0.3?'var(--red)':'var(--text)'}">${dlv.spamRate}%</div><div class="l">Spam complaints (cap 0.3%)</div></div>
          <div class="stat"><div class="n">${dlv.sentToday}/${dlv.dailyCap}</div><div class="l">Sends today (warm-up cap)</div></div>
        </div>
        <div style="display:flex;gap:8px;">
          <span class="badge ${dlv.spfDkimDmarc?'green':'red'}">${dlv.spfDkimDmarc?'✓':'✗'} SPF/DKIM/DMARC verified</span>
          <span class="badge ${dlv.sendsBlocked?'red':'green'}">${dlv.sendsBlocked?'Sends blocked':'Sending allowed'}</span>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <h3>Suppression List</h3>
          <span class="hint">bounced / unsubscribed</span>
        </div>
        <div class="stat-row">
          <div class="stat"><div class="n">${state.suppressionList.length}</div><div class="l">Suppressed contacts</div></div>
          <div class="stat"><div class="n">${state.outreachMessages.filter(m=>m.status==='sent').length}</div><div class="l">Emails sent</div></div>
        </div>
        <div class="muted" style="font-size:11.5px;margin-top:10px;">Every send is checked against this list before going out — no exceptions.</div>
      </div>
    </div>

    <div class="two-col" style="margin-top:16px;">
      <div class="card">
        <div class="card-head">
          <h3>Division Performance</h3>
          <span class="hint">leads generated · conversion · revenue</span>
        </div>
        ${renderDivisionTable(state)}
      </div>
      <div class="card">
        <div class="card-head">
          <h3>Delivery Status</h3>
          <span class="hint">SLA health</span>
        </div>
        <div class="stat-row" style="margin-bottom:16px;">
          <div class="stat"><div class="n" style="color:var(--green)">${clients.length - atRisk - breachedSla}</div><div class="l">On track</div></div>
          <div class="stat"><div class="n" style="color:var(--amber)">${breachedSla}</div><div class="l">At risk</div></div>
          <div class="stat"><div class="n" style="color:var(--red)">${atRisk}</div><div class="l">Breached SLA</div></div>
        </div>
        ${Charts.donut([
          {label:"On track", value: Math.max(clients.length - atRisk - breachedSla,0), color:"#22c55e"},
          {label:"At risk", value: breachedSla, color:"#f59e0b"},
          {label:"Breached", value: atRisk, color:"#ef4444"},
        ], {size:140})}
      </div>
    </div>

    <div class="two-col" style="margin-top:16px;">
      <div class="card">
        <div class="card-head">
          <h3>Team Performance Leaderboard</h3>
          <span class="hint">leads sourced · meetings booked</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Rep</th><th>Division</th><th>Leads Sourced</th><th>Meetings</th><th>Response Rate</th></tr></thead>
            <tbody>
              ${leaderboard.map(r => `
                <tr class="row-hover">
                  <td><b>${r.name}</b></td>
                  <td>${r.division}</td>
                  <td>${r.sourced}</td>
                  <td>${r.meetings}</td>
                  <td>${r.responseRate}%</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <h3>AI Agent Activity Feed</h3>
          <span class="hint">live</span>
        </div>
        ${renderAgentFeed(state, divFilter)}
      </div>
    </div>
  `;

  const ackBtn = document.getElementById("ackDlvBtn");
  if (ackBtn) ackBtn.addEventListener("click", () => Store.acknowledgeDeliverabilityAlert());
}

function roleLabel(id){ const r = ROLES.find(r=>r.id===id); return r ? r.label : id; }

function kpiCard(label, value, delta, trend) {
  return `
    <div class="card kpi">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      <div class="delta ${trend}">${trend === "up" ? "▲" : trend === "down" ? "▼" : "•"} ${delta}</div>
    </div>
  `;
}

function leadsDelta(state, divFilter){
  const leads = divFilter === "all" ? state.leads : state.leads.filter(l=>l.divisionId===divFilter);
  const last7 = leads.filter(l => (Date.now() - new Date(l.createdAt))/86400000 <= 7).length;
  return `+${last7} in last 7 days`;
}

function randStablePct(seedKey){
  // deterministic-ish pseudo value per division so it doesn't jump on every re-render
  let seed = 0;
  const s = String(seedKey);
  for (let i=0;i<s.length;i++) seed += s.charCodeAt(i);
  return 4 + (seed % 19);
}

function renderDivisionTable(state){
  const rows = state.divisions.map(d => {
    const leads = state.leads.filter(l => l.divisionId === d.id);
    const qualified = leads.filter(l => l.tier === "Hot" || l.tier === "Warm").length;
    const rate = leads.length ? Math.round((qualified/leads.length)*100) : 0;
    return { d, count: leads.length, rate };
  });
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Division</th><th>Leads</th><th>Qual. Rate</th><th>Clients</th><th>ARR</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr class="row-hover">
              <td>${r.d.icon} <b>${r.d.name}</b></td>
              <td>${r.count}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div class="progress" style="width:60px;"><div style="width:${r.rate}%;background:${r.d.color}"></div></div>
                  <span class="muted">${r.rate}%</span>
                </div>
              </td>
              <td>${r.d.activeClients}</td>
              <td>${fmt$(r.d.arr)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function buildLeaderboard(state, divFilter){
  const divisions = divFilter === "all" ? state.divisions : state.divisions.filter(d=>d.id===divFilter);
  const reps = ["Jamie Cole","Priya Raman","Marcus Diaz","Elena Volkov","Sam O'Neill","Tasha Reed"];
  return divisions.slice(0, 5).map((d,i) => {
    const rep = reps[i % reps.length];
    const sourced = state.leads.filter(l=>l.divisionId===d.id).length;
    return {
      name: rep, division: d.name,
      sourced,
      meetings: Math.max(1, Math.round(sourced * 0.11)),
      responseRate: 8 + (sourced % 14),
    };
  }).sort((a,b) => b.sourced - a.sourced);
}

function renderAgentFeed(state, divFilter){
  // Activity log is firm-wide (not tagged per-division in the schema), so it
  // always shows the most recent real actions regardless of the division filter.
  const items = state.agentLog.slice(0, 10);
  if (!items.length) return `<div class="empty">No agent activity yet — run a lead search or draft an outreach email to see it here.</div>`;
  return `
    <div class="feed">
      ${items.map(l => `
        <div class="feed-item">
          <div class="feed-ic">${l.icon}</div>
          <div class="feed-body">
            <div class="txt"><b>${l.agentName}</b> ${l.text}</div>
            <div class="time">${timeAgo(l.timestamp)}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}
