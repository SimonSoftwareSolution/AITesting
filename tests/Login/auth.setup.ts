import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { LandingPage } from '../LandingPage/LandingPage';
import { DashboardPage } from '../Dashboard/DashboardPage';

const authFile = '.auth/session.json';

/**
 * How long to trust a saved session before forcing a re-login.
 * Adjust to match your SSO session timeout.
 */
const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Returns true if .auth/session.json exists, is younger than SESSION_MAX_AGE_MS,
 * and contains real auth data (cookies or auth-related localStorage keys).
 */
function sessionIsReusable(): boolean {
  if (!fs.existsSync(authFile)) {
    console.log('🔑 No session file found — will log in.');
    return false;
  }

  const ageMs = Date.now() - fs.statSync(authFile).mtimeMs;
  if (ageMs > SESSION_MAX_AGE_MS) {
    console.log(`⏰ Session is ${Math.round(ageMs / 60_000)}m old (limit: ${SESSION_MAX_AGE_MS / 60_000}m) — will re-login.`);
    return false;
  }

  try {
    const { cookies = [], origins = [] } = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

    const hasCookies = cookies.length > 0;

    // Only count localStorage entries that look like auth tokens, not UI preferences
    const AUTH_KEY_PATTERN = /token|auth|access|oidc|user|session/i;
    const hasAuthLocalStorage = origins.some((o: any) =>
      Array.isArray(o.localStorage) &&
      o.localStorage.some((entry: any) => AUTH_KEY_PATTERN.test(entry.name))
    );

    if (!hasCookies && !hasAuthLocalStorage) {
      console.log('⚠️  Session has no auth cookies or auth localStorage — will re-login.');
      return false;
    }
  } catch {
    console.log('⚠️  Session file is malformed — will re-login.');
    return false;
  }

  console.log(`✅ Reusing existing session (age: ${Math.round(ageMs / 60_000)}m).`);
  return true;
}

setup.setTimeout(120_000); // Login can be slow — give it 2 minutes

setup('authenticate', async ({ page }) => {
  const username = process.env.QUESTRA_USERNAME;
  const password = process.env.QUESTRA_PASSWORD;
  const authType = process.env.QUESTRA_AUTH_TYPE ?? 'direct';

  if (!username || !password) {
    throw new Error(
      'Missing credentials. Copy .env.example to .env and fill in QUESTRA_USERNAME and QUESTRA_PASSWORD.'
    );
  }

  // Ensure .auth directory exists
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  // ── Fast path: skip login if we have a fresh, valid session ──────────────
  if (sessionIsReusable()) return;

  // ── Slow path: full login flow ────────────────────────────────────────────
  const pageResult = await LandingPage.create(page);

  // If already authenticated (e.g. OS-level SSO auto-logged us in), save and exit
  if (pageResult instanceof DashboardPage) {
    console.log('🔓 Auto-login detected — saving session without manual credential entry.');
    await page.context().storageState({ path: authFile });
    console.log(`✅ Auth state saved to ${authFile}`);
    return;
  }

  const landingPage = pageResult;

  // 1. Click login — navigates to Authentik (or Microsoft directly)
  await landingPage.clickLogin();

  if (authType === 'windows') {
    // Click the Azure AD / Microsoft SSO button on the Authentik page
    if (page.url().includes('authentik')) {
      await page.locator('button[aria-label="Continue with azure-ad"], a[href*="azure"]').first().click();
      await page.waitForURL(
        (url) => url.hostname.includes('microsoftonline.com') || url.hostname === 'dev.questra.s2o.dev',
        { timeout: 30_000 }
      );
    }
    // If we landed on Microsoft's login page, enter credentials
    if (page.url().includes('microsoftonline.com')) {
      await page.locator('input[type="email"], input[name="loginfmt"]').fill(username);
      await page.locator('button:has-text("Next"), input[type="submit"][value="Next"]').click();
      await page.locator('input[type="password"], input[name="passwd"]').waitFor({ timeout: 15_000 });
      await page.locator('input[type="password"], input[name="passwd"]').fill(password);
      await page.locator('button:has-text("Sign in"), input[type="submit"][value="Sign in"]').click();
    }
    // Handle "Stay signed in?" prompt — it can appear after any SSO login
    // Wait for it and dismiss with "No" to avoid persisting the session on the OS
    try {
      const noBtn = page.getByRole('button', { name: 'No' });
      await noBtn.waitFor({ state: 'visible', timeout: 20_000 });
      await noBtn.click();
    } catch { /* prompt may not appear */ }
    await page.waitForURL(
      (url) => url.hostname === 'dev.questra.s2o.dev' && url.pathname.startsWith('/portal'),
      { timeout: 90_000 }
    );
  } else {
    // Direct Authentik login — fill the username+password form that is on screen
    await page.locator('#ak-identifier-input').waitFor({ timeout: 10_000 });
    await page.locator('#ak-identifier-input').fill(username);
    await page.locator('#ak-stage-identification-password').fill(password);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(
      (url) => url.hostname === 'dev.questra.s2o.dev' && url.pathname.startsWith('/portal'),
      { timeout: 60_000 }
    );
  }

  // 2. Wait for the dashboard to indicate auth is fully complete
  await page.waitForTimeout(5000); // Give it a moment to finish setting tokens

  // Extract sessionStorage
  const sessionData = await page.evaluate(() => JSON.stringify(Object.entries(sessionStorage)));
  console.log(`SESSION STORAGE KEYS:`, await page.evaluate(() => Object.keys(sessionStorage)));
  fs.writeFileSync('.auth/sessionStorage.json', sessionData, 'utf-8');

  // 3. Persist the session for all authenticated tests
  await page.context().storageState({ path: authFile });
  console.log(`✅ Auth state saved to ${authFile} (auth type: ${authType})`);
});
