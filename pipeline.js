/* Module 3 — Lead Generation Center */

let leadsFilterTier = "all";
let leadsFilterSignal = "all";
let leadsSearch = "";

function renderLeads(root, state) {
  const divFilter = state.currentDivisionFilter;
  let leads = divFilter === "all" ? state.leads : state.leads.filter(l => l.divisionId === divFilter);
  if (leadsFilterTier !== "all") leads = leads.filter(l => l.tier === leadsFilterTier);
  if (leadsFilterSignal !== "all") leads = leads.filter(l => l.signalType === leadsFilterSignal);
  if (leadsSearch.trim()) {
    const q = leadsSearch.toLowerCase();
    leads = leads.filter(l => l.company.toLowerCase().includes(q) || l.contactName.toLowerCase().includes(q));
  }
  leads = leads.slice().sort((a,b) => b.score - a.score);

  const tierCounts = { Hot:0, Warm:0, Cold:0, Disqualified:0 };
  (divFilter==="all"?state.leads:state.leads.filter(l=>l.divisionId===divFilter)).forEach(l => tierCounts[l.tier]++);

  root.innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px;">
      ${kpiCard("Hot Leads", tierCounts.Hot, "score ≥ 70", "up")}
      ${kpiCard("Warm Leads", tierCounts.Warm, "score 40-69", "flat")}
      ${kpiCard("Cold Leads", tierCounts.Cold, "score 15-39, nurture", "flat")}
      ${kpiCard("Disqualified", tierCounts.Disqualified, "score < 15", "down")}
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Lead Database</h3>
        <div style="display:flex;gap:8px;">
          <button class="btn secondary sm" id="discoveryBtn">🧲 Run AI Discovery</button>
          <button class="btn secondary sm" id="qualifyBtn">🎯 Run Qualification</button>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">
        <input class="input" id="leadSearch" placeholder="Search company or contact…" style="max-width:220px;" value="${escapeHtml(leadsSearch)}" />
        <div class="chip-row" id="tierChips">
          ${["all","Hot","Warm","Cold","Disqualified"].map(t => `<span class="chip ${leadsFilterTier===t?"active":""}" data-tier="${t}">${t==="all"?"All tiers":t}</span>`).join("")}
        </div>
        <div class="chip-row" id="signalChips">
          ${[["all","All sources"],["static-icp","Static ICP"],["intent-signal","Intent Signal"],["trigger-event","Trigger Event"]].map(([v,l]) => `<span class="chip ${leadsFilterSignal===v?"active":""}" data-signal="${v}">${l}</span>`).join("")}
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Company</th><th>Contact</th><th>Division</th><th>Signal</th><th>Score</th><th>Tier</th><th>Status</th><th>Verified</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${leads.slice(0,80).map(l => leadRow(l)).join("") || `<tr><td colspan="9"><div class="empty">No leads match these filters.</div></td></tr>`}
          </tbody>
        </table>
      </div>
      ${leads.length > 80 ? `<div class="muted" style="margin-top:10px;font-size:12px;">Showing top 80 of ${leads.length} leads by score.</div>` : ""}
    </div>
  `;

  document.getElementById("leadSearch").addEventListener("input", (e) => { leadsSearch = e.target.value; renderLeads(root, Store.get()); });
  document.querySelectorAll("#tierChips [data-tier]").forEach(c => c.addEventListener("click", () => { leadsFilterTier = c.getAttribute("data-tier"); renderLeads(root, Store.get()); }));
  document.querySelectorAll("#signalChips [data-signal]").forEach(c => c.addEventListener("click", () => { leadsFilterSignal = c.getAttribute("data-signal"); renderLeads(root, Store.get()); }));

  document.getElementById("discoveryBtn").addEventListener("click", () => {
    const targetDiv = divFilter === "all" ? state.divisions[randInt(0,state.divisions.length-1)].id : divFilter;
    Store.runLeadDiscovery(targetDiv);
  });
  document.getElementById("qualifyBtn").addEventListener("click", () => {
    const targetDiv = divFilter === "all" ? state.divisions[randInt(0,state.divisions.length-1)].id : divFilter;
    Store.runQualificationPass(targetDiv);
  });

  root.querySelectorAll("[data-dispute]").forEach(btn => {
    btn.addEventListener("click", () => openDisputeModal(btn.getAttribute("data-dispute")));
  });
  root.querySelectorAll("[data-view-lead]").forEach(el => {
    el.addEventListener("click", () => openLeadDetailModal(el.getAttribute("data-view-lead")));
  });
  root.querySelectorAll("[data-advance]").forEach(btn => {
    btn.addEventListener("click", () => {
      const leadId = btn.getAttribute("data-advance");
      const lead = Store.get().leads.find(l => l.id === leadId);
      const idx = LEAD_STATUSES.indexOf(lead.status);
      if (idx < LEAD_STATUSES.length - 1) Store.moveLead(leadId, LEAD_STATUSES[idx+1]);
    });
  });
}

function leadRow(l) {
  const signalIcon = { "static-icp":"📇", "intent-signal":"📡", "trigger-event":"⚡" }[l.signalType];
  const signalLabel = { "static-icp":"Static ICP", "intent-signal":"Intent Signal", "trigger-event":"Trigger Event" }[l.signalType];
  const nextIdx = LEAD_STATUSES.indexOf(l.status);
  const hasNext = nextIdx < LEAD_STATUSES.length - 1;
  return `
    <tr class="row-hover">
      <td>
        <button class="link-btn" data-view-lead="${l.id}" style="font-weight:700;font-size:13px;color:var(--text);">${escapeHtml(l.company)}</button>
        <div class="muted" style="font-size:11px;">${timeAgo(l.createdAt)}</div>
      </td>
      <td>${escapeHtml(l.contactName)}<div class="muted" style="font-size:11px;">${escapeHtml(l.title)}</div></td>
      <td>${divisionName(l.divisionId)}</td>
      <td><span class="badge blue">${signalIcon} ${signalLabel}</span></td>
      <td><b>${l.score}</b></td>
      <td><span class="badge ${tierBadgeClass(l.tier)}">${l.tier}</span></td>
      <td>
        <button class="link-btn" ${hasNext?"":"disabled"} data-advance="${l.id}" title="Advance to next stage">${l.status}${hasNext?" →":""}</button>
      </td>
      <td>${l.emailVerified ? `<span class="badge green">✓ verified</span>` : `<span class="badge gray">unverified</span>`}</td>
      <td><button class="btn ghost sm" data-dispute="${l.id}">Dispute</button></td>
    </tr>
  `;
}

function openLeadDetailModal(leadId) {
  const lead = Store.get().leads.find(l => l.id === leadId);
  if (!lead) return;

  const html = `
    <h2>${escapeHtml(lead.contactName)}</h2>
    <div class="modal-sub">${escapeHtml(lead.title)} at ${escapeHtml(lead.company)} · ${divisionName(lead.divisionId)}</div>
    <div id="leadDetailBody"></div>
  `;
  const backdrop = openModal(html, (bd) => renderLeadDetailBody(bd, leadId));
}

async function renderLeadDetailBody(backdrop, leadId) {
  const lead = Store.get().leads.find(l => l.id === leadId);
  if (!lead) { backdrop.remove(); return; }

  const body = backdrop.querySelector("#leadDetailBody");
  body.innerHTML = `<div class="empty" style="padding:20px;font-size:12px;">Loading…</div>`;

  let messages = [];
  try {
    const raw = await Store.listOutreachForLead(leadId);
    messages = raw.map(m => ({
      id: m.id, subject: m.subject, body: m.body, status: m.status,
      sentAt: m.sent_at, createdAt: m.created_at,
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) { /* Store.listOutreachForLead already toasts the error */ }

  const s = lead.subscores;
  body.innerHTML = `
    <div class="stat-row" style="margin:14px 0;">
      <div class="stat"><div class="n">${lead.score}</div><div class="l">Score</div></div>
      <div class="stat"><div class="n"><span class="badge ${tierBadgeClass(lead.tier)}">${lead.tier}</span></div><div class="l">Tier</div></div>
      <div class="stat"><div class="n">${lead.emailVerified?"✓":"—"}</div><div class="l">Email verified</div></div>
    </div>
    <div class="card" style="margin-bottom:14px;background:var(--panel-2);">
      <div class="card-head"><h3>Score breakdown</h3><span class="hint">deterministic — weights × subscores, auditable</span></div>
      ${["icpFit","intentSignal","seniority","engagement"].map(k => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:12px;">
          <span style="width:90px;color:var(--text-dim);">${{icpFit:"ICP Fit",intentSignal:"Intent Signal",seniority:"Seniority",engagement:"Engagement"}[k]}</span>
          <div class="progress" style="flex:1;"><div style="width:${s[k]}%;"></div></div>
          <span style="width:30px;text-align:right;">${s[k]}</span>
        </div>
      `).join("")}
    </div>
    <div class="card" style="margin-bottom:14px;background:var(--panel-2);">
      <div class="card-head"><h3>AI Summary</h3><span class="hint">references only fields on this record</span></div>
      <div class="muted" style="font-size:12.5px;line-height:1.6;">${escapeHtml(lead.scoreRationale || "")}</div>
      <button class="btn secondary sm" id="rescoreBtn" style="margin-top:12px;">🎯 Re-score with latest signals</button>
    </div>
    <div class="card" style="background:var(--panel-2);">
      <div class="card-head"><h3>Outreach</h3><span class="hint">${escapeHtml(lead.email)}</span></div>
      <button class="btn sm" id="draftBtn" style="margin-bottom:12px;">✉️ Draft outreach email</button>
      <div id="outreachList">
        ${messages.length ? messages.map(m => outreachMessageBlock(m)).join("") : `<div class="empty" style="padding:14px;font-size:12px;">No outreach yet for this contact.</div>`}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn secondary" id="closeBtn">Close</button>
    </div>
  `;

  body.querySelector("#closeBtn").addEventListener("click", () => backdrop.remove());
  body.querySelector("#rescoreBtn").addEventListener("click", async (e) => {
    e.target.disabled = true; e.target.textContent = "Re-scoring…";
    try { await Store.rescoreOneLead(leadId); } catch (err) { /* toasted already */ }
    await renderLeadDetailBody(backdrop, leadId);
  });
  body.querySelector("#draftBtn").addEventListener("click", () => openDraftComposer(backdrop, leadId));
  body.querySelectorAll("[data-send-msg]").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.disabled = true; btn.textContent = "Sending…";
      await Store.sendOutreach(btn.getAttribute("data-send-msg"));
      await renderLeadDetailBody(backdrop, leadId);
    });
  });
}

