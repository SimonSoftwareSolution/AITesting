const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: '.auth/session.json' });
  const page = await context.newPage();
  
  await page.goto('https://dev.questra.s2o.dev/portal/data-manager/inventories', { waitUntil: 'domcontentloaded', timeout: 120000 });
  
  // Wait to see what renders
  await page.waitForTimeout(15000);
  
  const content = await page.content();
  fs.writeFileSync('data_manager_dom.html', content);
  
  await browser.close();
})();
