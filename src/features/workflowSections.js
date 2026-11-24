// The legacy workspace owns the established clinical workflows. Keeping this
// registry in src gives the React shell a single, explicit map of every area.
export const workflowSections = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'patients-registration', label: 'Patients & Registration' },
  { id: 'test-booking', label: 'Test Booking' },
  { id: 'billing', label: 'Billing & Invoice' },
  { id: 'result-entry', label: 'Result Entry' },
  { id: 'report', label: 'Report' },
  { id: 'test-catalogue', label: 'Test Catalogue' },
  { id: 'business-report', label: 'Business Report' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
];
