import { test, expect } from '@playwright/test';
import { NavigationBar } from './NavigationBar';

async function ensureAuthenticated(page: any, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
  const sidebar = page.locator('[data-test-locator^="sidebar-item"]').first()
  const anmelden = page.getByRole('button', { name: /^Anmelden$/i }).first()
  try {
    await Promise.race([
      sidebar.waitFor({ state: 'visible', timeout: 60000 }),
      anmelden.waitFor({ state: 'visible', timeout: 60000 })
    ])
  } catch { }
  if (await anmelden.isVisible()) {
    await anmelden.click()
    await sidebar.waitFor({ state: 'visible', timeout: 60000 })
  }
}

test.describe('Navigation Bar & User Menu', { tag: '@smoke' }, () => {
  let navBar: NavigationBar;

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, 'https://dev.questra.s2o.dev/portal');
    navBar = await NavigationBar.create(page);
  });

  test('sidebar is visible', async ({ page }) => {
    const sidebar = page.locator(navBar.sidebarLocator).first();
    await expect(sidebar).toBeVisible();
  });

  test('displays current version badge', async ({ page }) => {
    await expect(page.locator(navBar.versionBadgeLocator)).toBeVisible();
  });

  test('shows user avatar / initials in the sidebar', async ({ page }) => {
    const avatar = page.locator(navBar.userAvatarLocator).first();
    await expect(avatar).toBeVisible();
  });

  test('user menu opens on avatar click and shows Abmelden option', async ({ page }) => {
    await navBar.openUserMenu();
    await expect(page.locator(navBar.logoutButtonLocator)).toBeVisible();
  });

  test('navigating via Eigene Seiten (Pages) loads without error', async ({ page }) => {
    await navBar.navigateToPages();
    await expect(page).toHaveURL(/\/portal\/page/);
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    await expect(page.locator('body')).not.toContainText('500');
  });
});
