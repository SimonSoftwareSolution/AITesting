import { Page } from '@playwright/test';
import { MicrosoftPasswordPage } from './MicrosoftPasswordPage';

export class MicrosoftUsernamePage {
  readonly page: Page;

  private constructor(page: Page) {
    this.page = page;
  }

  /**
   * Factory method — returns a MicrosoftUsernamePage representing wherever the
   * redirect chain has landed after clicking Login. Does NOT wait for Microsoft
   * specific elements here, because in 'direct' auth mode (Authentik form) we
   * never reach microsoftonline.com. The actual Microsoft wait is in enterUsername().
   */
  static async create(page: Page): Promise<MicrosoftUsernamePage> {
    return new MicrosoftUsernamePage(page);
  }

  // ==========================================
  // ACTION METHODS
  // ==========================================
  async isOnPage(): Promise<boolean> {
    return this.page.url().includes('microsoftonline.com');
  }

  async enterUsername(username: string): Promise<MicrosoftPasswordPage> {
    await this.page.locator(this.emailInputLocator).fill(username);
    await this.page.locator(this.nextButtonLocator).click();
    return MicrosoftPasswordPage.create(this.page);
  }

  // ==========================================
  // LOCATOR STRINGS
  // ==========================================
  readonly emailInputLocator = 'input[type="email"], input[name="loginfmt"]';
  readonly nextButtonLocator = 'button:has-text("Next"), input[type="submit"][value="Next"]';
}
