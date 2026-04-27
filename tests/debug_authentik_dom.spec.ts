import { test } from '@playwright/test';
import * as fs from 'fs';

test('dump authentik library dom', async ({ page }) => {
  // Navigate to authentik and login
  await page.goto(
    'https://authentik.dev.questra.s2o.dev/if/flow/default-authentication-flow/?client_id=Questra&redirect_uri=https%3A%2F%2Fdev.questra.s2o.dev%2Fportal%2Fsignin-oidc&response_type=code&scope=profile+offline_access',
    { waitUntil: 'commit', timeout: 120_000 }
  );

  await page.locator('#ak-identifier-input').waitFor({ timeout: 120_000 });
  await page.locator('#ak-identifier-input').fill(process.env.QUESTRA_USERNAME!);
  await page.locator('#ak-stage-identification-password').fill(process.env.QUESTRA_PASSWORD!);
  await page.getByRole('button', { name: /log in/i }).click();

  // Wait for the library
  await page.waitForURL(url => url.pathname.includes('/if/user'), { timeout: 60_000 });
  await page.waitForTimeout(5000);

  // Get the full HTML
  const html = await page.content();
  fs.writeFileSync('authentik_library.html', html);
  console.log('HTML length:', html.length);

  // Get all elements with Questra text
  const elements = await page.evaluate(() => {
    const result: any[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      const el = node as Element;
      if (el.textContent?.includes('Questra') && el.children.length === 0) {
        result.push({
          tag: el.tagName,
          id: el.id,
          class: el.className,
          text: el.textContent?.trim().substring(0, 50),
          href: (el as any).href,
        });
      }
      node = walker.nextNode();
    }
    return result;
  });
  console.log('Elements with Questra:', JSON.stringify(elements, null, 2));

  // Check what's in shadow DOM of ak-application-card
  const shadowInfo = await page.evaluate(() => {
    const cards = document.querySelectorAll('ak-application-card');
    const results: any[] = [];
    for (const card of cards) {
      const shadow = card.shadowRoot;
      if (shadow) {
        results.push({
          outerHTML: card.outerHTML.substring(0, 200),
          shadowHTML: shadow.innerHTML.substring(0, 500),
        });
      } else {
        results.push({ outerHTML: card.outerHTML.substring(0, 200), noShadow: true });
      }
    }
    return results;
  });
  console.log('Shadow DOM info:', JSON.stringify(shadowInfo, null, 2));

  await page.screenshot({ path: 'authentik_library.png' });
});
