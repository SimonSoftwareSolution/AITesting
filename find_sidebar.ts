const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: '.auth/session.json' });
    const page = await context.newPage();
    
    await page.goto('https://dev.questra.s2o.dev/portal');
    console.log("Waiting for welcome text...");
    await page.waitForSelector('text=Willkommen');
    console.log("Welcome text visible. App is fully loaded!");
    
    const html = await page.content();
    fs.writeFileSync('dashboard_dom.html', html);
    await browser.close();
})();
