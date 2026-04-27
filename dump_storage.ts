const { chromium } = require('playwright');
const fs = require('fs');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to portal...');
  await page.goto('https://dev.questra.s2o.dev/portal');

  console.log('Clicking login...');
  await page.click('button:has-text("Anmelden")');

  try {
    console.log('Filling Authentik credentials...');
    await page.waitForSelector('#ak-identifier-input', { timeout: 10000 });
    await page.fill('#ak-identifier-input', process.env.QUESTRA_USERNAME);
    await page.fill('#ak-stage-identification-password', process.env.QUESTRA_PASSWORD);
    await page.click('button:has-text("Log in")');
  } catch (e) {
    console.log('Authentik direct fill failed, trying Microsoft flow...');
    await page.click('button[aria-label="Continue with azure-ad"], a[href*="azure"]');
    await page.fill('input[type="email"], input[name="loginfmt"]', process.env.QUESTRA_USERNAME);
    await page.click('button:has-text("Next"), input[type="submit"][value="Next"]');
    await page.waitForSelector('input[type="password"], input[name="passwd"]', { timeout: 15_000 });
    await page.fill('input[type="password"], input[name="passwd"]', process.env.QUESTRA_PASSWORD);
    await page.click('button:has-text("Sign in"), input[type="submit"][value="Sign in"]');
    try {
      await page.click('button:has-text("No")');
    } catch {}
  }

  console.log('Waiting for portal to load...');
  await page.waitForURL(url => url.hostname === 'dev.questra.s2o.dev' && url.pathname.startsWith('/portal'), { timeout: 60000 });
  await page.waitForTimeout(5000);

  console.log('Dumping storage...');
  
  // Dump IndexedDB databases
  const idbKeys = await page.evaluate(async () => {
    if (!window.indexedDB || !window.indexedDB.databases) return "unsupported";
    const dbs = await window.indexedDB.databases();
    return dbs;
  });
  console.log('IndexedDB databases:', idbKeys);

  const ls = await page.evaluate(() => Object.entries(localStorage));
  console.log('LocalStorage:', ls);

  const ss = await page.evaluate(() => Object.entries(sessionStorage));
  console.log('SessionStorage:', ss);

  const cookies = await context.cookies();
  const questraCookies = cookies.filter(c => c.domain.includes('questra'));
  console.log('Questra Cookies:', questraCookies);

  await browser.close();
})();
