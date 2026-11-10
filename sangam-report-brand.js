(() => {
  'use strict';

  const replacements = [
    ['ARADHYA DIAGNOSTIC', 'NEW SANGAM DIAGNOSTIC CENTRE'],
    ['Aradhya Diagnostic', 'New Sangam Diagnostic Centre'],
    ['ARADHYA', 'SANGAM'],
    ['Aradhya', 'Sangam'],
  ];
  const replace = (value) => replacements.reduce((text, [from, to]) => text.split(from).join(to), String(value || ''));

  function brandReport(root) {
    if (!root) return;
    root.querySelectorAll('.rk-logo-box h1, .rk-report-head h1').forEach((heading) => {
      const name = 'NEW SANGAM DIAGNOSTIC CENTRE';
      if (heading.textContent !== name) heading.textContent = name;
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const updated = replace(node.nodeValue);
      if (updated !== node.nodeValue) node.nodeValue = updated;
    }
  }

  function refresh() {
    brandReport(document.getElementById('rkPrintArea'));
    brandReport(document.getElementById('rkReportPaper'));
  }

  const observer = new MutationObserver(refresh);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-rk-action="print"], #rkPrintReport')) refresh();
  }, true);
  window.addEventListener('beforeprint', refresh);
  refresh();
})();
