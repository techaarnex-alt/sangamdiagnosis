(() => {
  'use strict';

  /*
   * Report-time biological reference engine.
   * These are adult defaults assembled from standard published references. They
   * are intentionally stored with their rule, rather than parsed from display
   * text, so the High/Low flag always uses the same limits shown on the report.
   * Paediatric, pregnancy, method-specific and qualitative investigations are
   * not forced into a numeric high/low rule.
   */
  const storageKey = 'sangamRkWorkflow';
  const schemaVersion = 1;
  const normalise = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const references = new Map();
  const add = (names, definition) => names.forEach((name) => references.set(normalise(name), definition));
  const numeric = (units, low, high, text, options = {}) => ({ type: 'numeric', units, low, high, text, ...options });
  const qualitative = (text, options = {}) => ({ type: 'qualitative', text, ...options });

  // Haematology
  add(['haemoglobin', 'hemoglobin', 'hb'], numeric('g/dL', 12, 16, 'Male 13-18 g/dL; Female 12-16 g/dL', { sex: { male: [13, 18], female: [12, 16] } }));
  add(['total leukocyte count', 'wbc', 'tlc'], numeric('/µL', 4500, 11000, '4,500-11,000 /µL'));
  add(['platelet count', 'platelets'], numeric('/µL', 150000, 400000, '150,000-400,000 /µL'));
  add(['rbc count', 'red blood cell count'], numeric('million/µL', 4.2, 5.4, 'Male 4.6-6.2; Female 4.2-5.4 million/µL', { sex: { male: [4.6, 6.2], female: [4.2, 5.4] } }));
  add(['pcv haematocrit', 'pcv', 'hematocrit'], numeric('%', 36, 48, 'Male 40-55%; Female 36-48%', { sex: { male: [40, 55], female: [36, 48] } }));
  add(['mcv'], numeric('fL', 80, 100, '80-100 fL'));
  add(['mch'], numeric('pg', 27, 32, '27-32 pg'));
  add(['mchc'], numeric('g/dL', 32, 36, '32-36 g/dL'));
  add(['neutrophils', 'neutrophil'], numeric('%', 40, 60, '40-60%'));
  add(['lymphocytes', 'lymphocyte'], numeric('%', 20, 40, '20-40%'));
  add(['eosinophils', 'eosinophil'], numeric('%', 1, 6, '1-6%'));
  add(['monocytes', 'monocyte'], numeric('%', 2, 8, '2-8%'));
  add(['basophils', 'basophil'], numeric('%', 0, 1, '0-1%'));
  add(['esr', 'erythrocyte sedimentation rate'], numeric('mm/hr', 0, 20, 'Male 0-15; Female 0-20 mm/hr', { sex: { male: [0, 15], female: [0, 20] } }));
  add(['reticulocyte count'], numeric('%', 0.5, 2.5, '0.5-2.5%'));
  add(['serum iron'], numeric('µg/dL', 60, 170, '60-170 µg/dL'));
  add(['tibc', 'total iron binding capacity'], numeric('µg/dL', 240, 450, '240-450 µg/dL'));
  add(['uibc'], numeric('µg/dL', 150, 375, '150-375 µg/dL'));
  add(['transferrin saturation'], numeric('%', 20, 50, '20-50%'));
  add(['ferritin', 'serum ferritin'], numeric('ng/mL', 11, 307, 'Male 24-336; Female 11-307 ng/mL', { sex: { male: [24, 336], female: [11, 307] } }));
  add(['cbc', 'complete blood count', 'complete blood picture', 'cbp'], qualitative('Individual CBC component ranges shown below.'));
  add(['iron profile'], qualitative('Individual iron-profile component ranges shown below.'));
  add(['peripheral smear', 'ps examination'], qualitative('Morphology as reported.'));

  // Coagulation
  add(['prothrombin time inr', 'pt inr'], qualitative('PT 11-14 seconds; INR 0.8-1.2.'));
  add(['aptt', 'activated partial thromboplastin time'], numeric('seconds', 25, 35, '25-35 seconds'));

  // Glucose / diabetes
  add(['blood sugar fasting', 'fasting blood sugar', 'fasting glucose', 'fbs', 'fasting plasma glucose'], numeric('mg/dL', 70, 99, '70-99 mg/dL (fasting)'));
  add(['blood sugar post prandial', 'ppbs', 'post prandial blood sugar'], numeric('mg/dL', null, 140, '<140 mg/dL at 2 hours'));
  add(['blood sugar random', 'random blood sugar', 'random glucose', 'rbs'], numeric('mg/dL', null, 140, '<140 mg/dL (non-fasting reference)'));
  add(['hba1c', 'hb a1c', 'hemoglobin a1c', 'glycated hemoglobin'], numeric('%', null, 5.7, '<5.7% (non-diabetic reference)'));
  add(['glucose tolerance test', 'gtt', 'ogtt'], qualitative('Use the collection-time-specific laboratory protocol.'));

  // Liver, renal and electrolytes
  add(['bilirubin total', 'total bilirubin'], numeric('mg/dL', 0.1, 1.2, '0.1-1.2 mg/dL'));
  add(['bilirubin direct', 'direct bilirubin'], numeric('mg/dL', 0, 0.3, '0.0-0.3 mg/dL'));
  add(['bilirubin indirect', 'indirect bilirubin'], numeric('mg/dL', 0.2, 0.9, '0.2-0.9 mg/dL'));
  add(['ast sgot', 'sgot', 'ast'], numeric('U/L', 8, 33, '8-33 U/L'));
  add(['alt sgpt', 'sgpt', 'alt'], numeric('U/L', 4, 36, '4-36 U/L'));
  add(['alkaline phosphatase', 'alp'], numeric('U/L', 20, 130, '20-130 U/L (adult)'));
  add(['ggt', 'gamma glutamyl transferase'], numeric('U/L', 5, 36, 'Male 8-61; Female 5-36 U/L', { sex: { male: [8, 61], female: [5, 36] } }));
  add(['total protein'], numeric('g/dL', 6, 8.3, '6.0-8.3 g/dL'));
  add(['albumin', 'serum albumin'], numeric('g/dL', 3.4, 5.4, '3.4-5.4 g/dL'));
  add(['globulin'], numeric('g/dL', 2, 3.5, '2.0-3.5 g/dL'));
  add(['a g ratio', 'albumin globulin ratio'], numeric('', 1, 2.5, '1.0-2.5'));
  add(['blood urea', 'urea'], numeric('mg/dL', 15, 40, '15-40 mg/dL'));
  add(['bun', 'blood urea nitrogen'], numeric('mg/dL', 6, 20, '6-20 mg/dL'));
  add(['serum creatinine', 'creatinine'], numeric('mg/dL', 0.6, 1.3, '0.6-1.3 mg/dL (adult)'));
  add(['uric acid', 'serum uric acid'], numeric('mg/dL', 2.4, 6, 'Male 3.4-7.0; Female 2.4-6.0 mg/dL', { sex: { male: [3.4, 7], female: [2.4, 6] } }));
  add(['sodium'], numeric('mmol/L', 135, 145, '135-145 mmol/L'));
  add(['potassium'], numeric('mmol/L', 3.7, 5.2, '3.7-5.2 mmol/L'));
  add(['chloride'], numeric('mmol/L', 96, 106, '96-106 mmol/L'));
  add(['calcium', 'serum calcium'], numeric('mg/dL', 8.5, 10.2, '8.5-10.2 mg/dL'));
  add(['phosphorus', 'serum phosphorus', 'phosphate'], numeric('mg/dL', 2.5, 4.5, '2.5-4.5 mg/dL'));
  add(['amylase', 'serum amylase'], numeric('U/L', 30, 110, '30-110 U/L'));
  add(['lipase', 'serum lipase'], numeric('U/L', 13, 60, '13-60 U/L'));
  add(['ldh', 'lactate dehydrogenase'], numeric('U/L', 140, 280, '140-280 U/L'));
  add(['cpk', 'creatine phosphokinase', 'ck'], numeric('U/L', 30, 200, 'Male 39-308; Female 26-192 U/L', { sex: { male: [39, 308], female: [26, 192] } }));
  add(['lft', 'liver function test', 'hepatic function panel'], qualitative('Individual LFT component ranges shown below.'));
  add(['kft', 'kidney function test', 'renal function test', 'rft'], qualitative('Individual KFT component ranges shown below.'));
  add(['electrolytes', 'serum electrolytes'], qualitative('Sodium 135-145; Potassium 3.7-5.2; Chloride 96-106 mmol/L.'));

  // Lipids and endocrine
  add(['cholesterol', 'total cholesterol'], numeric('mg/dL', null, 200, '<200 mg/dL (desirable)'));
  add(['triglycerides', 'tg'], numeric('mg/dL', null, 150, '<150 mg/dL'));
  add(['hdl cholesterol', 'hdl'], numeric('mg/dL', 40, null, 'Male >=40; Female >=50 mg/dL', { sex: { male: [40, null], female: [50, null] } }));
  add(['ldl cholesterol', 'ldl'], numeric('mg/dL', null, 100, '<100 mg/dL (optimal)'));
  add(['vldl cholesterol', 'vldl'], numeric('mg/dL', 2, 30, '2-30 mg/dL'));
  add(['total cholesterol hdl ratio'], numeric('', null, 5, '<5.0'));
  add(['ldl hdl ratio'], numeric('', null, 3, '<3.0'));
  add(['lipid profile', 'lipid panel', 'cholesterol profile'], qualitative('Individual lipid component ranges shown below.'));
  add(['tsh', 'thyroid stimulating hormone', 'thyrotropin'], numeric('µU/mL', 0.4, 4.8, '0.4-4.8 µU/mL (non-pregnant adult)'));
  add(['free t3', 'ft3'], numeric('pg/mL', 2, 4.4, '2.0-4.4 pg/mL'));
  add(['free t4', 'ft4', 'free thyroxine'], numeric('ng/dL', 0.8, 1.9, '0.8-1.9 ng/dL'));
  add(['thyroid profile', 'thyroid function test', 'tft'], qualitative('Individual thyroid component ranges shown below.'));
  add(['vitamin d', '25 oh vitamin d', '25 hydroxy vitamin d'], numeric('ng/mL', 20, 100, '20-100 ng/mL (25-hydroxy vitamin D)'));
  add(['vitamin b12'], numeric('pg/mL', 200, 900, '200-900 pg/mL'));
  add(['folate', 'folic acid'], numeric('ng/mL', 3, 17, '3-17 ng/mL'));

  // Immunology / tumour markers
  add(['crp', 'c reactive protein'], numeric('mg/L', null, 10, '<10 mg/L'));
  add(['rheumatoid factor', 'rf'], numeric('IU/mL', null, 14, '<14 IU/mL'));
  add(['aso titre', 'antistreptolysin o'], numeric('IU/mL', null, 200, '<200 IU/mL'));
  add(['ana', 'antinuclear antibody'], qualitative('Negative.'));
  add(['psa', 'prostate specific antigen'], numeric('ng/mL', null, 4, '<4.0 ng/mL (adult screening reference; age-specific interpretation)'));
  add(['ca 125', 'ca125'], numeric('U/mL', null, 35, '<35 U/mL'));
  add(['cea'], numeric('ng/mL', null, 3, 'Non-smoker <3.0; smoker <5.0 ng/mL'));
  add(['afp', 'alpha fetoprotein'], numeric('ng/mL', null, 10, '<10 ng/mL (non-pregnant adult)'));
  add(['beta hcg', 'serum beta hcg', 'bhcg'], qualitative('Non-pregnant: <5 mIU/mL; interpret by gestational age when pregnant.'));

  // Qualitative / method- or specimen-dependent investigations.
  add(['blood group rh', 'blood grouping'], qualitative('ABO / RhD group as reported.'));
  add(['urine routine microscopy', 'urine routine', 'urine examination', 'urinalysis'], qualitative('Protein, glucose, ketones, bilirubin and nitrite: Negative.'));
  add(['urine culture sensitivity', 'urine c s', 'urine culture'], qualitative('No significant growth / as reported.'));
  add(['stool routine microscopy', 'stool routine', 'stool examination'], qualitative('As reported.'));
  add(['stool occult blood', 'occult blood'], qualitative('Negative.'));
  add(['semen analysis', 'semen examination'], qualitative('WHO method-specific reference values / as reported.'));
  add(['pregnancy test urine', 'upt'], qualitative('Negative.'));
  ['hiv 1 2', 'hiv', 'hbsag', 'hepatitis b surface antigen', 'anti hcv', 'hcv antibody', 'vdrl', 'rpr', 'dengue ns1 antigen', 'dengue ns1', 'dengue igm', 'typhidot igm'].forEach((name) => add([name], qualitative('Non-reactive / Negative.')));
  add(['widal test', 'typhoid serology'], qualitative('Interpret with titre, local baseline and clinical findings.'));
  add(['malaria parasite', 'mp', 'malaria smear'], qualitative('Not seen.'));
  add(['blood culture sensitivity', 'blood c s', 'blood culture', 'sputum culture sensitivity', 'sputum c s', 'sputum culture'], qualitative('No growth / as reported.'));
  add(['afb stain', 'acid fast bacilli stain'], qualitative('AFB not seen.'));
  add(['gram stain', 'pap smear', 'cervical cytology', 'fnac', 'fine needle aspiration cytology', 'histopathology small specimen', 'histopathology large specimen'], qualitative('As reported.'));

  const parseStoredRange = (text, units = '', patient = {}) => {
    const range = String(text || '').trim();
    if (!range) return null;
    const sex = String(patient.gender || '').toLowerCase();
    // Pick the patient-specific segment first when a catalogue range carries both sexes.
    const selected = sex === 'male' || sex === 'female'
      ? (new RegExp(`${sex}[^;,.]*`, 'i').exec(range)?.[0] || range)
      : range;
    const decimal = '(-?\\d+(?:\\.\\d+)?)';
    const interval = new RegExp(`${decimal}\\s*(?:-|–|to)\\s*${decimal}`, 'i').exec(selected);
    if (interval) return numeric(units, Number(interval[1]), Number(interval[2]), range);
    const upper = new RegExp(`(?:<|less than|below|up to|<=|≤)\\s*${decimal}`, 'i').exec(selected);
    if (upper) return numeric(units, null, Number(upper[1]), range);
    const lower = new RegExp(`(?:>|more than|above|at least|>=|≥)\\s*${decimal}`, 'i').exec(selected);
    if (lower) return numeric(units, Number(lower[1]), null, range);
    return { type: 'qualitative', units, text: range };
  };
  const referenceFor = (name, patient = {}) => {
    const rule = references.get(normalise(name));
    if (!rule) {
      const stored = (readData().tests || []).find((test) => normalise(test.name) === normalise(name));
      const parsed = parseStoredRange(stored?.range, stored?.units || '', patient);
      return parsed || { type: 'unconfigured', units: '', text: 'Reference range unavailable - laboratory validation required.' };
    }
    let low = rule.low;
    let high = rule.high;
    const sex = String(patient.gender || '').toLowerCase();
    if (rule.sex && (sex === 'male' || sex === 'female')) [low, high] = rule.sex[sex];
    return { ...rule, low, high };
  };
  const textFor = (name, patient) => referenceFor(name, patient).text;
  const numericValue = (raw) => {
    const match = String(raw || '').trim().replace(',', '.').match(/^-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  };
  const flagFor = (name, value, patient) => {
    const reference = referenceFor(name, patient);
    const number = numericValue(value);
    if (reference.type !== 'numeric' || number === null || !Number.isFinite(number)) return '';
    if (reference.low != null && number < reference.low) return 'Low';
    if (reference.high != null && number > reference.high) return 'High';
    return '';
  };
  const readData = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) { return {}; } };
  const writeData = (data) => localStorage.setItem(storageKey, JSON.stringify(data));
  const patientForReport = (report) => {
    const data = readData();
    return (data.patients || []).find((patient) => patient.id === report?.patientId) || {};
  };
  const reportForForm = (form) => (readData().reports || []).find((report) => report.id === form.dataset.rkResultForm);

  // Migrate all supplied catalogue entries once. Existing reports retain their
  // recorded result range; new result entry always receives the automatic range.
  const data = readData();
  let changed = false;
  if (Array.isArray(data.tests) && data.sangamReferenceEngineVersion !== schemaVersion) {
    data.tests.forEach((test) => {
      const reference = referenceFor(test.name);
      if (reference.type === 'unconfigured') return;
      if (test.range !== reference.text || test.units !== (reference.units || test.units || '') || !test.autoReference) {
        test.range = reference.text;
        if (reference.units) test.units = reference.units;
        test.autoReference = true;
        test.referenceRuleVersion = schemaVersion;
        changed = true;
      }
    });
    data.sangamReferenceEngineVersion = schemaVersion;
    writeData(data);
    changed = true;
  }
  if (changed) { window.location.reload(); return; }

  const style = document.createElement('style');
  style.textContent = `
    .sangam-auto-reference { background:#f1faf7!important; color:#275b51!important; cursor:not-allowed; }
    .sangam-auto-reference-note { grid-column:1/-1; margin:0; color:#47635f; font-size:11px; }
    .sangam-result-flag { display:inline-block; margin:6px 0 0; padding:3px 7px; border-radius:999px; font:800 10px/1 Arial,sans-serif; letter-spacing:.04em; text-transform:uppercase; }
    .sangam-result-flag.high { background:#ffe3e0; color:#a5271c; border:1px solid #f3bbb4; }
    .sangam-result-flag.low { background:#e9efff; color:#2456a3; border:1px solid #c5d6ff; }
    .rk-supplied-table .sangam-result-flag { margin:4px 0 0; font-size:8px; }
    #rkTestForm .sangam-auto-reference-note { margin-top:-5px; }
  `;
  document.head.appendChild(style);

  function setRangeForEntry(entry, report) {
    const test = entry.dataset.rkTest || '';
    const patient = patientForReport(report);
    const reference = referenceFor(test, patient);
    const rangeInput = entry.querySelector('[name="range"]');
    const unitsInput = entry.querySelector('[name="units"]');
    if (rangeInput) {
      rangeInput.value = reference.text;
      rangeInput.readOnly = true;
      rangeInput.classList.add('sangam-auto-reference');
      const label = rangeInput.closest('label');
      if (label) label.firstChild.nodeValue = 'Reference range (automatic)';
    }
    const legacyHint = entry.querySelector('.rk-reference-hint');
    if (legacyHint) {
      legacyHint.textContent = reference.type === 'unconfigured'
        ? 'This investigation has no configured numeric rule, so High/Low is not calculated.'
        : 'Automatic reference rule: the displayed range and any High/Low marker are calculated together.';
    }
    if (unitsInput && reference.units) {
      unitsInput.value = reference.units;
      unitsInput.readOnly = true;
      unitsInput.classList.add('sangam-auto-reference');
    }
    let note = entry.querySelector('.sangam-auto-reference-note');
    if (!note) {
      note = document.createElement('p');
      note.className = 'sangam-auto-reference-note';
      const form = entry.querySelector('.rk-form');
      form?.appendChild(note);
    }
    note.textContent = reference.type === 'unconfigured'
      ? 'No numeric auto-flag is applied because this test is not in the configured catalogue.'
      : 'Reference range is applied automatically. No manual entry is needed.';
    const valueInput = entry.querySelector('[name="value"]');
    const updateFlag = () => {
      const flag = flagFor(test, valueInput?.value, patient);
      let badge = entry.querySelector('.sangam-result-flag');
      if (!flag) { badge?.remove(); return; }
      if (!badge) { badge = document.createElement('span'); badge.className = 'sangam-result-flag'; valueInput?.insertAdjacentElement('afterend', badge); }
      badge.className = `sangam-result-flag ${flag.toLowerCase()}`;
      badge.textContent = flag;
    };
    if (valueInput && !valueInput.dataset.sangamFlagBound) {
      valueInput.dataset.sangamFlagBound = 'true';
      valueInput.addEventListener('input', updateFlag);
    }
    updateFlag();
  }

  function enhanceResultEntry() {
    document.querySelectorAll('[data-rk-result-form]').forEach((form) => {
      const report = reportForForm(form);
      form.querySelectorAll('[data-rk-test]').forEach((entry) => setRangeForEntry(entry, report));
    });
  }

  function addFlagsToPrintedReport() {
    const heading = document.getElementById('rkReportHeading')?.textContent || '';
    const reportNo = heading.split('·').pop()?.trim();
    const report = (readData().reports || []).find((item) => item.reportNo === reportNo);
    if (!report) return;
    const patient = patientForReport(report);
    document.querySelectorAll('#rkPrintArea tr').forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2 || row.querySelector('.sangam-result-flag')) return;
      const test = cells[0].querySelector('b')?.textContent || cells[0].textContent;
      const value = cells[1].textContent;
      const flag = flagFor(test, value, patient);
      if (!flag) return;
      const badge = document.createElement('span');
      badge.className = `sangam-result-flag ${flag.toLowerCase()}`;
      badge.textContent = flag;
      cells[1].appendChild(document.createElement('br'));
      cells[1].appendChild(badge);
    });
  }

  function configureTestCatalogue() {
    const form = document.getElementById('rkTestForm');
    if (form && !form.dataset.sangamReferences) {
      form.dataset.sangamReferences = 'true';
      const name = form.elements.name;
      const units = form.elements.units;
      const range = form.elements.range;
      if (name && range) {
        range.required = false;
        range.readOnly = true;
        range.classList.add('sangam-auto-reference');
        range.closest('label').firstChild.nodeValue = 'Reference range (automatic)';
        const apply = () => {
          const reference = referenceFor(name.value);
          range.value = reference.text;
          if (reference.units) { units.value = reference.units; units.readOnly = true; units.classList.add('sangam-auto-reference'); }
          else { units.readOnly = false; units.classList.remove('sangam-auto-reference'); }
        };
        name.addEventListener('input', apply);
        form.addEventListener('submit', apply, true);
        apply();
      }
    }
    document.querySelectorAll('[data-rk-page="tests"] .rk-reference-hint').forEach((hint) => {
      const message = 'Reference ranges are applied automatically from the configured biological reference library. Qualitative and method-specific investigations are shown as their expected result.';
      if (hint.textContent !== message) hint.textContent = message;
    });
    document.querySelectorAll('#rkTestRows textarea[data-test-range]').forEach((input) => {
      input.readOnly = true;
      input.classList.add('sangam-auto-reference');
    });
  }

  // Capture runs before the workflow's own submit handler, guaranteeing that it
  // saves the current automatic range and unit without operator intervention.
  document.addEventListener('submit', (event) => {
    const form = event.target.closest?.('[data-rk-result-form]');
    if (!form) return;
    const report = reportForForm(form);
    form.querySelectorAll('[data-rk-test]').forEach((entry) => setRangeForEntry(entry, report));
  }, true);

  let queued = false;
  const refresh = () => {
    queued = false;
    enhanceResultEntry();
    addFlagsToPrintedReport();
    configureTestCatalogue();
  };
  const observe = () => {
    const observer = new MutationObserver(() => {
      if (!queued) { queued = true; requestAnimationFrame(refresh); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    refresh();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe); else observe();
})();
