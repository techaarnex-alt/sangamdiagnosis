import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE_KEY = 'sangam-react-workflow-v1';
const TESTS = [
  { name: 'Blood Urea', unit: 'mg/dL', range: '13.00–43.00' },
  { name: 'Serum Creatinine', unit: 'mg/dL', range: '0.60–1.30' },
  { name: 'Blood Glucose (Fasting)', unit: 'mg/dL', range: '70–100' },
  { name: 'Haemoglobin', unit: 'g/dL', range: 'Male: 13.0–17.0 · Female: 12.0–15.0' },
  { name: 'Total Cholesterol', unit: 'mg/dL', range: 'Desirable: <200' },
  { name: 'TSH', unit: 'µIU/mL', range: '0.40–4.50' },
  { name: 'ALT (SGPT)', unit: 'U/L', range: '7–56' },
  { name: 'Bilirubin Total', unit: 'mg/dL', range: '0.30–1.20' },
];

const date = () => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
const makeId = (prefix, count) => `${prefix}-${String(count + 1).padStart(4, '0')}`;
const normalise = (value = {}) => ({
  patients: Array.isArray(value.patients) ? value.patients : [],
  reports: Array.isArray(value.reports) ? value.reports.map((report) => ({ ...report, fee: Number(report.fee || 0), paid: Number(report.paid || 0), tests: Array.isArray(report.tests) ? report.tests : [] })) : [],
  doctors: Array.isArray(value.doctors) ? value.doctors : [],
  tests: Array.isArray(value.tests) && value.tests.length ? value.tests.map((test) => ({ name: test.name, unit: test.unit || test.units || '', range: test.range || '' })) : TESTS,
});
const load = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalise(JSON.parse(saved));
    const legacy = JSON.parse(localStorage.getItem('sangamRkWorkflow') || 'null');
    if (!legacy) return normalise();
    const patients = Array.isArray(legacy.patients) ? legacy.patients.map((patient) => ({ id: patient.id, name: patient.name, age: patient.age, gender: patient.gender || 'Female', reference: patient.reference || 'Self' })) : [];
    const reports = Array.isArray(legacy.reports) ? legacy.reports.map((report) => ({
      id: report.id || crypto.randomUUID(), number: report.reportNo || report.id, patientId: report.patientId, status: report.status || 'Draft', createdOn: report.createdOn || date(), reportedOn: report.reportedOn || '', fee: Number(report.fee || 0), paid: Number(report.paid || 0),
      tests: (report.tests || []).map((name) => { const standard = TESTS.find((test) => test.name === name) || { name, unit: '', range: '' }; const result = report.results?.[name] || {}; return { name, unit: result.units || standard.unit, range: result.range || standard.range, value: result.value || '' }; }),
    })) : [];
    return normalise({ patients, reports, doctors: legacy.doctors, tests: legacy.tests });
  } catch { return normalise(); }
};

function ReportDocument({ report, patient }) {
  const rows = report.tests;
  const chunks = [];
  for (let start = 0, page = 0; start < Math.max(rows.length, 1); page += 1) {
    const size = page === 0 ? 7 : 11;
    chunks.push(rows.slice(start, start + size));
    start += size;
  }
  if (!chunks.length) chunks.push([]);

  return <div className="report-stack">
    {chunks.map((group, index) => {
      const first = index === 0;
      const last = index === chunks.length - 1;
      return <article key={index} className={`report-paper ${first ? 'first-page' : 'continuation-page'}`}>
        <div className="report-art" aria-hidden="true" />
        <div className="report-content">
          {first ? <>
            <section className="patient-card">
              <div><p><b>Patient ID</b><span>{patient.id}</span></p><p><b>Patient Name</b><span>{patient.name}</span></p><p><b>Referred By</b><span>{patient.reference || 'Self'}</span></p><p><b>Collected By</b><span>Self</span></p></div>
              <div><p><b>Report No.</b><span>{report.number}</span></p><p><b>Date of Collection</b><span>{report.createdOn}</span></p><p><b>Age / Gender</b><span>{patient.age} years / {patient.gender.toUpperCase()}</span></p><p><b>Date of Printed</b><span>{report.reportedOn || date()}</span></p></div>
            </section>
            <div className="report-title"><span>Laboratory Examination Report</span><small>Verified laboratory result</small></div>
          </> : <div className="continuation-title"><b>Report No. {report.number}</b><span>Continued · Page {index + 1} of {chunks.length}</span></div>}
          <table className="report-table"><thead><tr><th>Test Description</th><th>Observe<br />Value</th><th>Units</th><th>Biological Reference Range</th></tr></thead><tbody>
            <tr className="department"><td colSpan="4">Biochemistry</td></tr>
            {group.map((test) => <tr key={test.name}><td><b>{test.name.toUpperCase()}</b><small>Method / As per laboratory protocol</small></td><td>{test.value || '—'}</td><td>{test.unit}</td><td>{test.range}</td></tr>)}
          </tbody></table>
          {last && <><div className="report-end">End of Report</div><footer className="signature"><img src="/doctor-signature-transparent.png" alt="Authorised signature" /><b>Pathologist</b><strong>Dr. Arun Kumar Srivastava</strong><span>MBBS</span><small>Computer-generated report · Authorised signatory</small></footer></>}
        </div>
      </article>;
    })}
  </div>;
}

