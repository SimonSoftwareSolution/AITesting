const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: '.auth/session.json' });
    const page = await context.newPage();
    console.log("Navigating to portal...");
    await page.goto('https://dev.questra.s2o.dev/portal');
    await page.waitForLoadState('domcontentloaded');
    
    console.log("Looking for Anmelden...");
    const anmeldenBtn = page.locator('button:has-text("Anmelden")').first();
    if (await anmeldenBtn.count() > 0) {
      console.log("Clicking Anmelden...");
      await anmeldenBtn.click();
      console.log("Waiting for sidebar...");
      await page.waitForSelector('nav, [class*="sidebar"]', { timeout: 20000 });
      console.log("SUCCESS! Sidebar appeared automatically because session was remembered!");
    } else {
      console.log("No Anmelden button found.");
    }
    await browser.close();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
