/* Part 7 — Client Portal: scoped, read-mostly view for a single client */

let portalSelectedClientId = null;

function renderPortal(root, state) {
  const clients = state.clients;
  if (!portalSelectedClientId || !clients.find(c => c.id === portalSelectedClientId)) {
    portalSelectedClientId = (clients.find(c => c.stage !== "New Inquiry") || clients[0])?.id;
  }
  const client = clients.find(c => c.id === portalSelectedClientId);

  if (!client) { root.innerHTML = `<div class="empty">No clients yet.</div>`; return; }

  const leads = state.leads.filter(l => l.divisionId === client.divisionId).slice(0, 12);
  const division = divisionById(client.divisionId);
  const pacingPct = Math.min(100, Math.round((client.leadsDelivered / client.slaTarget) * 100));
  const disputesForClientLeads = state.disputes.filter(d => leads.some(l => l.id === d.leadId));

  root.innerHTML = `
    <div class="field" style="max-width:320px;margin-bottom:18px;">
      <label>Preview as client (internal-only selector)</label>
      <select class="select" id="clientPicker">
        ${clients.map(c => `<option value="${c.id}" ${c.id===client.id?"selected":""}>${escapeHtml(c.name)}</option>`).join("")}
      </select>
    </div>

    <div class="portal-shell" style="border:1px solid var(--border);border-radius:14px;overflow:hidden;">
      <div class="portal-topbar">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:11px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.06em;">${division ? division.icon + " " + division.name : ""} · White-labeled Client Portal</div>
            <div style="font-size:20px;font-weight:800;margin-top:4px;">${escapeHtml(client.name)}</div>
          </div>
          <div class="score-ring" style="background:${healthColor(client.healthBand)}22;color:${healthColor(client.healthBand)};border:2px solid ${healthColor(client.healthBand)}55;">${client.healthScore}</div>
        </div>
      </div>

      <div class="content" style="padding:22px;">
        <div class="card" style="margin-bottom:16px;">
          <div class="card-head">
            <h3>Project Health</h3>
            <span class="badge ${healthBadgeClass(client.healthBand)}">● ${client.healthBand}</span>
          </div>
          <div class="stat-row" style="margin-bottom:14px;">
            <div class="stat"><div class="n">${client.leadsDelivered}</div><div class="l">Leads Delivered</div></div>
            <div class="stat"><div class="n">${client.slaTarget}</div><div class="l">SLA Target</div></div>
            <div class="stat"><div class="n">${client.renewalProbability}%</div><div class="l">Renewal Probability</div></div>
            <div class="stat"><div class="n">${client.stage}</div><div class="l">Current Stage</div></div>
          </div>
          <div class="muted" style="font-size:11.5px;margin-bottom:6px;">Pacing vs. SLA target</div>
          <div class="progress"><div style="width:${pacingPct}%;"></div></div>
          <div class="muted" style="font-size:11.5px;margin-top:6px;">${pacingPct}% of contracted volume delivered this period</div>
        </div>

        <div class="two-col">
          <div class="card">
            <div class="card-head">
              <h3>Delivered Leads</h3>
              <span class="hint">with scoring rationale</span>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Company</th><th>Contact</th><th>Score</th><th>Tier</th><th></th></tr></thead>
                <tbody>
                  ${leads.map(l => `
                    <tr class="row-hover">
                      <td><b>${escapeHtml(l.company)}</b></td>
                      <td>${escapeHtml(l.contactName)}<div class="muted" style="font-size:11px;">${escapeHtml(l.title)}</div></td>
                      <td>${l.score}</td>
                      <td><span class="badge ${tierBadgeClass(l.tier)}">${l.tier}</span></td>
                      <td><button class="btn ghost sm" data-portal-dispute="${l.id}">Dispute this lead</button></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div class="card" style="margin-bottom:16px;">
              <div class="card-head"><h3>This Week's Highlights</h3></div>
              <ul style="margin:0;padding-left:18px;font-size:12.5px;color:var(--text-dim);line-height:1.9;">
                <li>${randInt(3,9)} new qualified leads sourced</li>
                <li>${randInt(1,4)} meetings booked from your campaigns</li>
                <li>Domain health: <b style="color:var(--green)">Good</b> — deliverability within target</li>
              </ul>
            </div>
            <div class="card" style="margin-bottom:16px;">
              <div class="card-head"><h3>Reports</h3></div>
              <button class="btn secondary sm" style="width:100%;margin-bottom:8px;justify-content:center;" id="dlPdf">⬇ Download Weekly Report (PDF)</button>
              <button class="btn secondary sm" style="width:100%;justify-content:center;" id="dlCsv">⬇ Export Lead Data (CSV)</button>
            </div>
            <div class="card">
              <div class="card-head"><h3>Support</h3></div>
              <button class="btn sm" style="width:100%;justify-content:center;" id="raiseTicket">Raise a Support Ticket</button>
              ${disputesForClientLeads.length ? `<div class="muted" style="font-size:11.5px;margin-top:10px;">${disputesForClientLeads.length} open dispute(s) — replacement SLA clock running.</div>` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("clientPicker").addEventListener("change", (e) => { portalSelectedClientId = e.target.value; renderPortal(root, Store.get()); });
  root.querySelectorAll("[data-portal-dispute]").forEach(btn => {
    btn.addEventListener("click", () => Store.disputeLead(btn.getAttribute("data-portal-dispute"), "Confirmed duplicate"));
  });
  document.getElementById("dlPdf").addEventListener("click", () => Store.toast("Weekly report generated (simulated) — in production this exports a PDF via the Reporting service."));
  document.getElementById("dlCsv").addEventListener("click", () => exportLeadsCsv(leads, client.name));
  document.getElementById("raiseTicket").addEventListener("click", () => Store.toast("Support ticket routed to Customer Success (simulated)."));
}

function healthColor(band){ return { Green:"#22c55e", Yellow:"#f59e0b", Red:"#ef4444" }[band] || "#6b7386"; }

function exportLeadsCsv(leads, clientName) {
  const header = "Company,Contact,Title,Score,Tier,Status\n";
  const rows = leads.map(l => [l.company, l.contactName, l.title, l.score, l.tier, l.status].map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${clientName.replace(/\s+/g,"_")}_leads.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
