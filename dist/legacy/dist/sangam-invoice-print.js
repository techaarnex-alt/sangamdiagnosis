(() => {
  'use strict';

  const printStyle = document.createElement('style');
  printStyle.id = 'sangam-invoice-a4-print';
  printStyle.textContent = `
    @media screen {
      #rkInvoiceArea .rk-invoice { width: 100% !important; min-width: 0 !important; max-width: none !important; min-height: 0 !important; margin: 0 !important; padding: 16px 20px 20px !important; }
      #rkInvoiceArea .rk-invoice-head { grid-template-columns: 46px minmax(0, 1fr) 132px !important; gap: 9px !important; min-height: 0 !important; margin: 0 0 10px !important; padding: 5px 9px !important; }
      #rkInvoiceArea .rk-invoice-head img { width: 40px !important; height: 40px !important; }
      #rkInvoiceArea .rk-invoice-head h1 { font-size: 19px !important; }
      #rkInvoiceArea .rk-invoice-head p { margin: 1px 0 !important; line-height: 1.15 !important; }
      .rk-invoice-title { min-width: 0 !important; }
      .rk-invoice-title span { overflow-wrap: anywhere !important; }
    }
    @media print {
      @page { size: A4 portrait; margin: 5mm; }
      html, body { width: 200mm !important; min-width: 200mm !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .app { display: block !important; min-height: 0 !important; }
      .sidebar, .topbar, .intro, .stats, .main-grid, .sangam-dashboard, #moduleViews, .sangam-settings-page { display: none !important; }
      .shell, #rkWorkflow, .rk-shell { width: 200mm !important; min-width: 200mm !important; max-width: 200mm !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
      #rkWorkflow .rk-page { display: none !important; }
      #rkWorkflow .rk-page.active[data-rk-page="invoice"] { display: block !important; width: 200mm !important; min-width: 200mm !important; margin: 0 !important; padding: 0 !important; }
      #rkInvoiceArea .rk-invoice { box-sizing: border-box !important; display: block !important; width: 200mm !important; min-width: 200mm !important; max-width: 200mm !important; min-height: 0 !important; height: auto !important; margin: 0 !important; padding: 5mm !important; border: 0 !important; box-shadow: none !important; overflow: visible !important; break-inside: auto !important; page-break-inside: auto !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .rk-invoice:before { opacity: .025 !important; }
      #rkInvoiceArea .rk-invoice-head { display: grid !important; grid-template-columns: 50px minmax(0, 1fr) !important; align-items: center !important; min-height: 52px !important; gap: 10px !important; margin: 0 0 6px !important; padding: 6px 10px !important; overflow: visible !important; break-inside: avoid !important; page-break-inside: avoid !important; background: #d2d2d2 !important; border-bottom: 4px solid #444 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .rk-invoice-head:before { content: none !important; display: none !important; }
      .rk-invoice-head > img { display: block !important; width: 42px !important; height: 42px !important; visibility: visible !important; }
      .rk-invoice-head > div { display: block !important; min-width: 0 !important; visibility: visible !important; opacity: 1 !important; }
      .rk-invoice-head h1 { display: block !important; margin: 0 !important; color: #7c211d !important; font-size: 19px !important; line-height: 1.05 !important; visibility: visible !important; }
      .rk-invoice-head p { display: block !important; margin: 2px 0 !important; color: #3f3215 !important; font-size: 9px !important; line-height: 1.25 !important; visibility: visible !important; }
      .rk-invoice-title { display: none !important; }
      #rkInvoiceArea .rk-invoice-info { grid-template-columns: 1fr 1fr !important; gap: 16px !important; margin: 6px 0 !important; padding: 8px 10px !important; font-size: 11px !important; line-height: 1.45 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
      .rk-invoice-info strong { min-width: 31mm !important; font-size: inherit !important; }
      .rk-invoice-status { padding: 4px 8px !important; font-size: 10px !important; }
      .rk-invoice-table { font-size: 11px !important; line-height: normal !important; break-inside: auto !important; page-break-inside: auto !important; }
      .rk-invoice-table thead { display: table-header-group !important; }
      .rk-invoice-table tr { break-inside: avoid !important; page-break-inside: avoid !important; }
      .rk-invoice-table th { padding: 9px !important; font-size: inherit !important; background: #444 !important; color: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .rk-invoice-table td { padding: 10px 9px !important; }
      .rk-invoice-table td:first-child { width: 42px !important; font-size: inherit !important; }
      .rk-invoice-table td span { display: inline !important; }
      .rk-invoice-summary { width: 78mm !important; margin-top: 8px !important; font-size: 11px !important; break-inside: avoid !important; page-break-inside: avoid !important; }
      .rk-invoice-summary p { margin: 7px 0 !important; }
      .rk-invoice-summary .grand { padding-top: 8px !important; font-size: 14px !important; }
      .rk-invoice-foot { margin-top: 24px !important; padding-top: 8px !important; font-size: 10px !important; line-height: normal !important; break-inside: avoid !important; page-break-inside: avoid !important; }
      .rk-invoice-foot img { width: 100px !important; height: 38px !important; }
    }
  `;
  document.head.append(printStyle);
})();
