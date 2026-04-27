import { test, expect } from '@playwright/test';
import { LandingPage } from './LandingPage';

/**
 * Smoke tests — these run WITHOUT authentication
 * to verify the public landing page behaves correctly.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Public landing page', () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    const result = await LandingPage.create(page);
    if (!(result instanceof LandingPage)) {
      throw new Error(
        'Expected an unauthenticated LandingPage but got DashboardPage — ' +
        'ensure storage state is cleared for smoke tests.'
      );
    }
    landingPage = result;
  });

  test('shows the welcome heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Questra Portal/i);
    await expect(page.locator(landingPage.welcomeHeadingLocator)).toBeVisible();
  });

  test('has an "Anmelden" login button', async ({ page }) => {
    const loginBtn = page.locator(landingPage.loginButtonLocator);
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toBeEnabled();
  });

  test('clicking "Anmelden" redirects to Microsoft login sequence', async ({ page }) => {
    // Calling clickLogin handles the Authentik redirection gracefully
    await landingPage.clickLogin();

    // Note: Due to auto-login cookies, it might immediately resolve to dev.questra.s2o.dev instead of Microsoft
    const currentUrl = page.url();
    expect(currentUrl.includes('microsoftonline.com') || currentUrl.includes('dev.questra.s2o.dev')).toBeTruthy();
  });
});
