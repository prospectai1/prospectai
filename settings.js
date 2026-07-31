/* Finance — Invoices (MVP scope: list, create, mark paid) */

function renderInvoices(root, state) {
  const divFilter = state.currentDivisionFilter;
  let invoices = divFilter === "all" ? state.invoices : state.invoices.filter(i => i.divisionId === divFilter);
  invoices = invoices.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const counts = { Draft:0, Sent:0, Paid:0, Overdue:0 };
  invoices.forEach(i => counts[i.status]++);
  const totalPaid = invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.amount,0);
  const totalOutstanding = invoices.filter(i=>i.status!=="Paid").reduce((s,i)=>s+i.amount,0);

  const eligibleClients = divFilter === "all" ? state.clients : state.clients.filter(c=>c.divisionId===divFilter);

  root.innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px;">
      ${kpiCard("Paid", fmt$(totalPaid), counts.Paid + " invoices", "up")}
      ${kpiCard("Outstanding", fmt$(totalOutstanding), (counts.Sent+counts.Overdue) + " open", "flat")}
      ${kpiCard("Overdue", counts.Overdue, "past due date", counts.Overdue>0?"down":"flat")}
      ${kpiCard("Draft", counts.Draft, "not yet sent", "flat")}
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Invoices</h3>
        <button class="btn secondary sm" id="newInvoiceBtn">+ Create Invoice</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Client</th><th>Division</th><th>Amount</th><th>Status</th><th>Due</th><th>Created</th><th></th></tr></thead>
          <tbody>
            ${invoices.map(i => invoiceRow(i)).join("") || `<tr><td colspan="7"><div class="empty">No invoices yet.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("newInvoiceBtn").addEventListener("click", () => openInvoiceModal(eligibleClients));
  root.querySelectorAll("[data-mark-paid]").forEach(btn => btn.addEventListener("click", () => Store.markInvoicePaid(btn.getAttribute("data-mark-paid"))));
  root.querySelectorAll("[data-advance-invoice]").forEach(btn => btn.addEventListener("click", () => Store.advanceInvoice(btn.getAttribute("data-advance-invoice"))));
}

function invoiceStatusClass(status){
  return { Draft:"gray", Sent:"blue", Paid:"green", Overdue:"red" }[status] || "gray";
}

function invoiceRow(i) {
  const overdue = i.status !== "Paid" && new Date(i.dueDate) < new Date();
  const displayStatus = overdue ? "Overdue" : i.status;
  return `
    <tr class="row-hover">
      <td><b>${escapeHtml(i.clientName)}</b></td>
      <td>${divisionName(i.divisionId)}</td>
      <td>${fmt$(i.amount)}</td>
      <td><span class="badge ${invoiceStatusClass(displayStatus)}">${displayStatus}</span></td>
      <td>${fmtDate(i.dueDate)}</td>
      <td>${fmtDate(i.createdAt)}</td>
      <td>
        ${i.status !== "Paid" ? `
          ${i.status === "Draft" ? `<button class="btn ghost sm" data-advance-invoice="${i.id}">Mark Sent</button>` : ""}
          <button class="btn sm" data-mark-paid="${i.id}">Mark Paid</button>
        ` : `<span class="muted">✓ paid</span>`}
      </td>
    </tr>
  `;
}

function openInvoiceModal(clients) {
  if (!clients.length) { Store.toast("No clients available in this division yet."); return; }
  const html = `
    <h2>Create Invoice</h2>
    <div class="modal-sub">Generated from the client's contract terms — edit before sending.</div>
    <div class="field">
      <label>Client</label>
      <select class="select" id="clientSelect">
        ${clients.map(c => `<option value="${c.id}" data-value="${c.contractValue}">${escapeHtml(c.name)} — ${c.tier}</option>`).join("")}
      </select>
    </div>
    <div class="field">
      <label>Amount (USD)</label>
      <input class="input" id="amountInput" type="number" value="${clients[0].contractValue}" />
    </div>
    <div class="field">
      <label>Due in (days)</label>
      <input class="input" id="dueInput" type="number" value="30" />
    </div>
    <div class="modal-actions">
      <button class="btn secondary" id="cancelBtn">Cancel</button>
      <button class="btn" id="createBtn">Create Invoice</button>
    </div>
  `;
  openModal(html, (bd) => {
    const clientSelect = bd.querySelector("#clientSelect");
    const amountInput = bd.querySelector("#amountInput");
    clientSelect.addEventListener("change", () => {
      const opt = clientSelect.selectedOptions[0];
      amountInput.value = opt.getAttribute("data-value");
    });
    bd.querySelector("#cancelBtn").addEventListener("click", () => bd.remove());
    bd.querySelector("#createBtn").addEventListener("click", () => {
      const amount = parseFloat(amountInput.value) || 0;
      const due = parseInt(bd.querySelector("#dueInput").value, 10) || 30;
      Store.createInvoice(clientSelect.value, amount, due);
      bd.remove();
    });
  });
}