function InvoiceDocument({ report, patient }) {
  const fee = Number(report.fee || 0); const paid = Number(report.paid || 0); const due = Math.max(0, fee - paid); const perTest = report.tests.length ? fee / report.tests.length : fee;
  const invoiceNo = `SD/INV/${String(report.number || '').replace(/\D/g, '').padStart(4, '0')}`;
  return <article className="invoice-document">
    <style>{`.invoice-document{width:210mm;min-height:275mm;margin:0 auto;background:#fffdf7;border:1px solid #e6b344;box-shadow:0 12px 28px rgba(15,58,53,.14);padding:11mm;color:#263536}.invoice-header{display:grid;grid-template-columns:58px 1fr 150px;gap:14px;align-items:center;background:linear-gradient(100deg,#ffd23f,#f4b613);border-bottom:4px solid #a23523;padding:10px 12px;margin:-11mm -11mm 15px}.invoice-mark{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#a23523;color:#fff;font:900 18px Georgia,serif}.invoice-header h2{margin:0;color:#7c211d;font-size:20px}.invoice-header p{margin:3px 0;color:#3f3215;font-size:10px;font-weight:600}.invoice-title{text-align:right}.invoice-title b{display:inline-block;border-radius:4px;background:#a23523;color:#fff;padding:7px 10px;font-size:13px;letter-spacing:.7px}.invoice-title span{display:block;margin-top:6px;color:#5d4a1f;font-size:10px}.invoice-info{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:15px 0;padding:11px;border:1px solid #e4d5a9;border-radius:6px;font-size:11px;line-height:1.6}.invoice-info p{margin:0}.invoice-info strong{display:inline-block;min-width:31mm;color:#6b541a}.invoice-status{display:inline-block;border-radius:999px;padding:4px 8px;font:700 10px Arial,sans-serif}.invoice-status.paid{background:#ddf2e9;color:#16614e}.invoice-status.due{background:#fff1d5;color:#96620d}.invoice-table{width:100%;border-collapse:collapse;font-size:11px}.invoice-table th{background:#a23523;color:#fff;padding:9px;text-align:left}.invoice-table th:last-child,.invoice-table td:last-child{text-align:right}.invoice-table td{padding:10px 9px;border-bottom:1px solid #e6d9b7}.invoice-table td:first-child{width:42px;color:#806a36}.invoice-summary{width:78mm;margin:13px 0 0 auto;border-top:2px solid #a23523;font-size:11px}.invoice-summary p{display:flex;justify-content:space-between;margin:7px 0}.invoice-summary .grand{padding-top:8px;border-top:1px solid #e6d9b7;color:#7c211d;font-size:14px;font-weight:800}.invoice-foot{display:flex;justify-content:space-between;align-items:end;margin-top:48px;padding-top:10px;border-top:1px solid #e6d9b7;color:#5a655e;font-size:10px}.invoice-foot b{color:#263536}@media print{.invoice-document{width:210mm;min-height:297mm;margin:0;border:0;box-shadow:none}.invoice-document~*{display:none}}`}</style>
    <header className="invoice-header"><div className="invoice-mark">SD</div><div><h2>NEW SANGAM DIAGNOSTIC CENTRE</h2><p>TCV Shop No. 63, Opp. RML Hospital, Vibhuti Khand, Gomti Nagar, Lucknow - 226010</p><p>0522-3189685 · newsangam072@gmail.com</p></div><div className="invoice-title"><b>TAX INVOICE</b><span>Invoice no. {invoiceNo}</span><span>Date: {report.createdOn}</span></div></header>
    <section className="invoice-info"><div><p><strong>Patient name</strong>: {patient?.name || '—'}</p><p><strong>Patient ID</strong>: {patient?.id || report.patientId}</p><p><strong>Age / Gender</strong>: {patient?.age || '—'} years / {patient?.gender || '—'}</p></div><div><p><strong>Report no.</strong>: {report.number}</p><p><strong>Referred by</strong>: {patient?.reference || 'Self'}</p><p><strong>Payment status</strong>: <span className={`invoice-status ${due ? 'due' : 'paid'}`}>{due ? 'PART PAYMENT / DUE' : 'PAID IN FULL'}</span></p></div></section>
    <table className="invoice-table"><thead><tr><th>S.No.</th><th>Laboratory service / investigation</th><th>Amount</th></tr></thead><tbody>{report.tests.map((test, index) => <tr key={test.name}><td>{index + 1}</td><td><b>{test.name}</b><br /><small>Laboratory investigation</small></td><td>₹{(index === report.tests.length - 1 ? fee - perTest * (report.tests.length - 1) : perTest).toFixed(2)}</td></tr>)}</tbody></table>
    <section className="invoice-summary"><p><span>Subtotal</span><b>₹{fee.toFixed(2)}</b></p><p><span>Discount</span><b>₹0.00</b></p><p className="grand"><span>Grand total</span><span>₹{fee.toFixed(2)}</span></p><p><span>Received</span><b>₹{paid.toFixed(2)}</b></p><p><span>Balance due</span><b>₹{due.toFixed(2)}</b></p></section>
    <footer className="invoice-foot"><div><b>Thank you for choosing New Sangam Diagnostic Centre.</b><br />This is a computer-generated invoice and does not require a physical stamp.<br />Services once rendered are subject to laboratory terms and conditions.</div><div><b>Authorised Signatory</b></div></footer>
  </article>;
}

