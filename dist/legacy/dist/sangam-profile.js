(() => {
  'use strict';

  const page = document.querySelector('[data-rk-page="profile"]');
  const navButton = document.querySelector('.nav [data-nav="profile"]');
  const storageKey = 'sangamProfileDetails';
  const defaults = {
    fullName: 'Raj Kumar Shukla', username: 'admin', email: 'newsangam072@gmail.com', phone: '0522-3189685',
    address: 'TCV Shop No. 63, Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh – 226010\nOpposite Dr. RML Hospital',
    authorisedSignatory: 'Dr. Abha Mishra, MBBS'
  };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character]);
  const read = () => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || '{}'), username: defaults.username }; } catch (_) { return { ...defaults }; } };
  const save = (profile) => localStorage.setItem(storageKey, JSON.stringify({ ...profile, username: defaults.username }));
  if (!page) return;

  if (navButton) {
    navButton.querySelector('span').textContent = 'Profile';
    if (!document.querySelector('.nav [data-nav="settings"]')) {
      const settingsButton = document.createElement('button');
      settingsButton.type = 'button';
      settingsButton.dataset.nav = 'settings';
      settingsButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2 2-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20h-2.82v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33h-.01a1.65 1.65 0 0 0-1-1.51V5h2.82v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2 2-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H20v2.82h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg><span>Settings</span>';
      navButton.insertAdjacentElement('afterend', settingsButton);
    }
  }

  page.classList.add('sangam-profile');
  const profileMarkup = (profile) => `
    <header class="rk-topline sangam-profile-topline"><div><h2>Profile</h2><p>Medical establishment, registration and authorised signatory information.</p></div><button type="button" class="sangam-profile-edit" data-profile-edit>Edit profile</button></header>
    <section class="sangam-profile-card">
      <header class="sangam-profile-card__head"><div class="sangam-profile-card__badge" aria-hidden="true">NS</div><div><h3>New Sangam Diagnostic Center</h3><p>Licensed pathology laboratory · Lucknow, Uttar Pradesh</p></div><span class="sangam-profile-status">Active</span></header>
      <ul class="sangam-profile-list">
        <li><span>Full name</span><strong>${escapeHtml(profile.fullName)}</strong></li>
        <li><span>Username</span><strong>${escapeHtml(profile.username)}</strong></li>
        <li><span>Email</span><strong>${escapeHtml(profile.email || '—')}</strong></li>
        <li><span>Phone number</span><strong>${escapeHtml(profile.phone || '—')}</strong></li>
        <li><span>Medical establishment</span><strong>New Sangam Diagnostic Center</strong></li>
        <li><span>Registration number</span><strong>RMEE2444161</strong></li>
        <li><span>Certificate validity</span><strong>04 September 2025 to 03 September 2030</strong></li>
        <li><span>Authorised signatory</span><strong>${escapeHtml(profile.authorisedSignatory || '—')}</strong></li>
        <li><span>Laboratory address</span><strong>${escapeHtml(profile.address || '—').replace(/\n/g, '<br>')}</strong></li>
        <li><span>Laboratory services</span><strong class="sangam-profile-services"><i>Pathology</i><i>Haematology</i><i>Biochemistry</i><i>Microbiology</i><i>Histopathology</i><i>Cytology</i><i>Sample Collection Centre</i></strong></li>
        <li><span>Time zone</span><strong>Asia/Kolkata</strong></li>
      </ul>
    </section>`;
  const editorMarkup = (profile) => `
    <header class="rk-topline sangam-profile-topline"><div><h2>Edit Profile Details</h2><p>Update the contact and authorised-signatory information for this account.</p></div></header>
    <form class="sangam-profile-editor" id="sangamProfileEditor">
      <label>Full name <b>*</b><input name="fullName" required value="${escapeHtml(profile.fullName)}"></label>
      <label>Username <b>*</b><input name="username" readonly aria-readonly="true" value="${escapeHtml(profile.username)}"><small>Username cannot be changed.</small></label>
      <label>Email<input name="email" type="email" value="${escapeHtml(profile.email)}"></label>
      <label>Phone number<input name="phone" value="${escapeHtml(profile.phone)}"><small>Separate multiple phone numbers with a comma.</small></label>
      <label class="wide">Address<textarea name="address" rows="3">${escapeHtml(profile.address)}</textarea></label>
      <label class="wide">Authorised signatory<input name="authorisedSignatory" value="${escapeHtml(profile.authorisedSignatory)}"></label>
      <div class="sangam-profile-editor__actions"><button type="button" class="sangam-profile-cancel" data-profile-cancel>Cancel</button><button class="sangam-profile-save">Save changes</button></div>
    </form>`;
  const render = (editing = false) => {
    const profile = read();
    page.innerHTML = editing ? editorMarkup(profile) : profileMarkup(profile);
    if (!editing) page.querySelector('[data-profile-edit]').addEventListener('click', () => render(true));
    else {
      page.querySelector('[data-profile-cancel]').addEventListener('click', () => render(false));
      page.querySelector('#sangamProfileEditor').addEventListener('submit', (event) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        save({ fullName:String(values.get('fullName') || '').trim(), email:String(values.get('email') || '').trim(), phone:String(values.get('phone') || '').trim(), address:String(values.get('address') || '').trim(), authorisedSignatory:String(values.get('authorisedSignatory') || '').trim() });
        render(false);
      });
    }
  };
  render();
})();
