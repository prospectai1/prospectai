/* Part 8 — Dashboards & Analytics: Sales / Ops / Finance / CS / Industry Performance */

let analyticsTab = "exec";

function renderAnalytics(root, state) {
  const tabs = [
    { id: "exec", label: "Executive" },
    { id: "sales", label: "Sales" },
    { id: "ops", label: "Operations" },
    { id: "finance", label: "Finance" },
    { id: "cs", label: "Customer Success" },
    { id: "industry", label: "Industry Performance" },
  ];

  root.innerHTML = `
    <div class="tabs">
      ${tabs.map(t => `<div class="tab ${analyticsTab===t.id?"active":""}" data-tab="${t.id}">${t.label}</div>`).join("")}
    </div>
    <div id="tabBody"></div>
  `;
  root.querySelectorAll("[data-tab]").forEach(t => t.addEventListener("click", () => { analyticsTab = t.getAttribute("data-tab"); renderAnalytics(root, Store.get()); }));

  const body = document.getElementById("tabBody");
  const renderers = { exec: execTab, sales: salesTab, ops: opsTab, finance: financeTab, cs: csTab, industry: industryTab };
  body.innerHTML = renderers[analyticsTab](state);
}

function execTab(state) {
  const totalARR = state.divisions.reduce((s,d)=>s+d.arr,0);
  const mrr = totalARR / 12;
  const months = ["Feb","Mar","Apr","May","Jun","Jul"];
  const series = months.map((_,i) => Math.round(mrr * (0.72 + i*0.06) / 1000));
  const nrr = 108 + (Math.round(mrr) % 12);
  const gm = 58 + (Math.round(mrr) % 15);
  const cac = 1800 + (Math.round(mrr) % 900);
  const ltv = cac * (3 + (Math.round(mrr) % 3));

  return `
    <div class="grid grid-4" style="margin-bottom:16px;">
      ${kpiCard("ARR", fmt$(totalARR), "company-wide", "up")}
      ${kpiCard("MRR Growth", "+" + (4 + (Math.round(mrr)%9)) + "%", "month over month", "up")}
      ${kpiCard("NRR", nrr + "%", "target ≥110%", nrr>=110?"up":"flat")}
      ${kpiCard("Gross Margin", gm + "%", "target ≥60%", gm>=60?"up":"flat")}
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-head"><h3>MRR Trend (6 mo, $K)</h3></div>
        ${Charts.line(series, {width:500,height:160,color:"#6366f1"})}
      </div>
      <div class="card">
        <div class="card-head"><h3>Revenue Mix by Division</h3></div>
        <div style="display:flex;align-items:center;gap:18px;">
          ${Charts.donut(state.divisions.map(d => ({label:d.name, value:d.arr, color:d.color})), {size:130})}
          <div style="flex:1;">
            ${state.divisions.map(d => `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;"><span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${d.color};margin-right:6px;"></span>${d.name}</span><b>${fmt$(d.arr)}</b></div>`).join("")}
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-3" style="margin-top:16px;">
      ${kpiCard("CAC", fmt$(cac), "blended", "flat")}
      ${kpiCard("LTV:CAC", (ltv/cac).toFixed(1) + "x", "healthy ≥ 3x", "up")}
      ${kpiCard("ARR / Employee", fmt$(totalARR / 22), "team of 22", "flat")}
    </div>
  `;
}

function salesTab(state) {
  const clients = state.clients;
  const closedWon = clients.filter(c => c.stage === "Renewal / Upsell" || c.stage === "Active Project" || c.stage === "Delivery").length;
  const totalClosed = clients.filter(c => c.stage !== "New Inquiry" && c.stage !== "Discovery Call").length || 1;
  const winRate = Math.round((closedWon/totalClosed)*100);
  const avgDeal = Math.round(clients.reduce((s,c)=>s+c.contractValue,0) / (clients.length||1));
  const byStage = CLIENT_STAGES.map(s => ({ label: s.split(" ")[0], value: clients.filter(c=>c.stage===s).length }));

  return `
    <div class="grid grid-4" style="margin-bottom:16px;">
      ${kpiCard("New Pipeline", fmtNum(clients.filter(c=>c.stage==="New Inquiry").length), "this month", "up")}
      ${kpiCard("Win Rate", winRate + "%", "closed-won / total closed", "up")}
      ${kpiCard("Avg Deal Size", fmt$(avgDeal), "blended across tiers", "flat")}
      ${kpiCard("Proposal → Close", (40 + (avgDeal%30)) + "%", "conversion rate", "flat")}
    </div>
    <div class="card">
      <div class="card-head"><h3>Pipeline by Stage</h3></div>
      ${Charts.bar(byStage, {width:800,height:200,color:"#6366f1"})}
    </div>
  `;
}