function App() {
  const [data, setData] = useState(load);
  const [view, setView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [notice, setNotice] = useState('');
  const [loggedIn, setLoggedIn] = useState(sessionStorage.getItem('sangam-react-session') === 'active');
  const save = (next) => { setData(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };
  const selected = data.reports.find((report) => report.id === selectedId);
  const selectedPatient = selected && data.patients.find((patient) => patient.id === selected.patientId);
  const invoiceReport = data.reports.find((report) => report.id === invoiceId);
  const invoicePatient = invoiceReport && data.patients.find((patient) => patient.id === invoiceReport.patientId);
  const finalReports = data.reports.filter((report) => report.status === 'Final');
  const catalogue = data.tests;

  const createPatientAndDraft = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const chosen = catalogue.filter((test) => form.getAll('tests').includes(test.name));
    if (!chosen.length) { setNotice('Select at least one investigation.'); return; }
    const patient = { id: makeId('SD', data.patients.length), name: form.get('name').trim(), age: form.get('age'), gender: form.get('gender'), reference: form.get('reference').trim() || 'Self' };
    const report = { id: crypto.randomUUID(), number: makeId('SD-R', data.reports.length), patientId: patient.id, status: 'Draft', createdOn: date(), reportedOn: '', fee: Number(form.get('fee') || 0), paid: 0, tests: chosen.map((test) => ({ ...test, value: '' })) };
    save({ patients: [patient, ...data.patients], reports: [report, ...data.reports] });
    event.currentTarget.reset(); setNotice(`${report.number} created as a draft.`); setView('results');
  };
  const finalise = (report, event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const tests = report.tests.map((test) => ({ ...test, value: String(values.get(test.name) || '').trim(), unit: String(values.get(`${test.name}-unit`) || '').trim(), range: String(values.get(`${test.name}-range`) || '').trim() }));
    if (tests.some((test) => !test.value)) { setNotice('Enter every observed value before finalising.'); return; }
    const updated = { ...report, status: 'Final', reportedOn: date(), tests };
    save({ ...data, reports: data.reports.map((item) => item.id === report.id ? updated : item) });
    setSelectedId(updated.id); setView('preview'); setNotice('Report finalised and ready to print.');
  };
  const openReport = (report) => { setSelectedId(report.id); setView('preview'); };
  const openInvoice = (report) => { setInvoiceId(report.id); setView('invoice'); };
  const printDocument = (name) => { const title = document.title; document.title = name.replace(/[^a-z0-9_-]/gi, '-'); window.print(); window.setTimeout(() => { document.title = title; }, 800); };
  const createReport = (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const patientId = form.get('patientId'); const chosen = catalogue.filter((test) => form.getAll('tests').includes(test.name));
    if (!patientId || !chosen.length) { setNotice('Choose a patient and at least one investigation.'); return; }
    const report = { id: crypto.randomUUID(), number: makeId('SD-R', data.reports.length), patientId, status: 'Draft', createdOn: date(), reportedOn: '', fee: Number(form.get('fee') || 0), paid: 0, tests: chosen.map((test) => ({ ...test, value: '' })) };
    save({ ...data, reports: [report, ...data.reports] }); event.currentTarget.reset(); setNotice(`${report.number} created as a draft.`); setView('results');
  };
  const addTest = (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const test = { name: String(form.get('name')).trim(), unit: String(form.get('unit')).trim(), range: String(form.get('range')).trim() }; if (!test.name) return; if (catalogue.some((item) => item.name.toLowerCase() === test.name.toLowerCase())) { setNotice('This investigation already exists.'); return; } save({ ...data, tests: [...catalogue, test] }); event.currentTarget.reset(); setNotice(`${test.name} added to the test catalogue.`); };
  const addDoctor = (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const doctor = { id: crypto.randomUUID(), name: String(form.get('name')).trim(), specialty: String(form.get('specialty')).trim(), mobile: String(form.get('mobile')).trim(), address: String(form.get('address')).trim() }; if (!doctor.name) return; save({ ...data, doctors: [doctor, ...data.doctors] }); event.currentTarget.reset(); setNotice('Referring doctor saved.'); };
  const collectPayment = (report, amount) => { const received = Math.min(Number(report.fee || 0), Math.max(0, Number(amount || 0))); save({ ...data, reports: data.reports.map((item) => item.id === report.id ? { ...item, paid: received, paidOn: date() } : item) }); setNotice(`Payment updated for ${report.number}.`); };

  if (!loggedIn) return <main className="login"><section><span className="eyebrow">SANGAM DIAGNOSTIC CENTRE</span><h1>Professional laboratory workflow.</h1><p>Browser-local patient, result and report management.</p></section><form onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); if (values.get('username') === 'admin' && values.get('password') === 'Sangam@2026') { sessionStorage.setItem('sangam-react-session', 'active'); setLoggedIn(true); } else setNotice('Use the configured laboratory login.'); }}><h2>Sign in</h2><input name="username" placeholder="Username" required /><input name="password" type="password" placeholder="Password" required /><button>Open workspace</button>{notice && <p className="notice">{notice}</p>}</form></main>;

  return <div className="app-shell">
    <aside><div className="brand"><b>SD</b><span>NEW SANGAM<br /><small>DIAGNOSTIC CENTRE</small></span></div><nav>{[['dashboard','Dashboard'],['patients','Patients'],['newreport','New report'],['tests','Test catalogue'],['results','Result entry'],['reports','Reports'],['billing','Billing'],['business','Business report'],['doctors','Doctors'],['profile','Lab profile']].map(([key, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>)}</nav><button className="logout" onClick={() => { sessionStorage.removeItem('sangam-react-session'); setLoggedIn(false); }}>Log out</button></aside>
    <main className="workspace">
      {notice && <div className="toast">{notice}<button onClick={() => setNotice('')}>×</button></div>}
      {view === 'dashboard' && <><header className="page-head"><div><span className="eyebrow">OPERATIONS / OVERVIEW</span><h1>Lab operations, with clarity.</h1><p>Register patients, finalise observations and deliver print-ready reports.</p></div><button onClick={() => setView('patients')}>+ New patient</button></header><section className="metrics"><article><b>{data.patients.length}</b><span>Registered patients</span></article><article><b>{data.reports.filter((report) => report.status === 'Draft').length}</b><span>Draft reports</span></article><article><b>{finalReports.length}</b><span>Ready to print</span></article></section><section className="panel"><h2>Recent reports</h2><ReportList reports={data.reports.slice(0, 6)} patients={data.patients} onOpen={openReport} onResults={(report) => { setSelectedId(report.id); setView('results'); }} /></section></>}
      {view === 'patients' && <><header className="page-head"><div><span className="eyebrow">PATIENT REGISTRATION</span><h1>Create a laboratory request</h1><p>Register the patient and choose required investigations.</p></div></header><form className="panel patient-form" onSubmit={createPatientAndDraft}><div className="form-grid"><label>Patient name<input name="name" required /></label><label>Age<input name="age" type="number" min="0" required /></label><label>Gender<select name="gender" defaultValue="Female"><option>Female</option><option>Male</option><option>Other</option></select></label><label>Fee (₹)<input name="fee" type="number" min="0" defaultValue="0" /></label><label className="wide">Referred by<input name="reference" placeholder="Self" /></label></div><fieldset><legend>Select investigations</legend><div className="test-grid">{catalogue.map((test) => <label key={test.name} className="test-choice"><input type="checkbox" name="tests" value={test.name} /><span><b>{test.name}</b><small>{test.unit} · {test.range}</small></span></label>)}</div></fieldset><button>Create draft report</button></form><section className="panel"><h2>Registered patients</h2><PatientList patients={data.patients} reports={data.reports} /></section></>}
      {view === 'newreport' && <><header className="page-head"><div><span className="eyebrow">NEW REPORT</span><h1>New investigation request</h1><p>Create another report for an already registered patient.</p></div></header><form className="panel patient-form" onSubmit={createReport}><div className="form-grid"><label className="wide">Patient<select name="patientId" required defaultValue=""><option value="" disabled>Select patient</option>{data.patients.map((patient) => <option value={patient.id} key={patient.id}>{patient.id} · {patient.name}</option>)}</select></label><label>Fee (₹)<input name="fee" type="number" min="0" defaultValue="0" /></label></div><fieldset><legend>Select investigations</legend><div className="test-grid">{catalogue.map((test) => <label key={test.name} className="test-choice"><input type="checkbox" name="tests" value={test.name} /><span><b>{test.name}</b><small>{test.unit} · {test.range}</small></span></label>)}</div></fieldset><button>Create draft report</button></form></>}
      {view === 'tests' && <><header className="page-head"><div><span className="eyebrow">LABORATORY CONFIGURATION</span><h1>Test catalogue</h1><p>Maintain investigations, units and validated reference ranges.</p></div></header><form className="panel catalogue-form" onSubmit={addTest}><h2>Add investigation</h2><div className="form-grid"><label>Test name<input name="name" required /></label><label>Unit<input name="unit" placeholder="e.g. mg/dL" /></label><label>Reference range<input name="range" placeholder="e.g. 70–100" required /></label></div><button>Add test</button></form><section className="panel"><Catalogue tests={catalogue} /></section></>}
      {view === 'results' && <><header className="page-head"><div><span className="eyebrow">CLINICAL RESULTS</span><h1>Result entry</h1><p>Complete all observations before finalising the report.</p></div></header>{data.reports.filter((report) => report.status === 'Draft').length ? data.reports.filter((report) => report.status === 'Draft').map((report) => <ResultForm key={report.id} report={report} patient={data.patients.find((patient) => patient.id === report.patientId)} onFinalise={finalise} />) : <section className="panel empty">No draft reports waiting for results.</section>}</>}
      {view === 'reports' && <><header className="page-head"><div><span className="eyebrow">REPORT REGISTER</span><h1>Final reports</h1><p>Review the clinical layout, then print or save as PDF.</p></div></header><section className="panel"><ReportList reports={finalReports} patients={data.patients} onOpen={openReport} /></section></>}
      {view === 'billing' && <><header className="page-head"><div><span className="eyebrow">BILLING</span><h1>Collection register</h1><p>Track billed amounts, payments received and pending balances.</p></div></header><section className="panel"><Billing reports={data.reports} patients={data.patients} onCollect={collectPayment} onInvoice={openInvoice} /></section></>}
      {view === 'business' && <><header className="page-head"><div><span className="eyebrow">BUSINESS REPORT</span><h1>Laboratory summary</h1><p>Current billing performance based on registered reports.</p></div></header><BusinessReport reports={data.reports} /></>}
      {view === 'doctors' && <><header className="page-head"><div><span className="eyebrow">REFERRING DOCTORS</span><h1>Doctor directory</h1><p>Maintain doctor and clinic contact details.</p></div></header><form className="panel catalogue-form" onSubmit={addDoctor}><h2>Add referring doctor</h2><div className="form-grid"><label>Name<input name="name" required /></label><label>Specialty<input name="specialty" /></label><label>Mobile<input name="mobile" /></label><label className="wide">Clinic address<input name="address" /></label></div><button>Save doctor</button></form><section className="panel"><Doctors doctors={data.doctors} /></section></>}
      {view === 'profile' && <><header className="page-head"><div><span className="eyebrow">LABORATORY PROFILE</span><h1>New Sangam Diagnostic Centre</h1><p>Report identity and authorised signatory details.</p></div></header><section className="panel profile"><div><span>Medical establishment certificate</span><b>CMEE25136741</b></div><dl><dt>Address</dt><dd>TCV Shop No. 63, Opp. RML Hospital, Vibhuti Khand, Gomti Nagar, Lucknow - 226010</dd><dt>Contact</dt><dd>0522-3189685 · 9452679795 · newsangam072@gmail.com</dd><dt>Authorised signatory</dt><dd>Dr. Arun Kumar Srivastava, MBBS</dd><dt>Registration no.</dt><dd>RMEE2444161</dd></dl></section></>}
      {view === 'preview' && selected && selectedPatient && <><header className="page-head preview-head"><div><span className="eyebrow">REPORT PREVIEW</span><h1>{selected.number}</h1><p>Review the final report before print output.</p></div><div><button className="secondary" onClick={() => setView('reports')}>Back to reports</button><button onClick={() => printDocument(`Sangam-Report-${selected.number}`)}>Print / Save PDF</button></div></header><ReportDocument report={selected} patient={selectedPatient} /></>}
      {view === 'invoice' && invoiceReport && <><header className="page-head preview-head"><div><span className="eyebrow">INVOICE</span><h1>{invoiceReport.number}</h1><p>Professional billing receipt for laboratory services.</p></div><div><button className="secondary" onClick={() => setView('billing')}>Back to billing</button><button onClick={() => printDocument(`Sangam-Invoice-${invoiceReport.number}`)}>Print / Save PDF</button></div></header><InvoiceDocument report={invoiceReport} patient={invoicePatient} /></>}
    </main>
  </div>;
}

function ReportList({ reports, patients, onOpen, onResults }) {
  return <div className="table-scroll"><table className="app-table"><thead><tr><th>Report no.</th><th>Patient</th><th>Investigations</th><th>Created</th><th>Status</th><th /></tr></thead><tbody>{reports.length ? reports.map((report) => { const patient = patients.find((item) => item.id === report.patientId); return <tr key={report.id}><td><b>{report.number}</b></td><td>{patient?.name || 'Patient unavailable'}</td><td>{report.tests.map((test) => test.name).join(', ')}</td><td>{report.createdOn}</td><td><span className={`status ${report.status.toLowerCase()}`}>{report.status}</span></td><td>{report.status === 'Final' ? <button className="secondary small" onClick={() => onOpen(report)}>Preview</button> : <button className="secondary small" onClick={() => onResults(report)}>Enter results</button>}</td></tr>; }) : <tr><td colSpan="6" className="empty">No reports created yet.</td></tr>}</tbody></table></div>;
}

function ResultForm({ report, patient, onFinalise }) {
  return <form className="panel result-form" onSubmit={(event) => onFinalise(report, event)}><header><div><h2>{report.number} · {patient?.name}</h2><p>{report.tests.map((test) => test.name).join(', ')}</p></div><span className="status draft">Draft</span></header><table className="app-table result-table"><thead><tr><th>Investigation</th><th>Observed value</th><th>Unit</th><th>Reference range</th></tr></thead><tbody>{report.tests.map((test) => <tr key={test.name}><td><b>{test.name}</b></td><td><input name={test.name} defaultValue={test.value} required /></td><td><input name={`${test.name}-unit`} defaultValue={test.unit} /></td><td><input name={`${test.name}-range`} defaultValue={test.range} /></td></tr>)}</tbody></table><footer><p>Verify observations, units and reference ranges before finalising.</p><button>Finalise report</button></footer></form>;
}

function PatientList({ patients, reports }) {
  return <div className="table-scroll"><table className="app-table"><thead><tr><th>Patient ID</th><th>Patient</th><th>Age / gender</th><th>Referred by</th><th>Reports</th></tr></thead><tbody>{patients.length ? patients.map((patient) => <tr key={patient.id}><td><b>{patient.id}</b></td><td>{patient.name}</td><td>{patient.age} years / {patient.gender}</td><td>{patient.reference || 'Self'}</td><td>{reports.filter((report) => report.patientId === patient.id).length}</td></tr>) : <tr><td colSpan="5" className="empty">No patients registered yet.</td></tr>}</tbody></table></div>;
}

function Catalogue({ tests }) {
  return <><h2>Available investigations</h2><div className="table-scroll"><table className="app-table"><thead><tr><th>Investigation</th><th>Unit</th><th>Laboratory reference range</th></tr></thead><tbody>{tests.map((test) => <tr key={test.name}><td><b>{test.name}</b></td><td>{test.unit || '—'}</td><td>{test.range || 'Set validated range'}</td></tr>)}</tbody></table></div></>;
}

function Billing({ reports, patients, onCollect, onInvoice }) {
  return <div className="table-scroll"><table className="app-table"><thead><tr><th>Report no.</th><th>Patient</th><th>Billed</th><th>Received</th><th>Balance</th><th>Collection</th><th>Invoice</th></tr></thead><tbody>{reports.length ? reports.map((report) => { const due = Math.max(0, Number(report.fee || 0) - Number(report.paid || 0)); const patient = patients.find((item) => item.id === report.patientId); return <tr key={report.id}><td><b>{report.number}</b></td><td>{patient?.name || 'Patient unavailable'}</td><td>₹{Number(report.fee || 0).toFixed(2)}</td><td>₹{Number(report.paid || 0).toFixed(2)}</td><td>₹{due.toFixed(2)}</td><td>{due ? <form className="collect" onSubmit={(event) => { event.preventDefault(); onCollect(report, new FormData(event.currentTarget).get('amount')); }}><input name="amount" type="number" min="0" max={report.fee} defaultValue={due} /><button className="small">Collect</button></form> : <span className="status final">Paid</span>}</td><td><button className="secondary small" onClick={() => onInvoice(report)}>Invoice</button></td></tr>; }) : <tr><td colSpan="7" className="empty">No billing records yet.</td></tr>}</tbody></table></div>;
}

function BusinessReport({ reports }) {
  const billed = reports.reduce((sum, report) => sum + Number(report.fee || 0), 0);
  const received = reports.reduce((sum, report) => sum + Number(report.paid || 0), 0);
  const balance = billed - received;
  return <><section className="metrics business-metrics"><article><b>₹{billed.toFixed(2)}</b><span>Total billed</span></article><article><b>₹{received.toFixed(2)}</b><span>Collected</span></article><article><b>₹{balance.toFixed(2)}</b><span>Outstanding balance</span></article></section><section className="panel"><h2>Report activity</h2><p className="summary-copy">{reports.length} report{reports.length === 1 ? '' : 's'} recorded. Payment collection is updated from the Billing section.</p></section></>;
}

function Doctors({ doctors }) {
  return <div className="table-scroll"><table className="app-table"><thead><tr><th>Name</th><th>Specialty</th><th>Mobile</th><th>Clinic address</th></tr></thead><tbody>{doctors.length ? doctors.map((doctor) => <tr key={doctor.id}><td><b>{doctor.name}</b></td><td>{doctor.specialty || '—'}</td><td>{doctor.mobile || '—'}</td><td>{doctor.address || '—'}</td></tr>) : <tr><td colSpan="4" className="empty">No referring doctors saved yet.</td></tr>}</tbody></table></div>;
}

// The React entry point deliberately hosts the complete proven workflow.  Keeping
// it as a same-origin compatibility module retains every original screen, action,
// print layout and browser-local record without silently dropping features during
// the framework migration.
function LegacyWorkflow() {
  return <>
    <style>{`
      html, body, #root { width: 100%; height: 100%; margin: 0; }
      .legacy-workflow { display: block; width: 100%; height: 100vh; border: 0; background: #f4f7fc; }
    `}</style>
    <iframe
      className="legacy-workflow"
      title="New Sangam Diagnostic Centre"
      src="/legacy/dist/index.html?v=reference-ranges-v2-20261106"
    />
  </>;
}

createRoot(document.getElementById('root')).render(<LegacyWorkflow />);
