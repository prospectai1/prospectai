/* Module 2 — Industry Management Center */

function renderDivisions(root, state) {
  root.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div class="muted">Each division has its own ICP, qualification rubric, compliance profile, and data sources — all sharing the same database, AI agent layer, and billing engine.</div>
      <button class="btn" id="newDivisionBtn">+ New Division</button>
    </div>
    <div class="grid grid-3" id="divGrid"></div>
  `;

  const grid = document.getElementById("divGrid");
  grid.innerHTML = state.divisions.map(d => divisionCard(d, state)).join("");

  grid.querySelectorAll("[data-discover]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      Store.runLeadDiscovery(btn.getAttribute("data-discover"));
    });
  });
  grid.querySelectorAll("[data-qualify]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      Store.runQualificationPass(btn.getAttribute("data-qualify"));
    });
  });
  grid.querySelectorAll("[data-view-division]").forEach(card => {
    card.addEventListener("click", () => {
      Store.setDivisionFilter(card.getAttribute("data-view-division"));
      navigate("leads");
    });
  });

  document.getElementById("newDivisionBtn").addEventListener("click", openNewDivisionModal);
}

function divisionCard(d, state) {
  const leads = state.leads.filter(l => l.divisionId === d.id).length;
  return `
    <div class="card division-card" data-view-division="${d.id}">
      <div class="dname"><span class="division-icon" style="background:${d.color}22;">${d.icon}</span> ${d.name}</div>
      <div class="muted" style="margin-top:10px;font-size:12.5px;line-height:1.5;">${escapeHtml(d.icp)}</div>
      <div class="tag-row">
        ${d.compliance.map(c => `<span class="tag">🛡 ${c}</span>`).join("")}
        ${d.geographies.map(g => `<span class="tag">📍 ${g}</span>`).join("")}
      </div>
      <div class="stat-row" style="margin-top:14px;">
        <div class="stat"><div class="n">${leads}</div><div class="l">Leads</div></div>
        <div class="stat"><div class="n">${d.activeClients}</div><div class="l">Clients</div></div>
        <div class="stat"><div class="n">${fmt$(d.arr)}</div><div class="l">ARR</div></div>
      </div>
      <div class="muted" style="margin-top:12px;font-size:11.5px;">KPI focus: <b style="color:var(--text-dim)">${d.kpiFocus}</b></div>
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button class="btn secondary sm" data-discover="${d.id}" style="flex:1;">🧲 Run Discovery</button>
        <button class="btn secondary sm" data-qualify="${d.id}" style="flex:1;">🎯 Run Qualification</button>
      </div>
    </div>
  `;
}

function openNewDivisionModal() {
  const html = `
    <h2>Create Industry Division</h2>
    <div class="modal-sub">Guided setup — ICP, compliance profile, and data sources. AI Research Agent can auto-suggest an ICP from this description.</div>
    <div class="field">
      <label>Division name</label>
      <input class="input" id="fName" placeholder="e.g. Legal Services" />
    </div>
    <div class="field">
      <label>Icon (emoji)</label>
      <input class="input" id="fIcon" placeholder="⚖️" maxlength="2" />
    </div>
    <div class="field">
      <label>Ideal Customer Profile</label>
      <textarea id="fIcp" rows="3" placeholder="Firmographic + persona filters, e.g. mid-market law firms, 20-200 employees, decision-maker: Managing Partner"></textarea>
    </div>
    <div class="field">
      <label>Compliance profile (comma-separated)</label>
      <input class="input" id="fCompliance" placeholder="TCPA, CAN-SPAM" />
    </div>
    <div class="field">
      <label>Data sources (comma-separated)</label>
      <input class="input" id="fSources" placeholder="State bar registries, Martindale-Hubbell" />
    </div>
    <div class="field">
      <label>KPI focus</label>
      <input class="input" id="fKpi" placeholder="Cost per qualified consultation" />
    </div>
    <div class="modal-actions">
      <button class="btn secondary" id="cancelBtn">Cancel</button>
      <button class="btn" id="createBtn">Create Division</button>
    </div>
  `;
  const modal = openModal(html, (backdrop) => {
    backdrop.querySelector("#cancelBtn").addEventListener("click", () => backdrop.remove());
    backdrop.querySelector("#createBtn").addEventListener("click", () => {
      const name = backdrop.querySelector("#fName").value.trim();
      if (!name) { backdrop.querySelector("#fName").focus(); return; }
      Store.createDivision({
        name,
        icon: backdrop.querySelector("#fIcon").value.trim() || "🧩",
        icp: backdrop.querySelector("#fIcp").value.trim(),
        compliance: backdrop.querySelector("#fCompliance").value.split(",").map(s=>s.trim()).filter(Boolean),
        sources: backdrop.querySelector("#fSources").value.split(",").map(s=>s.trim()).filter(Boolean),
        kpiFocus: backdrop.querySelector("#fKpi").value.trim() || "Cost per qualified lead",
        color: rand(["#22c55e","#6366f1","#f59e0b","#3b82f6","#a855f7","#ec4899","#14b8a6"]),
      });
      backdrop.remove();
    });
  });
}
