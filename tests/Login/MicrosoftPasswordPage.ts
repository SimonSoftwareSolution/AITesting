import { Page } from '@playwright/test';

export class MicrosoftPasswordPage {
  readonly page: Page;

  private constructor(page: Page) {
    this.page = page;
  }

  static async create(page: Page): Promise<MicrosoftPasswordPage> {
    const instance = new MicrosoftPasswordPage(page);
    await page.locator(instance.passwordInputLocator).waitFor({ timeout: 15_000 });
    return instance;
  }

  async enterPassword(password: string): Promise<void> {
    await this.page.locator(this.passwordInputLocator).fill(password);
    await this.page.locator(this.signInButtonLocator).click();
    try {
      const declineBtn = this.page.locator(this.declineStaySignedInLocator);
      await declineBtn.waitFor({ timeout: 8_000 });
      await declineBtn.click();
    } catch { }
    await this.page.waitForURL(/dev\.questra\.s2o\.dev\/portal/, { timeout: 30_000 });
  }

  readonly passwordInputLocator = 'input[type="password"], input[name="passwd"]';
  readonly signInButtonLocator = 'button:has-text("Sign in"), input[type="submit"][value="Sign in"]';
  readonly declineStaySignedInLocator = 'button:has-text("No"), input[type="button"][value="No"]';
}
