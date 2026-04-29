import { Page } from '@playwright/test';

export class NavigationBar {
  readonly page: Page;

  private constructor(page: Page) {
    this.page = page;
  }

  static async create(page: Page): Promise<NavigationBar> {
    const instance = new NavigationBar(page);
    await page.locator(instance.sidebarLocator).first().waitFor({ timeout: 60_000 });
    return instance;
  }

  async isOnDashboard(): Promise<boolean> {
    return this.page.url() === 'https://dev.questra.s2o.dev/portal';
  }

  async openUserMenu() {
    await this.page.locator(this.userAvatarLocator).click();
  }

  async clickLogout() {
    await this.page.locator(this.logoutButtonLocator).click();
  }

  async navigateToPages() {
    await this.page.goto('https://dev.questra.s2o.dev/portal/page');
  }

  async navigateToAccessManager() {
    await this.page.goto('https://dev.questra.s2o.dev/portal/access-manager/users');
  }

  async navigateToDataManager() {
    await this.page.goto('https://dev.questra.s2o.dev/portal/data-manager/inventories');
  }

  async navigateToAutomationManager() {
    await this.page.goto('https://dev.questra.s2o.dev/portal/automation-manager/automations');
  }

  readonly sidebarLocator = '[data-test-locator^="sidebar-item"]';
  readonly userAvatarLocator = '[class*="avatar"], [class*="Avatar"], [aria-label*="user"], [aria-label*="profil"]';
  readonly logoutButtonLocator = 'text=/abmelden/i';
  readonly versionBadgeLocator = 'text=/\\d+\\.\\d+\\.\\d+/';
}
