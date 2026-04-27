import { test } from '@playwright/test';

test('debug authentik load', async ({ page }) => {
  const errors: string[] = [];
  const failedReqs: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  page.on('requestfailed', req => failedReqs.push(`FAILED: ${req.url()} - ${req.failure()?.errorText}`));
  
  await page.goto('https://authentik.dev.questra.s2o.dev/if/flow/default-authentication-flow/', { 
    waitUntil: 'commit', 
    timeout: 60_000 
  });
  
  console.log('URL:', page.url());
  
  // Wait and see what loads
  await page.waitForTimeout(60000);
  
  console.log('ERRORS:', JSON.stringify(errors, null, 2));
  console.log('FAILED REQUESTS:', JSON.stringify(failedReqs, null, 2));
  console.log('TITLE:', await page.title());
  
  const bodyText = await page.locator('body').textContent();
  console.log('BODY SNIPPET:', bodyText?.substring(0, 300));
  
  await page.screenshot({ path: 'debug_auth.png' });
});
