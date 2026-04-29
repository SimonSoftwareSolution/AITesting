import { Page } from '@playwright/test';
import { NavigationBar } from '../NavigationBar/NavigationBar';

export class DashboardPage {
  readonly page: Page;
  readonly navbar: NavigationBar;

  private constructor(page: Page, navbar: NavigationBar) {
    this.page = page;
    this.navbar = navbar;
  }

  static async create(page: Page): Promise<DashboardPage> {
    const navbar = await NavigationBar.create(page);
    return new DashboardPage(page, navbar);
  }

  async getWelcomeMessageText() {
    return await this.page.locator(this.welcomeBackHeadingLocator).textContent();
  }

  async clickAddFirstWidget() {
    await this.page.locator(this.addFirstWidgetButtonLocator).click();
  }

  readonly welcomeBackHeadingLocator = 'text=/willkommen zurück/i';
  readonly addFirstWidgetButtonLocator = 'button:has-text("Erstes Widget hinzufügen"), button:has-text("Add first widget")';
  readonly documentationLinkLocator = 'a:has-text("Dokumentation")';
  readonly inventoryCardLocator = 'text=Inventories';
  readonly accessCardLocator = 'text=Access';
  readonly automationCardLocator = 'text=Automation';
}
