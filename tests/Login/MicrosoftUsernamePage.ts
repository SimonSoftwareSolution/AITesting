import { Page } from '@playwright/test';
import { MicrosoftPasswordPage } from './MicrosoftPasswordPage';

export class MicrosoftUsernamePage {
  readonly page: Page;

  private constructor(page: Page) {
    this.page = page;
  }

  static async create(page: Page): Promise<MicrosoftUsernamePage> {
    return new MicrosoftUsernamePage(page);
  }

  async isOnPage(): Promise<boolean> {
    return this.page.url().includes('microsoftonline.com');
  }

  async enterUsername(username: string): Promise<MicrosoftPasswordPage> {
    await this.page.locator(this.emailInputLocator).fill(username);
    await this.page.locator(this.nextButtonLocator).click();
    return MicrosoftPasswordPage.create(this.page);
  }

  readonly emailInputLocator = 'input[type="email"], input[name="loginfmt"]';
  readonly nextButtonLocator = 'button:has-text("Next"), input[type="submit"][value="Next"]';
}
