import { Page, Locator, expect } from '@playwright/test';
import { InventoryPage } from '../Inventory/InventoryPage';

export type PropertyType =
  | 'BOOLEAN'
  | 'DATE'
  | 'DATE_TIME'
  | 'DATE_TIME_OFFSET'
  | 'DECIMAL'
  | 'FILE'
  | 'GUID'
  | 'INT'
  | 'LONG'
  | 'STRING'
  | 'TIME'
  | 'TIME_SERIES';

export interface PropertyDefinition {
  name: string;
  type: PropertyType;
  description?: string;
  isArray?: boolean;
  isUnique?: boolean;
}

export interface InventoryDefinition {
  name: string;
  namespace?: string;
  description?: string;
  properties: PropertyDefinition[];
}

export class InventoryDialogPage {
  readonly page: Page;
  readonly dialog: Locator;

  constructor(page: Page, dialog: Locator) {
    this.page = page;
    this.dialog = dialog;
  }

  async fillInventoryDetails(def: InventoryDefinition): Promise<this> {
    await this.dialog.getByPlaceholder('z.B. InventoryName').fill(def.name);
    if (def.namespace) {
      await this.dialog.getByPlaceholder('Namespace auswählen...').click();
      await this.page.getByRole('option', { name: def.namespace }).click();
    }
    if (def.description) {
      await this.dialog.locator('input[name="description"]').fill(def.description);
    }
    for (const prop of def.properties) {
      await this.addPropertyRow(prop);
    }
    return this;
  }

  async submit(): Promise<InventoryPage> {
    await this.dialog.getByRole('button', { name: 'Inventory erstellen', exact: true }).click();
    await this.dialog.waitFor({ state: 'hidden', timeout: 30_000 });
    return await InventoryPage.create(this.page);
  }

  private async addPropertyRow(prop: PropertyDefinition): Promise<void> {
    await this.dialog.getByPlaceholder('z.B. propertyName').fill(prop.name);
    await this.dialog.getByPlaceholder('Datentyp wählen...').click();
    await this.page.getByRole('option', { name: prop.type, exact: true }).click();
    if (prop.description) {
      await this.dialog.getByPlaceholder('Beschreibung (optional)').last().fill(prop.description);
    }
    const spinbuttons = this.dialog.getByRole('spinbutton');
    const spinbuttonCount = await spinbuttons.count();
    for (let i = 0; i < spinbuttonCount; i++) {
      const spinbutton = spinbuttons.nth(i);
      if (await spinbutton.isVisible()) {
        await spinbutton.fill('50');
      }
    }
    const unitCombobox = this.dialog.getByRole('combobox', { name: /Select unit/i });
    if (await unitCombobox.isVisible().catch(() => false)) {
      await unitCombobox.click();
      await this.page.getByRole('option').first().click();
    }
    if (prop.isArray) {
      await this.dialog.getByRole('button', { name: 'Ist Array', exact: true }).click();
    }
    if (prop.isUnique) {
      await this.dialog.getByRole('button', { name: 'Einzigartig', exact: true }).click();
    }
    const addPropBtn = this.dialog.getByRole('button', { name: 'Property hinzufügen', exact: true });
    await addPropBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await expect(addPropBtn).toBeEnabled({ timeout: 5_000 });
    await addPropBtn.click();
    await this.page.waitForTimeout(400);
  }

  readonly createDialogTitleLocator = 'text="Inventory erstellen"';
  readonly cancelButtonLocator = 'button:has-text("Abbrechen")';
  readonly submitButtonLocator = 'button:has-text("Inventory erstellen")';
}
