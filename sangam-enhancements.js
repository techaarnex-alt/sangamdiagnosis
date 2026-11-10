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
})();
