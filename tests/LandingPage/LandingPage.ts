import { Page } from '@playwright/test';
import { MicrosoftUsernamePage } from '../Login/MicrosoftUsernamePage';
import { DashboardPage } from '../Dashboard/DashboardPage';

export class LandingPage {
  readonly page: Page;

  // Private — use LandingPage.create(page) instead.
  private constructor(page: Page) {
    this.page = page;
  }

  /**
   * Factory method — the only way to obtain a LandingPage.
   * Navigates to the portal and waits for the page to settle before returning,
   * guaranteeing the instance is always in a usable state.
   *
   * Returns a DashboardPage if the session is already authenticated
   * (auto-login via cookies), or a LandingPage if the login button is present.
   */
  static async create(page: Page): Promise<LandingPage | DashboardPage> {
    const instance = new LandingPage(page);
    return instance.navigate();
  }

  // ==========================================
  // ACTION METHODS
  // ==========================================

  /** Navigate and wait for the page to settle. Called once internally by create(). */
  private async navigate(): Promise<LandingPage | DashboardPage> {
    await this.page.goto('https://dev.questra.s2o.dev/portal', { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Wait for the portal to completely resolve — either showing login or dashboard nav
    const settledLocator = this.page
      .locator(`${this.loginButtonLocator}, [data-test-locator^="sidebar-item"]`)
      .first();
    await settledLocator.waitFor({ timeout: 60_000 });

    const hasLoginBtn = await this.page.locator(this.loginButtonLocator).isVisible();

    // Unauthenticated → return self; auto-logged in → hand off to DashboardPage
    return hasLoginBtn ? this : DashboardPage.create(this.page);
  }

  async clickLogin(): Promise<MicrosoftUsernamePage> {
    await this.page.locator(this.loginButtonLocator).click();

    // Wait until the browser has left the portal and landed on the auth flow.
    // Authentik can be slow to respond so we use a generous timeout.
    await this.page.waitForURL(
      (url) =>
        url.hostname.includes('authentik') ||
        url.hostname.includes('microsoftonline.com') ||
        url.hostname !== 'dev.questra.s2o.dev',
      { timeout: 60_000, waitUntil: 'domcontentloaded' }
    );

    return MicrosoftUsernamePage.create(this.page);
  }

  // ==========================================
  // LOCATOR STRINGS (Members at the bottom)
  // ==========================================
  readonly welcomeHeadingLocator = 'text=Willkommen';
  readonly loginButtonLocator = 'button:has-text("Anmelden")';
}
