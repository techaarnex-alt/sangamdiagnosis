(() => {
  'use strict';

  const CREDENTIAL_KEY = 'sangamDiagnosticCredential-v1';
  const SESSION_KEY = 'sangamDiagnosticSession';
  const DEFAULT_PASSWORD = 'Sangam@2026';
  const ITERATIONS = 210000;
  const encoder = new TextEncoder();

  const bytesToBase64 = (bytes) => {
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  };
  const base64ToBytes = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  const credential = () => {
    try {
      const value = JSON.parse(localStorage.getItem(CREDENTIAL_KEY) || 'null');
      return value && value.version === 1 && value.salt && value.hash && Number.isInteger(value.iterations) ? value : null;
    } catch (_) { return null; }
  };
  const derive = async (password, salt, iterations) => {
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256));
  };
  const equal = (left, right) => {
    if (left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
    return difference === 0;
  };
  const canUseCredentialStore = () => Boolean(window.crypto?.subtle && window.crypto?.getRandomValues);
  const verifyPassword = async (password) => {
    const saved = credential();
    if (!saved) return password === DEFAULT_PASSWORD;
    const derived = await derive(password, base64ToBytes(saved.salt), saved.iterations);
    return equal(derived, base64ToBytes(saved.hash));
  };
  const savePassword = async (password) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(password, salt, ITERATIONS);
    localStorage.setItem(CREDENTIAL_KEY, JSON.stringify({ version: 1, iterations: ITERATIONS, salt: bytesToBase64(salt), hash: bytesToBase64(hash) }));
  };
  const eye = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 12S6 5 12 5s9.8 7 9.8 7-3.8 7-9.8 7S2.2 12 2.2 12zM12 15a3 3 0 100-6 3 3 0 000 6z" /></svg>';
  const eyeOff = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.8 10.8 0 0112 4c5.5 0 9.3 5.3 9.8 6-.4.7-1.5 2.2-3.2 3.5M6.5 6.5C4.1 8 2.5 10.5 2.2 11c.5.8 4.3 5 9.8 5 1 0 2-.2 2.8-.5" /></svg>';

  const navigation = document.querySelector('.nav');
  const shell = document.querySelector('.shell');
  if (!navigation || !shell) return;
  let settingsButton = navigation.querySelector('[data-nav="settings"]');
  if (!settingsButton) {
    settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.dataset.nav = 'settings';
    settingsButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2 2-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20h-2.82v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33h-.01a1.65 1.65 0 0 0-1-1.51V5h2.82v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2 2-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H20v2.82h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg><span>Settings</span>';
    const profileButton = navigation.querySelector('[data-nav="profile"]');
    profileButton?.insertAdjacentElement('afterend', settingsButton);
    if (!profileButton) navigation.append(settingsButton);
  }

  const page = document.createElement('section');
  page.className = 'sangam-settings-page';
  page.id = 'sangamSettingsPage';
  page.hidden = true;
  page.innerHTML = `
    <header class="sangam-settings-head"><p class="eyebrow">Account security</p><h2>Settings</h2><p>Manage the administrator password for this browser workspace.</p></header>
    <section class="sangam-account-card" aria-label="Signed-in account"><div class="sangam-account-avatar">A</div><div><strong>Administrator</strong><small>@admin · New Sangam Diagnostic Centre</small></div><span class="sangam-account-role">Administrator</span></section>
    <section class="sangam-password-card"><header><div class="sangam-password-icon" aria-hidden="true">⌑</div><div><h3>Change password</h3><p>Confirm the current password, then choose and confirm a new password.</p></div></header>
      <form class="sangam-password-form" id="sangamPasswordForm">
        <div class="sangam-password-field"><label for="sangamCurrentPassword">Current password</label><div class="sangam-password-input"><input id="sangamCurrentPassword" name="currentPassword" type="password" autocomplete="current-password" required><button class="sangam-password-toggle" type="button" aria-label="Show current password" aria-pressed="false">${eye}</button></div><small>Enter your current account password to authorise the change.</small></div>
        <div class="sangam-password-field"><label for="sangamNewPassword">New password</label><div class="sangam-password-input"><input id="sangamNewPassword" name="newPassword" type="password" autocomplete="new-password" minlength="8" required><button class="sangam-password-toggle" type="button" aria-label="Show new password" aria-pressed="false">${eye}</button></div><small>Use at least 8 characters.</small></div>
        <div class="sangam-password-field"><label for="sangamConfirmPassword">Confirm new password</label><div class="sangam-password-input"><input id="sangamConfirmPassword" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required><button class="sangam-password-toggle" type="button" aria-label="Show confirm password" aria-pressed="false">${eye}</button></div><small>Re-enter the new password exactly as above.</small></div>
        <div class="sangam-password-actions"><button class="sangam-password-reset" type="submit">Change password</button><button class="sangam-password-clear" type="reset">Clear</button></div><p class="sangam-password-status" id="sangamPasswordStatus" aria-live="polite"></p>
      </form>
    </section>`;
  shell.append(page);

  const showStatus = (message, type = '') => {
    const status = page.querySelector('#sangamPasswordStatus');
    status.textContent = message;
    status.className = `sangam-password-status ${type}`.trim();
  };
  const showSettings = () => {
    [...shell.children].forEach((child) => { if (child !== page) child.classList.add('hidden'); });
    page.hidden = false;
    page.removeAttribute('hidden');
    page.classList.remove('hidden');
    page.style.removeProperty('display');
    document.querySelectorAll('.nav button').forEach((button) => button.classList.toggle('active', button === settingsButton));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  settingsButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    showSettings();
  }, true);
  document.querySelectorAll('.nav button:not([data-nav="settings"])').forEach((button) => button.addEventListener('click', () => { page.hidden = true; }));
  new MutationObserver(() => {
    if (!settingsButton.classList.contains('active')) page.hidden = true;
  }).observe(navigation, { attributes: true, subtree: true, attributeFilter: ['class'] });

  page.querySelectorAll('.sangam-password-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('input');
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      button.innerHTML = visible ? eye : eyeOff;
      button.setAttribute('aria-label', visible ? `Show ${input.closest('.sangam-password-field').querySelector('label').textContent.toLowerCase()}` : `Hide ${input.closest('.sangam-password-field').querySelector('label').textContent.toLowerCase()}`);
      button.setAttribute('aria-pressed', String(!visible));
      input.focus();
    });
  });

  const form = page.querySelector('#sangamPasswordForm');
  form.addEventListener('reset', () => window.setTimeout(() => showStatus(''), 0));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!canUseCredentialStore()) { showStatus('Password changes require a modern secure browser connection.', 'error'); return; }
    const values = new FormData(form);
    const currentPassword = String(values.get('currentPassword') || '');
    const newPassword = String(values.get('newPassword') || '');
    const confirmPassword = String(values.get('confirmPassword') || '');
    if (newPassword.length < 8) { showStatus('The new password must contain at least 8 characters.', 'error'); return; }
    if (newPassword !== confirmPassword) { showStatus('The new password and confirmation do not match.', 'error'); return; }
    if (currentPassword === newPassword) { showStatus('Choose a password that is different from the current password.', 'error'); return; }
    try {
      if (!await verifyPassword(currentPassword)) { showStatus('The current password is incorrect.', 'error'); return; }
      await savePassword(newPassword);
      form.reset();
      showStatus('Password changed. Use the new password the next time you sign in.', 'success');
    } catch (_) { showStatus('Password could not be updated. Please try again.', 'error'); }
  });

  const loginForm = document.querySelector('#loginForm');
  const loginError = document.querySelector('#loginError');
  const loginScreen = document.querySelector('#loginScreen');
  const appShell = document.querySelector('#appShell');
  if (loginForm) loginForm.onsubmit = async (event) => {
    event.preventDefault();
    const username = document.querySelector('#loginUser')?.value.trim();
    const password = document.querySelector('#loginPassword')?.value || '';
    try {
      if (username === 'admin' && await verifyPassword(password)) {
        sessionStorage.setItem(SESSION_KEY, 'active');
        loginError?.classList.remove('show');
        loginScreen?.classList.add('hidden');
        appShell?.classList.remove('hidden');
      } else loginError?.classList.add('show');
    } catch (_) { loginError?.classList.add('show'); }
  };
})();