function outreachMessageBlock(m) {
  const statusClass = { draft:"gray", sent:"blue", opened:"warm", replied:"green", bounced:"red" }[m.status] || "gray";
  return `
    <div style="border:1px solid var(--border);border-radius:9px;padding:10px 12px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <b style="font-size:12.5px;">${escapeHtml(m.subject)}</b>
        <span class="badge ${statusClass}">${m.status}</span>
      </div>
      <div class="muted" style="font-size:11.5px;white-space:pre-line;max-height:80px;overflow-y:auto;">${escapeHtml(m.body)}</div>
      <div class="muted" style="font-size:10.5px;margin-top:6px;">${m.sentAt ? "Sent " + timeAgo(m.sentAt) : "Drafted " + timeAgo(m.createdAt)}</div>
      ${m.status === "draft" ? `<button class="btn sm" data-send-msg="${m.id}" style="margin-top:8px;">Send</button>` : ""}
    </div>
  `;
}

function openDraftComposer(parentBackdrop, leadId) {
  const html = `
    <h2>Draft Outreach Email</h2>
    <div class="modal-sub">Personalized only from verified fields on this record (name, title, company). Unsubscribe link + List-Unsubscribe header are injected automatically before send.</div>
    <div class="field">
      <label>What are we offering? (used once for this draft)</label>
      <input class="input" id="offerInput" placeholder="e.g. improving pipeline quality for growth teams" />
    </div>
    <div class="modal-actions">
      <button class="btn secondary" id="cancelBtn">Cancel</button>
      <button class="btn" id="genBtn">Draft with Outreach Agent</button>
    </div>
  `;
  openModal(html, (bd) => {
    bd.querySelector("#cancelBtn").addEventListener("click", () => bd.remove());
    bd.querySelector("#genBtn").addEventListener("click", async (e) => {
      e.target.disabled = true; e.target.textContent = "Drafting…";
      try {
        await Store.draftOutreach(leadId, bd.querySelector("#offerInput").value.trim());
        bd.remove();
      } catch (err) {
        e.target.disabled = false; e.target.textContent = "Draft with Outreach Agent";
        return; // error already toasted by Store
      }
      await renderLeadDetailBody(parentBackdrop, leadId);
    });
  });
}

function openDisputeModal(leadId) {
  const lead = Store.get().leads.find(l => l.id === leadId);
  if (!lead) return;
  const html = `
    <h2>Dispute Lead</h2>
    <div class="modal-sub">${escapeHtml(lead.company)} — ${escapeHtml(lead.contactName)}. Standard replacement guarantee: bounced, duplicate, or documented disqualification within 5 business days is replaced at no charge.</div>
    <div class="field">
      <label>Reason</label>
      <select class="select" id="reasonSelect">
        <option>Bounced / undeliverable</option>
        <option>Confirmed duplicate</option>
        <option>Fails documented disqualification reason</option>
        <option>Other</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn secondary" id="cancelBtn">Cancel</button>
      <button class="btn danger" id="fileBtn">File Dispute</button>
    </div>
  `;
  openModal(html, (backdrop) => {
    backdrop.querySelector("#cancelBtn").addEventListener("click", () => backdrop.remove());
    backdrop.querySelector("#fileBtn").addEventListener("click", () => {
      Store.disputeLead(leadId, backdrop.querySelector("#reasonSelect").value);
      backdrop.remove();
    });
  });
}