function opsTab(state) {
  const clients = state.clients;
  const slaOk = clients.filter(c => c.leadsDelivered >= c.slaTarget*0.9).length;
  const slaPct = Math.round((slaOk/(clients.length||1))*100);
  const replacementRate = (state.disputes.length / (state.leads.length||1) * 100).toFixed(1);
  const podUtil = 68 + (clients.length % 22);
  const costPerLead = 38 + (clients.length % 40);

  return `
    <div class="grid grid-4" style="margin-bottom:16px;">
      ${kpiCard("SLA Adherence", slaPct + "%", "on-time deliveries", slaPct>=90?"up":"flat")}
      ${kpiCard("Lead Replacement Rate", replacementRate + "%", "rejected / delivered", "flat")}
      ${kpiCard("Pod Utilization", podUtil + "%", "delivery pods", "flat")}
      ${kpiCard("Cost / Delivered Lead", "$" + costPerLead, "blended", "down")}
    </div>
    <div class="card">
      <div class="card-head"><h3>Delivery Pacing by Client</h3></div>
      ${Charts.bar(clients.slice(0,10).map(c => ({label:c.name.split(" ")[0], value:Math.round((c.leadsDelivered/c.slaTarget)*100), color: c.leadsDelivered/c.slaTarget<0.6?"#ef4444":c.leadsDelivered/c.slaTarget<0.9?"#f59e0b":"#22c55e"})), {width:800,height:200})}
      <div class="muted" style="font-size:11.5px;margin-top:8px;">% of SLA target delivered, per client (top 10)</div>
    </div>
  `;
}

function financeTab(state) {
  const totalContract = state.clients.reduce((s,c)=>s+c.contractValue,0);
  const billed = Math.round(totalContract*0.92);
  const collected = Math.round(totalContract*0.81);
  const dso = 18 + (Math.round(totalContract) % 22);

  return `
    <div class="grid grid-4" style="margin-bottom:16px;">
      ${kpiCard("DSO", dso + " days", "days sales outstanding", dso<30?"up":"down")}
      ${kpiCard("Revenue Recognized", fmt$(totalContract), "period to date", "flat")}
      ${kpiCard("Billed", fmt$(billed), "invoiced", "flat")}
      ${kpiCard("Collected", fmt$(collected), "cash in", "flat")}
    </div>
    <div class="card">
      <div class="card-head"><h3>Revenue Recognized vs Billed vs Collected</h3></div>
      ${Charts.bar([
        {label:"Recognized", value: totalContract, color:"#6366f1"},
        {label:"Billed", value: billed, color:"#3b82f6"},
        {label:"Collected", value: collected, color:"#22c55e"},
      ], {width:400,height:200})}
    </div>
  `;
}

function csTab(state) {
  const clients = state.clients;
  const green = clients.filter(c=>c.healthBand==="Green").length;
  const yellow = clients.filter(c=>c.healthBand==="Yellow").length;
  const red = clients.filter(c=>c.healthBand==="Red").length;
  const avgRenewal = Math.round(clients.reduce((s,c)=>s+c.renewalProbability,0)/(clients.length||1));

  return `
    <div class="grid grid-4" style="margin-bottom:16px;">
      ${kpiCard("Avg Renewal Probability", avgRenewal + "%", "across active clients", avgRenewal>=70?"up":"flat")}
      ${kpiCard("NPS / CSAT", (7.2 + (clients.length%20)/10).toFixed(1), "out of 10", "up")}
      ${kpiCard("Renewal Rate", (80 + (clients.length%15)) + "%", "trailing 12mo", "up")}
      ${kpiCard("Upsell Rate", (14 + (clients.length%12)) + "%", "trailing 12mo", "flat")}
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-head"><h3>Health Score Distribution</h3></div>
        <div style="display:flex;align-items:center;gap:18px;">
          ${Charts.donut([{label:"Green",value:green,color:"#22c55e"},{label:"Yellow",value:yellow,color:"#f59e0b"},{label:"Red",value:red,color:"#ef4444"}], {size:130})}
          <div>
            <div style="font-size:12px;margin-bottom:6px;"><span class="badge green">● Green</span> ${green} clients</div>
            <div style="font-size:12px;margin-bottom:6px;"><span class="badge yellow">● Yellow</span> ${yellow} clients</div>
            <div style="font-size:12px;"><span class="badge red">● Red</span> ${red} clients</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>At-Risk Accounts</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Health</th><th>Renewal %</th></tr></thead>
            <tbody>
              ${clients.filter(c=>c.healthBand!=="Green").sort((a,b)=>a.healthScore-b.healthScore).slice(0,6).map(c => `
                <tr class="row-hover"><td>${escapeHtml(c.name)}</td><td><span class="badge ${healthBadgeClass(c.healthBand)}">${c.healthScore}</span></td><td>${c.renewalProbability}%</td></tr>
              `).join("") || `<tr><td colspan="3"><div class="empty">No at-risk accounts 🎉</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function industryTab(state) {
  const rows = state.divisions.map(d => {
    const leads = state.leads.filter(l=>l.divisionId===d.id);
    const qualified = leads.filter(l=>l.tier==="Hot"||l.tier==="Warm").length;
    const rate = leads.length ? Math.round((qualified/leads.length)*100) : 0;
    return { d, leads: leads.length, rate, meetings: Math.round(leads.length*0.09) };
  });
  return `
    <div class="card">
      <div class="card-head"><h3>Leads Generated by Division</h3></div>
      ${Charts.bar(rows.map(r => ({label:r.d.name.slice(0,8), value:r.leads, color:r.d.color})), {width:800,height:200})}
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-head"><h3>Division Scorecard</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Division</th><th>Leads</th><th>Qual. Rate</th><th>Meetings Booked</th><th>Revenue</th><th>Gross Margin</th><th>Top Channel</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr class="row-hover">
                <td>${r.d.icon} <b>${r.d.name}</b></td>
                <td>${r.leads}</td>
                <td>${r.rate}%</td>
                <td>${r.meetings}</td>
                <td>${fmt$(r.d.arr)}</td>
                <td>${52 + (r.leads%25)}%</td>
                <td>${rand(["Email","LinkedIn","Multi-channel"])}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
