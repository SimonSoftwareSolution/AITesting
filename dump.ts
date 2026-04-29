import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: '.auth/session.json' });
    const page = await context.newPage();

    console.log("Navigating to portal...");
    await page.goto('https://dev.questra.s2o.dev/portal');
    console.log("Loaded. Waiting 30s...");

    setTimeout(async () => {
      try {
        console.log("Dumping DOM...");
        const html = await page.content();
        fs.writeFileSync('last_dump.html', html);
        console.log("Done.");
        await browser.close();
      } catch (e) {
        console.log("Inner Error:", e);
      }
    }, 30000);
  } catch (e) {
    console.log("Outer Error:", e);
  }
})();
