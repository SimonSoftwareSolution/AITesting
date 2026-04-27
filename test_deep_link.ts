const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/session.json' });
  const page = await context.newPage();
  
  await page.goto('https://dev.questra.s2o.dev/portal/access-manager/users');
  await page.waitForLoadState('domcontentloaded');
  
  const anmeldenBtn = page.locator('button:has-text("Anmelden")').first();
  if (await anmeldenBtn.isVisible()) {
    await anmeldenBtn.click();
    await page.waitForSelector('nav, [class*="sidebar"]', { timeout: 20000 });
  }
  
  console.log("FINAL URL:", page.url());
  await browser.close();
})();
