(() => {
  'use strict';

  const page = document.querySelector('[data-rk-page="profile"]');
  const navButton = document.querySelector('.nav [data-nav="profile"]');
  if (!page) return;

  if (navButton) {
    navButton.querySelector('span').textContent = 'Profile';
    if (!document.querySelector('.nav [data-nav="settings"]')) {
      const settingsButton = document.createElement('button');
      settingsButton.type = 'button';
      settingsButton.dataset.nav = 'settings';
      settingsButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2 2-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20h-2.82v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33h-.01a1.65 1.65 0 0 0-1-1.51V5h2.82v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2 2-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H20v2.82h-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0 1.51 1Z" /></svg><span>Settings</span>';
      navButton.insertAdjacentElement('afterend', settingsButton);
    }
  }
  page.classList.add('sangam-profile');
  page.innerHTML = `
    <header class="rk-topline"><div><h2>Profile</h2><p>Medical establishment, registration and authorised signatory information.</p></div></header>
    <section class="sangam-profile-card">
      <header class="sangam-profile-card__head"><div class="sangam-profile-card__badge" aria-hidden="true">NS</div><div><h3>New Sangam Diagnostic Center</h3><p>Licensed pathology laboratory · Lucknow, Uttar Pradesh</p></div><span class="sangam-profile-status">Active</span></header>
      <ul class="sangam-profile-list">
        <li><span>Medical establishment</span><strong>New Sangam Diagnostic Center</strong></li>
        <li><span>Registration number</span><strong>RMEE2444161</strong></li>
        <li><span>Application number</span><strong>MEE0261206</strong></li>
        <li><span>Medical certificate</span><strong>CMEE25136741</strong></li>
        <li><span>Certificate issued</span><strong>04 September 2025</strong></li>
        <li><span>Certificate validity</span><strong>04 September 2025 to 03 September 2030</strong></li>
        <li><span>Owner</span><strong>Raj Kumar Shukla</strong></li>
        <li><span>Authorised signatory</span><strong>Dr. Abha Mishra, MBBS</strong></li>
        <li><span>Laboratory address</span><strong>TCV Shop No. 63, Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh – 226010<br>Opposite Dr. RML Hospital</strong></li>
        <li><span>Laboratory services</span><strong class="sangam-profile-services"><i>Pathology</i><i>Haematology</i><i>Biochemistry</i><i>Microbiology</i><i>Histopathology</i><i>Cytology</i><i>Sample Collection Centre</i></strong></li>
        <li><span>Time zone</span><strong>Asia/Kolkata</strong></li>
      </ul>
    </section>`;
})();
