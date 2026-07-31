/* Settings — Team (Super Admin) + Division scoring weights */

let settingsTab = "team";

function renderSettings(root, state) {
  const tabs = [
    { id: "team", label: "Team" },
    { id: "division", label: "Division Scoring" },
  ];
  root.innerHTML = `
    <div class="tabs">
      ${tabs.map(t => `<div class="tab ${settingsTab===t.id?"active":""}" data-tab="${t.id}">${t.label}</div>`).join("")}
    </div>
    <div id="settingsBody"></div>
  `;
  root.querySelectorAll("[data-tab]").forEach(t => t.addEventListener("click", () => { settingsTab = t.getAttribute("data-tab"); renderSettings(root, Store.get()); }));
  const body = document.getElementById("settingsBody");
  if (settingsTab === "team") renderTeamTab(body, state);
  else renderDivisionScoringTab(body, state);
}

function roleChipClass(role){
  return { SUPER_ADMIN:"purple", SALES:"blue", RESEARCHER:"green" }[role] || "gray";
}

function renderTeamTab(body, state) {
  const isSuperAdmin = true; // demo: settings always reachable; role-gating is enforced conceptually per doc's server-side requirement
  body.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h3>Team</h3>
        <button class="btn secondary sm" id="inviteBtn">+ Invite User</button>
      </div>
      <div class="muted" style="font-size:11.5px;margin-bottom:14px;">Super Admin manages users and roles. Role checks are enforced server-side on every action in production — not just hidden in the UI (per Section 4 of the build spec).</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            ${state.users.map(u => `
              <tr class="row-hover">
                <td><b>${escapeHtml(u.name)}</b></td>
                <td class="muted">${escapeHtml(u.email)}</td>
                <td>
                  <select class="select" data-role-select="${u.id}" style="width:auto;display:inline-block;">
                    ${["SUPER_ADMIN","SALES","RESEARCHER"].map(r => `<option value="${r}" ${u.role===r?"selected":""}>${r.replace("_"," ")}</option>`).join("")}
                  </select>
                </td>
                <td>${fmtDate(u.createdAt)}</td>
                <td><span class="badge ${roleChipClass(u.role)}">${u.role.replace("_"," ")}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  body.querySelectorAll("[data-role-select]").forEach(sel => {
    sel.addEventListener("change", () => Store.updateUserRole(sel.getAttribute("data-role-select"), sel.value));
  });
  document.getElementById("inviteBtn").addEventListener("click", openInviteModal);
}

function openInviteModal() {
  const html = `
    <h2>Invite User</h2>
    <div class="modal-sub">Adds a user to the team with the selected role.</div>
    <div class="field"><label>Name</label><input class="input" id="nameInput" placeholder="Jordan Lee" /></div>
    <div class="field"><label>Email</label><input class="input" id="emailInput" placeholder="jordan@prospectai.in" /></div>
    <div class="field">
      <label>Role</label>
      <select class="select" id="roleInput">
        <option value="RESEARCHER">Researcher / Outreach</option>
        <option value="SALES">Sales / BDE</option>
        <option value="SUPER_ADMIN">Super Admin</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn secondary" id="cancelBtn">Cancel</button>
      <button class="btn" id="inviteConfirmBtn">Send Invite</button>
    </div>
  `;
  openModal(html, (bd) => {
    bd.querySelector("#cancelBtn").addEventListener("click", () => bd.remove());
    bd.querySelector("#inviteConfirmBtn").addEventListener("click", () => {
      const name = bd.querySelector("#nameInput").value.trim();
      const email = bd.querySelector("#emailInput").value.trim();
      if (!name || !email) return;
      Store.inviteUser({ name, email, role: bd.querySelector("#roleInput").value });
      bd.remove();
    });
  });
}

function renderDivisionScoringTab(body, state) {
  body.innerHTML = `
    <div class="muted" style="font-size:12px;margin-bottom:14px;">Lead scores are computed with a deterministic weighted formula — <code>score = icpFit·w1 + intentSignal·w2 + seniority·w3 + engagement·w4</code> — not an LLM call, so every score is auditable. Adjust weights per division below; changing them recomputes every lead's score immediately.</div>
    <div class="grid grid-2" id="divisionScoringGrid"></div>
  `;
  const grid = document.getElementById("divisionScoringGrid");
  grid.innerHTML = state.divisions.map(d => divisionScoringCard(d)).join("");
  wireScoringSliders(grid);
}

function divisionScoringCard(d) {
  const w = d.scoringWeights || DEFAULT_SCORING_WEIGHTS;
  const fields = [["icpFit","ICP Fit"],["intentSignal","Intent Signal"],["seniority","Seniority"],["engagement","Engagement"]];
  return `
    <div class="card" data-division-card="${d.id}">
      <div class="card-head">
        <h3>${d.icon} ${d.name}</h3>
        <span class="hint" data-weight-sum="${d.id}">100%</span>
      </div>
      ${fields.map(([k,label]) => `
        <div class="field" style="margin-bottom:12px;">
          <label style="display:flex;justify-content:space-between;">
            <span>${label}</span>
            <span data-weight-val="${d.id}-${k}">${Math.round(w[k]*100)}%</span>
          </label>
          <input type="range" min="0" max="100" value="${Math.round(w[k]*100)}" data-weight-slider="${d.id}" data-key="${k}" style="width:100%;" />
        </div>
      `).join("")}
      <button class="btn secondary sm" data-apply-weights="${d.id}" style="width:100%;justify-content:center;margin-top:6px;">Apply & Recompute Scores</button>
    </div>
  `;
}

function wireScoringSliders(grid) {
  grid.querySelectorAll("[data-weight-slider]").forEach(slider => {
    slider.addEventListener("input", () => {
      const divId = slider.getAttribute("data-weight-slider");
      const key = slider.getAttribute("data-key");
      grid.querySelector(`[data-weight-val="${divId}-${key}"]`).textContent = slider.value + "%";
      const sliders = grid.querySelectorAll(`[data-weight-slider="${divId}"]`);
      let sum = 0;
      sliders.forEach(s => sum += parseInt(s.value, 10));
      const sumEl = grid.querySelector(`[data-weight-sum="${divId}"]`);
      sumEl.textContent = sum + "%";
      sumEl.style.color = sum === 100 ? "var(--green)" : "var(--amber)";
    });
  });
  grid.querySelectorAll("[data-apply-weights]").forEach(btn => {
    btn.addEventListener("click", () => {
      const divId = btn.getAttribute("data-apply-weights");
      const sliders = grid.querySelectorAll(`[data-weight-slider="${divId}"]`);
      let sum = 0;
      const raw = {};
      sliders.forEach(s => { raw[s.getAttribute("data-key")] = parseInt(s.value, 10); sum += parseInt(s.value, 10); });
      if (sum === 0) sum = 1;
      const weights = {};
      Object.keys(raw).forEach(k => weights[k] = raw[k] / sum); // normalize to sum to 1
      Store.updateDivisionWeights(divId, weights);
    });
  });
}
