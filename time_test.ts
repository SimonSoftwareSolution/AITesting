const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: '.auth/session.json' });
    const page = await context.newPage();
    
    console.log("Navigating to portal... ", new Date());
    await page.goto('https://dev.questra.s2o.dev/portal', { waitUntil: 'domcontentloaded', timeout: 120000 });
    console.log("domcontentloaded! ", new Date());
    
    try {
        const t1 = Date.now();
        console.log("Waiting for Anmelden or Sidebar...");
        
        const sidebar = page.locator('nav, [class*="sidebar"], [class*="Sidebar"]').first();
        const anmelden = page.getByRole('button', { name: /^Anmelden$/i }).first();
        
        await Promise.race([
            sidebar.waitFor({ state: 'visible', timeout: 120000 }),
            anmelden.waitFor({ state: 'visible', timeout: 120000 })
        ]);
        
        console.log("Element appeared in", (Date.now() - t1)/1000, "seconds");
        
        if (await anmelden.isVisible()) {
            console.log("Clicking anmelden...");
            await anmelden.click();
            await sidebar.waitFor({ state: 'visible', timeout: 60000 });
            console.log("Sidebar appeared after click!");
        } else {
            console.log("Sidebar was natively visible (auto login worked?)");
        }
    } catch (e) {
        console.log("Timeout waiting for elements!", e);
    }
    
    await browser.close();
})();
