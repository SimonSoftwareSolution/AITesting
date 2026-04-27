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
    await this.page.goto('https://dev.questra.s2o.dev/portal', { waitUntil: 'commit', timeout: 120000 });

    // Wait for the portal to completely resolve — either showing login or dashboard nav
    const settledLocator = this.page
      .locator(`${this.loginButtonLocator}, [data-test-locator^="sidebar-item"]`)
      .first();
    await settledLocator.waitFor({ timeout: 90_000 });

    const hasLoginBtn = await this.page.locator(this.loginButtonLocator).isVisible();

    // Unauthenticated → return self; auto-logged in → hand off to DashboardPage
    return hasLoginBtn ? this : DashboardPage.create(this.page);
  }

  async clickLogin(): Promise<MicrosoftUsernamePage> {
    await this.page.locator(this.loginButtonLocator).click();

    // Wait for navigation to leave the portal — use networkidle-style approach.
    // We don't use waitForURL with waitUntil:'domcontentloaded' because Authentik
    // can be slow to render even after domcontentloaded fires.
    // Instead, just wait until we're no longer on dev.questra.s2o.dev.
    await this.page.waitForFunction(
      () => !window.location.hostname.includes('questra.s2o.dev') ||
             window.location.hostname.includes('authentik'),
      { timeout: 60_000 }
    ).catch(async () => {
      // If waitForFunction times out, check current URL — we may already be there
      const currentUrl = this.page.url();
      if (!currentUrl.includes('authentik') && currentUrl.includes('questra.s2o.dev')) {
        throw new Error(`Login redirect did not occur. Still on: ${currentUrl}`);
      }
    });

    return MicrosoftUsernamePage.create(this.page);
  }

  // ==========================================
  // LOCATOR STRINGS (Members at the bottom)
  // ==========================================
  readonly welcomeHeadingLocator = 'text=Willkommen';
  readonly loginButtonLocator = 'button:has-text("Anmelden")';
}
