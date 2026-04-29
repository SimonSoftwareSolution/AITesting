import { Page } from '@playwright/test';
import { MicrosoftUsernamePage } from '../Login/MicrosoftUsernamePage';
import { DashboardPage } from '../Dashboard/DashboardPage';

export class LandingPage {
  readonly page: Page;

  private constructor(page: Page) {
    this.page = page;
  }

  static async create(page: Page): Promise<LandingPage | DashboardPage> {
    const instance = new LandingPage(page);
    return instance.navigate();
  }

  private async navigate(): Promise<LandingPage | DashboardPage> {
    await this.page.goto('https://dev.questra.s2o.dev/portal', { waitUntil: 'domcontentloaded', timeout: 120000 });

    const settledLocator = this.page
      .locator(`${this.loginButtonLocator}, [data-test-locator^="sidebar-item"]`)
      .first();
    await settledLocator.waitFor({ timeout: 60_000 });

    const hasLoginBtn = await this.page.locator(this.loginButtonLocator).isVisible();
    return hasLoginBtn ? this : DashboardPage.create(this.page);
  }

  async clickLogin(): Promise<MicrosoftUsernamePage> {
    await this.page.locator(this.loginButtonLocator).click();
    await this.page.waitForURL(
      (url) =>
        url.hostname.includes('authentik') ||
        url.hostname.includes('microsoftonline.com') ||
        url.hostname !== 'dev.questra.s2o.dev',
      { timeout: 60_000, waitUntil: 'domcontentloaded' }
    );
    return MicrosoftUsernamePage.create(this.page);
  }

  readonly welcomeHeadingLocator = 'text=Willkommen';
  readonly loginButtonLocator = 'button:has-text("Anmelden")';
}
