(() => {
  'use strict';

  const storageKey = 'sangamRkWorkflow';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalise = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const testProfiles = [
    { name: 'Liver Function Test (LFT)', aliases: ['lft', 'liver function test'], components: ['Bilirubin Total', 'Bilirubin Direct', 'Bilirubin Indirect', 'AST (SGOT)', 'ALT (SGPT)', 'Alkaline Phosphatase', 'GGT', 'Total Protein', 'Albumin', 'Globulin', 'A/G Ratio'] },
    { name: 'Kidney Function Test (KFT)', aliases: ['kft', 'kidney function test', 'renal function test', 'rft'], components: ['Blood Urea', 'Serum Creatinine', 'Uric Acid', 'Sodium', 'Potassium', 'Chloride'] },
    { name: 'Lipid Profile', aliases: ['lipid profile'], components: ['Cholesterol', 'Triglycerides', 'HDL Cholesterol', 'LDL Cholesterol', 'VLDL Cholesterol', 'Total Cholesterol / HDL Ratio', 'LDL / HDL Ratio'] },
    { name: 'Thyroid Profile', aliases: ['thyroid profile', 'thyroid function test', 'tft'], components: ['TSH', 'Free T3', 'Free T4'] },
    { name: 'Complete Blood Count (CBC)', aliases: ['cbc', 'complete blood count', 'complete blood picture', 'cbp'], components: ['Haemoglobin', 'Total Leukocyte Count', 'Platelet Count', 'RBC Count', 'PCV / Haematocrit', 'MCV', 'MCH', 'MCHC', 'Neutrophils', 'Lymphocytes', 'Eosinophils', 'Monocytes', 'Basophils'] },
    { name: 'Iron Profile', aliases: ['iron profile'], components: ['Serum Iron', 'TIBC', 'UIBC', 'Transferrin Saturation', 'Ferritin'] },
    { name: 'Electrolytes', aliases: ['electrolytes'], components: ['Sodium', 'Potassium', 'Chloride'] },
  ];
  const profileComponentNames = new Set(testProfiles.flatMap((profile) => profile.components.map(normalise)));
  const profileNames = new Set(testProfiles.flatMap((profile) => profile.aliases.map(normalise)));
  const readData = () => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return {
        patients: Array.isArray(value.patients) ? value.patients : [],
        reports: Array.isArray(value.reports) ? value.reports : [],
        tests: Array.isArray(value.tests) ? value.tests : [],
        doctors: Array.isArray(value.doctors) ? value.doctors : [],
        ...value,
      };
    } catch (_) {
      return { patients: [], reports: [], tests: [], doctors: [] };
    }
  };
  const writeData = (data) => localStorage.setItem(storageKey, JSON.stringify(data));
  const today = () => new Date().toLocaleDateString('en-GB');
  const isoDate = (value) => {
    const text = String(value || '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : '';
  };
  const formatDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
  };
  const testByName = (name, tests) => tests.find((test) => normalise(test.name) === normalise(name));

  function createPicker() {
    const form = $('#rkPatientForm2');
    if (!form || $('#rkPatientTestPicker')) return;
    const actions = $('.rk-actions', form);
    if (!actions) return;
    actions.insertAdjacentHTML('beforebegin', `
      <section class="sangam-test-picker" id="rkPatientTestPicker">
        <div class="sangam-test-picker__head"><b>Select tests for this visit</b><small>Choose one or more tests. A draft report and billing entry will be created from these selections.</small></div>
        <input id="rkPatientTestSearch" type="search" placeholder="Search tests by name or category" autocomplete="off">
        <small id="rkPatientTestMatches" aria-live="polite"></small>
        <div class="sangam-test-picker__list"></div>
      </section>`);
    $('#rkPatientTestSearch').addEventListener('input', filterPicker);
    $('#rkPatientTestPicker .sangam-test-picker__list').addEventListener('change', (event) => {
      const input = event.target;
      if (input.matches('[data-profile-toggle]')) {
        input.closest('[data-profile]')?.querySelectorAll('input[name="registeredTests"]').forEach((choice) => { choice.checked = input.checked; });
      }
      updateProfileToggles();
    });
    renderPicker();
    form.addEventListener('submit', onPatientRegistration, true);
    $('#rkTestForm')?.addEventListener('submit', () => window.setTimeout(renderPicker, 0), true);
  }

  function renderPicker() {
    const list = $('#rkPatientTestPicker .sangam-test-picker__list');
    if (!list) return;
    const selected = new Set($$('input[name="registeredTests"]:checked', list).map((input) => normalise(input.value)));
    const tests = readData().tests;
    const choice = (name) => {
      const test = testByName(name, tests);
      if (!test) return '';
      const checked = selected.has(normalise(test.name)) ? ' checked' : '';
      const rate = test.rate == null || test.rate === '' ? '' : ` · ₹${Number(test.rate).toFixed(2)}`;
      return `<label data-test-search="${escapeHtml(`${test.name || ''} ${test.category || ''}`)}"><input type="checkbox" name="registeredTests" value="${escapeHtml(test.name)}"${checked}> ${escapeHtml(test.name)}${rate}</label>`;
    };
    const profiles = testProfiles.map((profile) => {
      const components = profile.components.map(choice).join('');
      const allSelected = profile.components.length && profile.components.every((name) => selected.has(normalise(name)));
      return `<section class="sangam-test-profile" data-profile><label class="sangam-test-profile__toggle"><input type="checkbox" data-profile-toggle${allSelected ? ' checked' : ''}><span><b>${escapeHtml(profile.name)}</b><small>Tick all or choose only required components</small></span></label><div class="sangam-test-profile__items">${components}</div></section>`;
    }).join('');
    const individual = tests.filter((test) => !profileComponentNames.has(normalise(test.name)) && !profileNames.has(normalise(test.name))).map((test) => choice(test.name)).join('');
    list.innerHTML = tests.length ? `${profiles}<details class="sangam-test-individual"><summary>Other individual tests</summary><div>${individual}</div></details>` : '<small>No tests are available. Add them in Test Catalogue first.</small>';
    updateProfileToggles();
    filterPicker();
  }

  function updateProfileToggles() {
    $$('[data-profile]', $('#rkPatientTestPicker') || document).forEach((profile) => {
      const choices = $$('input[name="registeredTests"]', profile);
      const selected = choices.filter((input) => input.checked).length;
      const toggle = $('[data-profile-toggle]', profile);
      if (!toggle) return;
      toggle.checked = Boolean(choices.length) && selected === choices.length;
      toggle.indeterminate = selected > 0 && selected < choices.length;
    });
  }

  function filterPicker() {
    const query = String($('#rkPatientTestSearch')?.value || '').trim().toLowerCase();
    const options = $$('[data-test-search]', $('#rkPatientTestPicker') || document);
    const matches = options.filter((item) => !query || item.dataset.testSearch.toLowerCase().includes(query));
    options.forEach((item) => item.classList.toggle('hidden', !matches.includes(item)));
    const notice = $('#rkPatientTestMatches');
    if (notice) notice.textContent = query
      ? (matches.length ? `${matches.length} matching test${matches.length === 1 ? '' : 's'} — select the required option(s).` : `No tests match “${query}”.`)
      : `${options.length} tests available — search to narrow the list.`;
  }

  function onPatientRegistration(event) {
    const form = event.currentTarget;
    const selectedTests = $$('input[name="registeredTests"]:checked', form).map((input) => input.value.trim()).filter(Boolean);
    const notice = $('#rkPatientTestMatches');
    if (!selectedTests.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (notice) notice.textContent = 'Select at least one test before saving this patient visit.';
      $('#rkPatientTestPicker')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    const beforeIds = new Set(readData().patients.map((patient) => patient.id));
    window.setTimeout(() => {
      const data = readData();
      const patient = data.patients.find((item) => !beforeIds.has(item.id));
      if (!patient) return;
      patient.tests = selectedTests;
      const nextReport = data.reports.reduce((max, report) => {
        const match = /(?:SD|AD)-R-(\d+)/i.exec(String(report.reportNo || ''));
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0) + 1;
      const rates = selectedTests.map((name) => Number(testByName(name, data.tests)?.rate || 0));
      data.reports.unshift({
        id: `REP-${String(data.reports.length + 1).padStart(4, '0')}`,
        reportNo: `SD-R-${String(nextReport).padStart(4, '0')}`,
        patientId: patient.id,
        specimen: 'Blood', tests: selectedTests, results: {}, status: 'Draft',
        value: '', units: '', range: '', test: selectedTests[0] || '', notes: '',
        createdOn: today(), reportedOn: '', fee: rates.reduce((sum, rate) => sum + rate, 0), paid: 0,
        testRates: rates,
      });
      writeData(data);
      window.location.reload();
    }, 0);
  }

  function enhancePatientRows() {
    const header = $('#rkPatientRows2')?.closest('table')?.querySelector('thead tr');
    if (header && !header.querySelector('.sangam-selected-tests-heading')) {
      const heading = document.createElement('th');
      heading.className = 'sangam-selected-tests-heading';
      heading.textContent = 'Selected tests';
      header.insertBefore(heading, header.lastElementChild);
    }
    const byId = new Map(readData().patients.map((patient) => [String(patient.id), patient]));
    $$('#rkPatientRows2 tr').forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 6) return;
      let cell = $('.sangam-selected-tests', row);
      if (!cell) {
        cell = document.createElement('td');
        cell.className = 'sangam-selected-tests';
        row.insertBefore(cell, row.lastElementChild);
      }
      const patient = byId.get(cells[0].textContent.trim());
      cell.textContent = patient?.tests?.length ? patient.tests.join(', ') : 'No tests selected';
    });
  }

  function prefillPatientTests() {
    const select = $('#rkPatientChoice');
    const testsInput = $('#rkReportForm2 [name="tests"]');
    if (!select || !testsInput) return;
    select.addEventListener('change', () => {
      const patient = readData().patients.find((item) => item.id === select.value);
      if (!patient?.tests?.length) return;
      testsInput.value = patient.tests.join(', ');
      testsInput.dispatchEvent(new Event('input', { bubbles: true }));
    }, true);
  }

  function focusedResults() {
    const area = $('#rkResultsArea');
    if (!area || $('.sangam-result-chooser', area)) return;
    const cards = $$('.rk-card', area).filter((card) => $('[data-rk-result-form]', card));
    if (cards.length < 2) return;
    const chooser = document.createElement('section');
    chooser.className = 'sangam-result-chooser';
    chooser.innerHTML = `<b>Select a report for result entry</b><div>${cards.map((card, index) => `<button type="button" data-result-index="${index}">${escapeHtml($('h3', card)?.textContent || `Draft ${index + 1}`)}</button>`).join('')}</div>`;
    area.prepend(chooser);
    const show = (index) => {
      cards.forEach((card, itemIndex) => card.classList.toggle('sangam-result-hidden', itemIndex !== index));
      $$('button', chooser).forEach((button, itemIndex) => button.classList.toggle('active', itemIndex === index));
    };
    chooser.addEventListener('click', (event) => {
      const button = event.target.closest('[data-result-index]');
      if (button) show(Number(button.dataset.resultIndex));
    });
    show(0);
  }

  function businessRange(mode, selectedDate) {
    const [year, month, day] = String(selectedDate || '').split('-').map(Number);
    if (!year || !month || !day) return null;
    const start = new Date(year, month - 1, day);
    const end = new Date(start);
    if (mode === 'weekly') {
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      end.setTime(start.getTime()); end.setDate(start.getDate() + 6);
    } else if (mode === 'monthly') {
      start.setDate(1); end.setMonth(end.getMonth() + 1, 0);
    }
    const asIso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { start: asIso(start), end: asIso(end) };
  }

  function enhanceBusinessReport() {
    const period = $('#rkBusinessPeriod');
    const date = $('#rkBusinessDate');
    const page = $('[data-rk-page="business"]');
    if (!period || !date || !page) return;
    if (!period.dataset.sangamPeriods) {
      period.innerHTML = '<option value="daily">Day</option><option value="weekly">Week</option><option value="monthly">Month</option>';
      period.dataset.sangamPeriods = 'true';
      const reportCard = $('.rk-card', page);
      reportCard?.insertAdjacentHTML('afterend', '<article class="rk-card sangam-business-patients"><div class="rk-card-title"><div><h3>Registered patients</h3><p id="sangamBusinessPatientLabel">Patients registered in the selected period</p></div></div><div class="rk-table-wrap"><table class="rk-table"><thead><tr><th>Patient ID</th><th>Registration date</th><th>Patient</th><th>Age / gender</th><th>Mobile</th></tr></thead><tbody id="sangamBusinessPatientRows"></tbody></table></div></article>');
      period.addEventListener('change', () => window.setTimeout(renderBusiness, 0));
      date.addEventListener('change', () => window.setTimeout(renderBusiness, 0));
    }
    renderBusiness();
  }

  function renderBusiness() {
    const period = $('#rkBusinessPeriod');
    const date = $('#rkBusinessDate');
    if (!period || !date) return;
    if (!date.value) date.value = new Date().toISOString().slice(0, 10);
    const range = businessRange(period.value, date.value);
    if (!range) return;
    const inRange = (value) => { const iso = isoDate(value); return iso && iso >= range.start && iso <= range.end; };
    const data = readData();
    const patients = data.patients.filter((patient) => inRange(patient.createdOn));
    const reports = data.reports.filter((report) => inRange(report.createdOn));
    const paid = data.reports.filter((report) => Number(report.paid || 0) && inRange(report.paidOn || report.createdOn));
    const collected = paid.reduce((sum, report) => sum + Number(report.paid || 0), 0);
    const billed = reports.reduce((sum, report) => sum + Number(report.fee || 0), 0);
    const due = reports.reduce((sum, report) => sum + Math.max(0, Number(report.fee || 0) - Number(report.paid || 0)), 0);
    const label = period.value === 'daily' ? formatDate(date.value) : `${formatDate(range.start)} to ${formatDate(range.end)}`;
    const metrics = $('#rkBusinessMetrics');
    if (metrics) metrics.innerHTML = `<article class="rk-business-metric"><span>Patients registered</span><b>${patients.length}</b><small>New records in this period</small></article><article class="rk-business-metric"><span>Income collected</span><b>₹${collected.toFixed(2)}</b><small>Payments received in this period</small></article><article class="rk-business-metric"><span>Billed value</span><b>₹${billed.toFixed(2)}</b><small>${reports.length} report${reports.length === 1 ? '' : 's'} created</small></article><article class="rk-business-metric due"><span>Outstanding</span><b>₹${due.toFixed(2)}</b><small>Balance on reports created</small></article>`;
    const title = $('#rkBusinessPeriodLabel');
    if (title) title.textContent = `${period.options[period.selectedIndex].text} billing activity · ${label}`;
    const patientLabel = $('#sangamBusinessPatientLabel');
    if (patientLabel) patientLabel.textContent = `${period.options[period.selectedIndex].text} registrations · ${label}`;
    const rows = $('#sangamBusinessPatientRows');
    if (rows) rows.innerHTML = patients.length ? patients.map((patient) => `<tr><td><b>${escapeHtml(patient.id)}</b></td><td>${escapeHtml(patient.createdOn || '—')}</td><td>${escapeHtml(patient.name)}</td><td>${escapeHtml(`${patient.age || '—'} ${patient.ageUnit || 'years'} / ${patient.gender || '—'}`)}</td><td>${escapeHtml(patient.mobile || '—')}</td></tr>`).join('') : '<tr><td colspan="5">No patients were registered in this selected period.</td></tr>';
  }

  function install() {
    createPicker();
    prefillPatientTests();
    enhancePatientRows();
    focusedResults();
    enhanceBusinessReport();
    let parityRefreshQueued = false;
    const observer = new MutationObserver(() => {
      if (parityRefreshQueued) return;
      parityRefreshQueued = true;
      requestAnimationFrame(() => {
        parityRefreshQueued = false;
        enhancePatientRows();
        focusedResults();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  install();
})();
