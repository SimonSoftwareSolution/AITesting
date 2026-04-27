const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/session.json' });
  const page = await context.newPage();
  
  await page.goto('https://dev.questra.s2o.dev/portal');
  
  // Wait up to 30s to see what the DOM literally is
  await page.waitForTimeout(30000);
  
  const content = await page.content();
  fs.writeFileSync('dom_dump.txt', content);
  
  await browser.close();
})();
