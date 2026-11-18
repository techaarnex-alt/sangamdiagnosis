(() => {
  'use strict';

  const workflowKey = 'sangamRkWorkflow';
  const sessionKey = 'sangamDiagnosticSession';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Replace the temporary SD badges with the supplied Sangam logo on login and dashboard.
  $$('.brand img, .login-brand img').forEach((logo) => {
    logo.src = 'sangam-logo.jpg';
    logo.alt = 'Sangam Diagnostic Centre logo';
  });

  // Mirror the current registration validation: gender must be intentionally chosen.
  const setGenderPrompt = (select) => {
    if (!select || select.dataset.genderPromptReady) return;
    const prompt = document.createElement('option');
    prompt.value = '';
    prompt.textContent = 'Select gender';
    prompt.disabled = true;
    prompt.selected = true;
    select.insertBefore(prompt, select.firstChild);
    select.required = true;
    select.value = '';
    select.dataset.genderPromptReady = 'true';
  };
  const applyGenderPrompts = (root = document) => {
    $$('#patientForm select[name="gender"], #intakeForm select[name="gender"], #rkPatientForm select[name="gender"], #rkPatientForm2 select[name="gender"]', root).forEach(setGenderPrompt);
  };
  applyGenderPrompts();

  // Current dashboard wording and live totals.
  const greeting = $('.topbar h1');
  if (greeting) greeting.textContent = 'Hi Sangam Diagnosis';
  $$('[data-rk-page="tests"] .rk-topline p').forEach((node) => node.remove());
  $$('[data-rk-page="tests"] .rk-reference-hint').forEach((node) => {
    if (node.textContent.includes('Published reference ranges')) node.remove();
  });
  $$('.card-head').forEach((header) => {
    const title = $('h3', header);
    if (title?.textContent.trim() === 'Today’s work queue') $('a', header)?.remove();
  });

  const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const setText = (node, value) => { if (node) node.textContent = value; };
  const updateDashboard = () => {
    let data = { patients: [], reports: [] };
    try { data = JSON.parse(localStorage.getItem(workflowKey) || '{"patients":[],"reports":[]}'); } catch (_) {}
    const patients = Array.isArray(data.patients) ? data.patients : [];
    const reports = Array.isArray(data.reports) ? data.reports : [];
    const drafts = reports.filter((report) => report.status !== 'Final');
    const finalReports = reports.filter((report) => report.status === 'Final');
    const paidReports = reports.filter((report) => Number(report.paid || 0) > 0);
    const collections = reports.reduce((total, report) => total + Number(report.paid || 0), 0);
    const completion = reports.length ? Math.round((finalReports.length / reports.length) * 100) : 0;
    const collectionRate = reports.length ? Math.round((paidReports.length / reports.length) * 100) : 0;

    const welcome = $$('.welcome-meta div');
    setText($('b', welcome[0]), reports.length);
    setText($('span', welcome[0]), 'Reports created');
    setText($('b', welcome[1]), finalReports.length);
    setText($('span', welcome[1]), 'Ready to print');

    const stats = $$('#analyticsSection .stat');
    const applyStat = (index, label, value, note) => {
      const stat = stats[index];
      if (!stat) return;
      setText($('.stat-top span', stat), label);
      setText($('strong', stat), value);
      setText($('small', stat), note);
    };
    applyStat(0, 'Registered patients', patients.length, 'Saved patient records');
    applyStat(1, 'Draft reports', drafts.length, 'Awaiting result entry');
    applyStat(2, 'Reports ready', finalReports.length, 'Ready for printing');
    applyStat(3, 'Collections recorded', currency.format(collections), `${paidReports.length} payment${paidReports.length === 1 ? '' : 's'} recorded`);

    const queue = $$('.queue-item');
    const applyQueue = (index, title, description, value) => {
      const item = queue[index];
      if (!item) return;
      setText($('strong', item), title);
      setText($('small', item), description);
      setText($('.count', item), String(value).padStart(2, '0'));
    };
    applyQueue(0, 'Draft reports', 'Awaiting result entry', drafts.length);
    applyQueue(1, 'Final reports', 'Ready for printing', finalReports.length);
    applyQueue(2, 'Payments recorded', 'Collections entered in billing', paidReports.length);

    const bars = $$('.main-grid aside .bar');
    const barTitles = $$('.main-grid aside .bar-title');
    setText(barTitles[0], `Report completion · ${completion}%`);
    setText(barTitles[1], `Payment collection · ${collectionRate}%`);
    if (bars[0]?.querySelector('i')) bars[0].querySelector('i').style.width = `${completion}%`;
    if (bars[1]?.querySelector('i')) bars[1].querySelector('i').style.width = `${collectionRate}%`;
  };
  updateDashboard();
  $('#patientRows') && new MutationObserver(updateDashboard).observe($('#patientRows'), { childList: true });
  window.addEventListener('storage', (event) => { if (event.key === workflowKey) updateDashboard(); });

  // Use a clear Indian date format in the business report and its print title.
  const businessDate = $('#rkBusinessDate');
  const formatBusinessDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
  };
  const updateBusinessDateLabel = () => {
    const label = $('#rkBusinessPeriodLabel');
    if (label && businessDate?.value) label.textContent = label.textContent.replace(businessDate.value, formatBusinessDate(businessDate.value));
  };
  if (businessDate) {
    businessDate.lang = 'en-GB';
    businessDate.title = 'Select date (DD-MM-YYYY)';
    businessDate.addEventListener('change', () => window.setTimeout(updateBusinessDateLabel, 0));
    updateBusinessDateLabel();
  }
  const businessPrint = $('[data-rk-action="print-business"]');
  if (businessPrint) {
    businessPrint.dataset.rkAction = 'print-business-formatted';
    businessPrint.addEventListener('click', () => {
      const originalTitle = document.title;
      document.title = `Sangam-Business-Report-${formatBusinessDate(businessDate?.value)}`;
      window.print();
      window.setTimeout(() => { document.title = originalTitle; }, 800);
    });
  }

  // Apply consistent action treatment to controls created after the initial render.
  const actionWords = /\b(save|print|create|finalise|add|collect)\b/i;
  const styleActions = (root) => {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll('button').forEach((button) => {
      if (button.dataset.rkAction === 'open-draft') button.textContent = 'Enter results';
      if (button.closest('.rk-table') && !button.title) button.title = button.textContent.trim();
      if (actionWords.test(button.textContent || '') || actionWords.test(button.title || '')) button.classList.add('dashboard-action');
    });
  };
  styleActions(document);
  // A settled invoice needs no further action. Keep the Actions cell empty instead
  // of showing a redundant “Paid” label; outstanding invoices still offer Collect.
  const removePaidBillingActions = () => {
    $$('#rkBillingRows tr, #rkBillingRows2 tr').forEach((row) => {
      const cells = row.querySelectorAll('td');
      const actionCell = cells[cells.length - 1];
      if (actionCell?.textContent.trim() === 'Paid') actionCell.replaceChildren();
    });
  };
  removePaidBillingActions();
  let workflowRefreshQueued = false;
  new MutationObserver(() => {
    if (workflowRefreshQueued) return;
    workflowRefreshQueued = true;
    requestAnimationFrame(() => {
      workflowRefreshQueued = false;
      styleActions(document);
      applyGenderPrompts(document);
      removePaidBillingActions();
    });
  }).observe(document.body, { childList: true, subtree: true });

  // Keep Sangam's workspace session separate from the source workflow.
  const loginForm = $('#loginForm');
  const loginScreen = $('#loginScreen');
  const appShell = $('#appShell');
  const loginError = $('#loginError');
  const showWorkspace = () => { loginScreen?.classList.add('hidden'); appShell?.classList.remove('hidden'); };
  localStorage.removeItem(sessionKey);
  if (sessionStorage.getItem(sessionKey) === 'active') showWorkspace();
  if (loginForm) loginForm.onsubmit = (event) => {
    event.preventDefault();
    const username = $('#loginUser')?.value.trim();
    const password = $('#loginPassword')?.value;
    if (username === 'admin' && password === 'Sangam@2026') {
      sessionStorage.setItem(sessionKey, 'active');
      loginError?.classList.remove('show');
      showWorkspace();
    } else {
      loginError?.classList.add('show');
    }
  };
  const logout = $('#logoutButton');
  if (logout) logout.onclick = () => {
    sessionStorage.removeItem(sessionKey);
    appShell?.classList.add('hidden');
    loginScreen?.classList.remove('hidden');
    const password = $('#loginPassword');
    if (password) password.value = '';
    $('#loginUser')?.focus();
  };

  // The completed workflow puts Billing immediately below Reports.
  const navigation = $('.nav');
  const reportsButton = navigation?.querySelector('[data-nav="reports"]');
  const billingButton = navigation?.querySelector('[data-nav="billing"]');
  if (reportsButton && billingButton) reportsButton.insertAdjacentElement('afterend', billingButton);

  // Keep the supplied report stationery intact while making its printed text
  // clearer and restoring the two signature positions requested by the centre.
  const reportPrintStyle = document.createElement('style');
  reportPrintStyle.id = 'sangam-report-print-readability';
  reportPrintStyle.textContent = `
    #rkPrintArea .rk-report-paper.rk-supplied .rk-patient-box { font-size: 11.5px !important; line-height: 1.62 !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-patient-box strong { font-size: 9.8px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-supplied-table { font-size: 11px !important; line-height: 1.3 !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-supplied-table th { padding: 5px 8px !important; font-size: 9.6px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-supplied-table td { padding: 10px 8px !important; font-size: 11px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-supplied-table td:nth-child(2),
    #rkPrintArea .rk-report-paper.rk-supplied .rk-supplied-table td:nth-child(3),
    #rkPrintArea .rk-report-paper.rk-supplied .rk-supplied-table td:nth-child(4) { color: #111 !important; font-weight: 700 !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-supplied-table .test-name { font-size: 11.5px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-method { font-size: 8.8px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-department { font-size: 9.7px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-end { font-size: 8.8px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-supplied-sign { display: grid !important; grid-template-columns: 1fr 1fr !important; align-items: end !important; column-gap: 35mm !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-tech { display: block !important; justify-self: start !important; min-width: 45mm !important; font-size: 10px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .technician-signature-space { width: 42mm !important; height: 14mm !important; margin: 0 0 2mm !important; border-bottom: .35mm solid #557b75 !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-tech b { display: block !important; font-size: 10.5px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-tech small { display: block !important; margin-top: 1mm !important; font-size: 8.5px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-supplied-sign > div:last-child { justify-self: end !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-path b { font-size: 10.8px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-path .doctor-title { font-size: 11.8px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied .rk-verification { font-size: 8.2px !important; }
    #rkPrintArea .rk-report-paper.rk-supplied.rk-report-continuation { box-sizing: border-box !important; min-height: 297mm !important; height: 297mm !important; margin: 10mm auto !important; padding: 52mm 12mm 40mm !important; overflow: hidden !important; break-before: page !important; page-break-before: always !important; }
    #rkPrintArea .rk-report-paper.rk-supplied.rk-report-continuation::before { content: "" !important; display: block !important; position: absolute !important; inset: 0 !important; height: auto !important; background: url("report.jpeg") center / 210mm 297mm no-repeat !important; opacity: 1 !important; z-index: 0 !important; }
    #rkPrintArea .rk-report-paper.rk-supplied.rk-report-continuation::after { content: "" !important; display: block !important; position: absolute !important; top: 0 !important; right: 0 !important; left: 0 !important; bottom: auto !important; height: 52mm !important; background: #f0f8fc !important; opacity: 1 !important; z-index: 1 !important; pointer-events: none !important; }
    #rkPrintArea .rk-report-paper.rk-supplied.rk-report-continuation > * { position: relative !important; z-index: 3 !important; }
    #rkPrintArea .rk-report-paper.rk-supplied.rk-report-continuation .rk-supplied-sign { margin-top: 12mm !important; }
    @media print { #rkPrintArea .rk-report-paper.rk-supplied.rk-report-continuation { width: 210mm !important; margin: 0 !important; } }
  `;
  document.head.appendChild(reportPrintStyle);

  const applyReportPrintSettings = (root = document) => {
    $$('.rk-supplied-sign .rk-tech', root).forEach((panel) => {
      if (panel.dataset.pathologyInchargeReady) return;
      panel.dataset.pathologyInchargeReady = 'true';
      const signatureLine = document.createElement('div');
      signatureLine.className = 'technician-signature-space';
      signatureLine.setAttribute('aria-label', 'Pathology Incharge signature space');
      const label = document.createElement('b');
      label.textContent = 'Pathology Incharge';
      const caption = document.createElement('small');
      caption.textContent = 'Signature';
      panel.replaceChildren(signatureLine, label, caption);
    });
    $$('.rk-supplied-sign .doctor-title', root).forEach((title) => {
      if (title.textContent !== 'DR. Abha Mishra') title.textContent = 'DR. Abha Mishra';
    });
    $$('.rk-supplied-sign .rk-path', root).forEach((path) => {
      [...path.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === 'MBBS') node.textContent = 'MBBS, MD, PATH';
      });
    });
  };

  const paginateLongReports = (root = document) => {
    $$('#rkPrintArea .rk-report-paper.rk-supplied:not([data-rk-paginated])', root).forEach((paper) => {
      const table = $('.rk-supplied-table', paper);
      if (!table) return;
      const body = $('tbody', table);
      if (!body) return;
      const departmentRow = [...body.rows].find((row) => row.querySelector('.rk-department'));
      const resultRows = [...body.rows].filter((row) => row !== departmentRow);
      paper.dataset.rkPaginated = 'true';
      if (resultRows.length <= 5) return;

      const endMarker = $('.rk-end', paper);
      const signatures = $('.rk-supplied-sign', paper);
      const groups = [];
      let remaining = resultRows.length;
      const firstCount = Math.min(6, remaining - 2);
      groups.push(resultRows.splice(0, firstCount));
      remaining -= firstCount;
      while (remaining > 6) {
        const count = Math.min(8, remaining - 2);
        groups.push(resultRows.splice(0, count));
        remaining -= count;
      }
      groups.push(resultRows.splice(0, remaining));

      const makeTable = (rows) => {
        const nextTable = table.cloneNode(false);
        const header = $('thead', table)?.cloneNode(true);
        const nextBody = document.createElement('tbody');
        if (departmentRow) nextBody.appendChild(departmentRow.cloneNode(true));
        rows.forEach((row) => nextBody.appendChild(row));
        if (header) nextTable.appendChild(header);
        nextTable.appendChild(nextBody);
        return nextTable;
      };

      table.replaceWith(makeTable(groups.shift()));
      endMarker?.remove();
      signatures?.remove();
      let previousPage = paper;
      groups.forEach((rows, index) => {
        const continuation = paper.cloneNode(false);
        continuation.classList.add('rk-report-continuation');
        continuation.dataset.rkPaginated = 'true';
        continuation.appendChild(makeTable(rows));
        const isFinalPage = index === groups.length - 1;
        if (isFinalPage) {
          if (endMarker) continuation.appendChild(endMarker);
          if (signatures) continuation.appendChild(signatures);
        }
        previousPage.after(continuation);
        previousPage = continuation;
      });
    });
  };

  paginateLongReports();
  applyReportPrintSettings();
  new MutationObserver(() => {
    paginateLongReports();
    applyReportPrintSettings();
  }).observe(document.body, { childList: true, subtree: true });
})();
