(() => {
  'use strict';

  // Keep the Sangam report workflow aligned with the completed source workflow:
  // every booked investigation must have a saved catalogue rate.
  const form = document.getElementById('rkReportForm2');
  if (!form) return;

  const testsInput = form.elements.tests;
  const rateHint = document.getElementById('rkRateHint');
  const normalise = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const savedTests = () => {
    try {
      const data = JSON.parse(localStorage.getItem('sangamRkWorkflow') || '{}');
      return Array.isArray(data.tests) ? data.tests : [];
    } catch (_) {
      return [];
    }
  };
  const missingRates = () => {
    const catalogue = savedTests();
    return String(testsInput.value || '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .filter((name) => {
        const key = normalise(name);
        const test = catalogue.find((item) => normalise(item.name) === key);
        return !test || test.rate == null || test.rate === '';
      });
  };

  testsInput.addEventListener('input', () => testsInput.setCustomValidity(''));
  form.addEventListener('submit', (event) => {
    const missing = missingRates();
    if (!missing.length) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const message = `Add a rate for every selected test before booking: ${missing.join(', ')}.`;
    testsInput.setCustomValidity(message);
    if (rateHint) rateHint.textContent = message;
    document.querySelector('[data-nav="tests"]')?.click();
  }, true);
})();
