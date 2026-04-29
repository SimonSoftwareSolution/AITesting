import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { LandingPage } from '../LandingPage/LandingPage';
import { DashboardPage } from '../Dashboard/DashboardPage';

const authFile = '.auth/session.json';

const SESSION_MAX_AGE_MS = 60 * 60 * 1000;

function sessionIsReusable(): boolean {
  if (!fs.existsSync(authFile)) {
    return false;
  }

  const ageMs = Date.now() - fs.statSync(authFile).mtimeMs;
  if (ageMs > SESSION_MAX_AGE_MS) {
    return false;
  }

  try {
    const { cookies = [], origins = [] } = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

    const hasCookies = cookies.length > 0;

    const AUTH_KEY_PATTERN = /token|auth|access|oidc|user|session/i;
    const hasAuthLocalStorage = origins.some((o: any) =>
      Array.isArray(o.localStorage) &&
      o.localStorage.some((entry: any) => AUTH_KEY_PATTERN.test(entry.name))
    );

    if (!hasCookies && !hasAuthLocalStorage) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

setup.setTimeout(120_000);

setup('authenticate', async ({ page }) => {
  const username = process.env.QUESTRA_USERNAME;
  const password = process.env.QUESTRA_PASSWORD;
  const authType = process.env.QUESTRA_AUTH_TYPE ?? 'direct';

  if (!username || !password) {
    throw new Error(
      'Missing credentials. Copy .env.example to .env and fill in QUESTRA_USERNAME and QUESTRA_PASSWORD.'
    );
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  if (sessionIsReusable()) return;

  const pageResult = await LandingPage.create(page);

  if (pageResult instanceof DashboardPage) {
    await page.context().storageState({ path: authFile });
    return;
  }

  const landingPage = pageResult;

  await landingPage.clickLogin();

  if (authType === 'windows') {
    if (page.url().includes('authentik')) {
      await page.locator('button[aria-label="Continue with azure-ad"], a[href*="azure"]').first().click();
      await page.waitForURL(
        (url) => url.hostname.includes('microsoftonline.com') || url.hostname === 'dev.questra.s2o.dev',
        { timeout: 30_000 }
      );
    }
    if (page.url().includes('microsoftonline.com')) {
      await page.locator('input[type="email"], input[name="loginfmt"]').fill(username);
      await page.locator('button:has-text("Next"), input[type="submit"][value="Next"]').click();
      await page.locator('input[type="password"], input[name="passwd"]').waitFor({ timeout: 15_000 });
      await page.locator('input[type="password"], input[name="passwd"]').fill(password);
      await page.locator('button:has-text("Sign in"), input[type="submit"][value="Sign in"]').click();
    }
    try {
      const noBtn = page.getByRole('button', { name: 'No' });
      await noBtn.waitFor({ state: 'visible', timeout: 20_000 });
      await noBtn.click();
    } catch { }
    await page.waitForURL(
      (url) => url.hostname === 'dev.questra.s2o.dev' && url.pathname.startsWith('/portal'),
      { timeout: 90_000 }
    );
  } else {
    await page.locator('#ak-identifier-input').waitFor({ timeout: 10_000 });
    await page.locator('#ak-identifier-input').fill(username);
    await page.locator('#ak-stage-identification-password').fill(password);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(
      (url) => url.hostname === 'dev.questra.s2o.dev' && url.pathname.startsWith('/portal'),
      { timeout: 60_000 }
    );
  }

  await page.waitForTimeout(5000);

  const sessionData = await page.evaluate(() => JSON.stringify(Object.entries(sessionStorage)));
  fs.writeFileSync('.auth/sessionStorage.json', sessionData, 'utf-8');

  await page.context().storageState({ path: authFile });
});
