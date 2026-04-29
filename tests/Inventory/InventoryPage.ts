import { Page, Locator } from '@playwright/test';
import { InventoryDialogPage } from '../InventoryCreateDialog/InventoryCreateDialog';

export class InventoryPage {
  readonly page: Page;

  private constructor(page: Page) {
    this.page = page;
  }

  static async create(page: Page): Promise<InventoryPage> {
    await page.goto('https://dev.questra.s2o.dev/portal/data-manager/inventories', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page
      .locator('[data-test-locator="sidebar-item-data-manager-inventories"]')
      .waitFor({ state: 'visible', timeout: 60_000 });
    return new InventoryPage(page);
  }

  async createNewInventory(): Promise<InventoryDialogPage> {
    await this.page.getByRole('button', { name: /inventory hinzufügen|hinzufügen/i }).first().click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15_000 });
    return new InventoryDialogPage(this.page, dialog);
  }

  async deleteInventoryIfExists(name: string): Promise<void> {
    const item = this.getInventorySidebarItem(name);
    if (!(await item.isVisible({ timeout: 5_000 }).catch(() => false))) return;
    await item.hover();
    const ellipsis = item.locator('..').locator('button').last();
    await ellipsis.click();
    await this.page.getByRole('menuitem', { name: /löschen/i }).click();
    const confirmBtn = this.page.getByRole('button', { name: /löschen|bestätigen|confirm/i });
    if (await confirmBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await item.waitFor({ state: 'hidden', timeout: 30_000 });
  }

  async openInventory(name: string): Promise<void> {
    await this.getInventorySidebarItem(name).click();
    await this.page
      .locator('[data-test-locator="inventory-items-create-button"]')
      .waitFor({ state: 'visible', timeout: 30_000 });
  }

  async addEntry(values: Record<string, string>): Promise<void> {
    await this.page.locator('[data-test-locator="inventory-items-create-button"]').click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15_000 });
    for (const [field, value] of Object.entries(values)) {
      await this.fillEntryField(dialog, field, value);
    }
    await dialog.getByRole('button', { name: /speichern|save|erstellen|anlegen/i }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 30_000 });
  }

  private async fillEntryField(dialog: Locator, fieldLabel: string, value: string): Promise<void> {
    const byName = dialog.locator(`input[name="${fieldLabel}"], textarea[name="${fieldLabel}"]`);
    if (await byName.count() > 0 && await byName.first().isVisible()) {
      if ((await byName.first().getAttribute('type')) === 'checkbox') {
        value === 'true' ? await byName.first().check() : await byName.first().uncheck();
      } else {
        await byName.first().fill(value);
      }
      return;
    }
    for (const role of ['textbox', 'spinbutton']) {
      const field = dialog.getByRole(role as any, { name: fieldLabel, exact: false }).first();
      if (await field.isVisible().catch(() => false)) {
        await field.fill(value);
        return;
      }
    }
    const checkbox = dialog.getByRole('checkbox', { name: fieldLabel, exact: false }).first();
    if (await checkbox.isVisible().catch(() => false)) {
      value === 'true' ? await checkbox.check() : await checkbox.uncheck();
      return;
    }
    const byPlaceholder = dialog.locator(`input[placeholder*="${fieldLabel}"]`).first();
    if (await byPlaceholder.isVisible().catch(() => false)) {
      await byPlaceholder.fill(value);
      return;
    }
    const group = dialog.getByRole('group', { name: fieldLabel, exact: false });
    if (await group.isVisible().catch(() => false)) {
      const innerInput = group.locator('input').last();
      if (await innerInput.isVisible().catch(() => false)) {
        await innerInput.fill(value);
        return;
      }
    }
    throw new Error(`Could not find a fillable input for field: ${fieldLabel}`);
  }

  getInventorySidebarItem(name: string): Locator {
    return this.page
      .locator('[data-test-locator="inventory-box-list"] p')
      .filter({ hasText: name })
      .first();
  }

  async waitForInventoryInSidebar(name: string, timeout = 30_000): Promise<void> {
    await this.getInventorySidebarItem(name).waitFor({ state: 'visible', timeout });
  }

  readonly inventoryBoxListLocator  = '[data-test-locator="inventory-box-list"]';
  readonly sidebarAddButtonLocator  = 'button[aria-label="Inventory hinzufügen"]';
  readonly inventorySearchLocator   = 'input[placeholder="search"]';
}
