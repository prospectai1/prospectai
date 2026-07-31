/* Module 6 — Proposal Generation Center */

function renderProposals(root, state) {
  const divFilter = state.currentDivisionFilter;
  let proposals = divFilter === "all" ? state.proposals : state.proposals.filter(p => p.divisionId === divFilter);
  proposals = proposals.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const statusCounts = { Draft:0, Sent:0, Viewed:0, Signed:0 };
  proposals.forEach(p => statusCounts[p.status]++);
  const winRate = proposals.length ? Math.round((statusCounts.Signed / proposals.length) * 100) : 0;

  const eligibleClients = (divFilter === "all" ? state.clients : state.clients.filter(c=>c.divisionId===divFilter));

  root.innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px;">
      ${kpiCard("Draft", statusCounts.Draft, "awaiting rep review", "flat")}
      ${kpiCard("Sent", statusCounts.Sent, "tracking open/view", "flat")}
      ${kpiCard("Viewed", statusCounts.Viewed, "in client's hands", "flat")}
      ${kpiCard("Win Rate", winRate + "%", statusCounts.Signed + " signed", "up")}
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Proposals</h3>
        <button class="btn secondary sm" id="newProposalBtn">📄 Generate Proposal</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Client</th><th>Division</th><th>Value</th><th>Status</th><th>Created</th><th></th></tr></thead>
          <tbody>
            ${proposals.map(p => proposalRow(p)).join("") || `<tr><td colspan="6"><div class="empty">No proposals yet. Move a client to "Proposal Sent" in the pipeline, or generate one here.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("newProposalBtn").addEventListener("click", () => openGenerateModal(eligibleClients));
  root.querySelectorAll("[data-advance-proposal]").forEach(btn => {
    btn.addEventListener("click", () => Store.advanceProposal(btn.getAttribute("data-advance-proposal")));
  });
}

function proposalStatusClass(status){
  return { Draft:"gray", Sent:"blue", Viewed:"warm", Signed:"green" }[status] || "gray";
}

function proposalRow(p) {
  const order = ["Draft","Sent","Viewed","Signed"];
  const idx = order.indexOf(p.status);
  const nextLabel = idx < order.length - 1 ? `Mark ${order[idx+1]}` : "Complete";
  return `
    <tr class="row-hover">
      <td><b>${escapeHtml(p.clientName)}</b></td>
      <td>${divisionName(p.divisionId)}</td>
      <td>${fmt$(p.value)}</td>
      <td><span class="badge ${proposalStatusClass(p.status)}">${p.status}</span></td>
      <td>${fmtDate(p.createdAt)}</td>
      <td>${idx < order.length - 1 ? `<button class="btn ghost sm" data-advance-proposal="${p.id}">${nextLabel} →</button>` : `<span class="muted">✓ signed</span>`}</td>
    </tr>
  `;
}

function openGenerateModal(clients) {
  if (!clients.length) { Store.toast("No clients available in this division yet."); return; }
  const html = `
    <h2>Generate Proposal</h2>
    <div class="modal-sub">The Proposal Agent pulls discovery-call notes, division/ICP data, and pricing rules to draft scope, pricing, timeline, and deliverables automatically.</div>
    <div class="field">
      <label>Client</label>
      <select class="select" id="clientSelect">
        ${clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)} — ${c.tier}</option>`).join("")}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn secondary" id="cancelBtn">Cancel</button>
      <button class="btn" id="genBtn">Generate with Proposal Agent</button>
    </div>
  `;
  openModal(html, (backdrop) => {
    backdrop.querySelector("#cancelBtn").addEventListener("click", () => backdrop.remove());
    backdrop.querySelector("#genBtn").addEventListener("click", () => {
      Store.createProposal(backdrop.querySelector("#clientSelect").value);
      backdrop.remove();
    });
  });
}
