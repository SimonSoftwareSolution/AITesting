import { Page, Locator, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// InventoryPage — Page Object for the Data Manager / Inventories section
// ---------------------------------------------------------------------------

export class InventoryPage {
  readonly page: Page;

  private constructor(page: Page) {
    this.page = page;
  }

  // ==========================================
  // FACTORY
  // ==========================================

  static async create(page: Page): Promise<InventoryPage> {
    await page.goto('https://dev.questra.s2o.dev/portal/data-manager/inventories', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    // Wait for the sidebar to confirm the page is loaded
    await page
      .locator('[data-test-locator="sidebar-item-data-manager-inventories"]')
      .waitFor({ state: 'visible', timeout: 60_000 });

    return new InventoryPage(page);
  }

  // ==========================================
  // ACTION METHODS — Inventory CRUD
  // ==========================================

  /**
   * Creates a new inventory via the "Inventory erstellen" dialog.
   * Waits for the inventory to appear in the sidebar list before returning.
   */
  async createInventory(def: InventoryDefinition): Promise<void> {
    // Open the create dialog via the sidebar "+" button (aria-label="Inventory hinzufügen")
    await this.page.locator('button[aria-label="Inventory hinzufügen"]').click();

    // Wait for the dialog
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15_000 });

    // Name field — placeholder: "z.B. InventoryName"
    await dialog.getByPlaceholder('z.B. InventoryName').fill(def.name);

    // Optional namespace — combobox with placeholder "Namespace auswählen..."
    if (def.namespace) {
      await dialog.getByPlaceholder('Namespace auswählen...').click();
      await this.page.getByRole('option', { name: def.namespace }).click();
    }

    // Optional description — use name="description" to avoid matching the property-level description input
    if (def.description) {
      await dialog.locator('input[name="description"]').fill(def.description);
    }

    // Add each property one by one
    for (const prop of def.properties) {
      await this.addPropertyRow(dialog, prop);
    }

    // Submit — button text "Inventory erstellen" (enabled once name + ≥1 property is valid)
    await dialog.getByRole('button', { name: 'Inventory erstellen', exact: true }).click();

    // Wait for the dialog to close
    await dialog.waitFor({ state: 'hidden', timeout: 30_000 });

    // Confirm the inventory appears in the sidebar
    await this.waitForInventoryInSidebar(def.name);
  }

  /**
   * Deletes an inventory by name via its context (⋮) menu in the sidebar.
   * Idempotent: if the inventory is not found, does not throw.
   */
  async deleteInventoryIfExists(name: string): Promise<void> {
    const item = this.getInventorySidebarItem(name);
    if (!(await item.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return; // Already gone
    }

    // Hover to reveal the ellipsis (⋮) icon button next to the inventory name
    await item.hover();
    // The ⋮ button is the last button sibling inside the inventory row
    const row = item.locator('..');
    const ellipsis = row.locator('button').last();
    await ellipsis.click();

    // Click "Löschen" in the context menu
    await this.page.getByRole('menuitem', { name: /löschen/i }).click();

    // Confirm the delete dialog if it appears
    const confirmBtn = this.page.getByRole('button', { name: /löschen|bestätigen|confirm/i });
    if (await confirmBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Wait for the inventory to disappear from the sidebar
    await item.waitFor({ state: 'hidden', timeout: 30_000 });
  }

  /**
   * Opens an inventory by clicking its name in the sidebar.
   */
  async openInventory(name: string): Promise<void> {
    await this.getInventorySidebarItem(name).click();
    // Wait for the entry-add button to appear — confirms the detail view is loaded
    await this.page
      .locator('[data-test-locator="inventory-items-create-button"]')
      .waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Adds an entry to the currently-open inventory.
   * `values` is a map of { propertyName: value } where value is a string representation.
   */
  async addEntry(values: Record<string, string>): Promise<void> {
    // The "hinzufügen" button in the detail view toolbar
    // data-test-locator="inventory-items-create-button"
    await this.page
      .locator('[data-test-locator="inventory-items-create-button"]')
      .click();

    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15_000 });

    // Fill each field by matching the input's associated label text
    for (const [field, value] of Object.entries(values)) {
      await this.fillEntryField(dialog, field, value);
    }

    // Save — look for common confirm button labels
    await dialog
      .getByRole('button', { name: /speichern|save|erstellen|anlegen/i })
      .click();
    await dialog.waitFor({ state: 'hidden', timeout: 30_000 });
  }

  // ==========================================
  // HELPER / PRIVATE METHODS
  // ==========================================

  private async addPropertyRow(dialog: Locator, prop: PropertyDefinition): Promise<void> {
    // Property name — placeholder: "z.B. propertyName"
    await dialog.getByPlaceholder('z.B. propertyName').fill(prop.name);

    // Data type — combobox with placeholder: "Datentyp wählen..."
    await dialog.getByPlaceholder('Datentyp wählen...').click();
    await this.page.getByRole('option', { name: prop.type, exact: true }).click();

    // Optional property description — second "Beschreibung (optional)" textbox in the dialog
    if (prop.description) {
      // The property row description is a separate textbox from the inventory description
      const descInputs = dialog.getByPlaceholder('Beschreibung (optional)');
      await descInputs.last().fill(prop.description);
    }
    
    // Some property types have required constraints (e.g., STRING requires Max Length, DECIMAL might require Precision)
    // We look for any spinbuttons (number inputs) that appear and fill them with default values
    const spinbuttons = dialog.getByRole('spinbutton');
    const spinbuttonCount = await spinbuttons.count();
    for (let i = 0; i < spinbuttonCount; i++) {
        const spinbutton = spinbuttons.nth(i);
        if (await spinbutton.isVisible()) {
            // Using 50 because some fields (like TIME_SERIES Interval) fail validation if >= 100
            await spinbutton.fill('50');
        }
    }

    // Some property types (like TIME_SERIES) require a "Unit of Measure" dropdown
    const unitCombobox = dialog.getByRole('combobox', { name: /Select unit/i });
    if (await unitCombobox.isVisible().catch(() => false)) {
        await unitCombobox.click();
        await this.page.getByRole('option').first().click();
    }

    // Toggle "Array" if needed (button accessible name: "Ist Array")
    if (prop.isArray) {
      await dialog.getByRole('button', { name: 'Ist Array', exact: true }).click();
    }

    // Toggle "Unique" if needed (button accessible name: "Einzigartig")
    if (prop.isUnique) {
      await dialog.getByRole('button', { name: 'Einzigartig', exact: true }).click();
    }

    // "Property hinzufügen" — enabled once name + type are filled
    // Wait for it to become enabled before clicking
    const addPropBtn = dialog.getByRole('button', { name: 'Property hinzufügen', exact: true });
    await addPropBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await expect(addPropBtn).toBeEnabled({ timeout: 5_000 });
    await addPropBtn.click();

    // Wait for the new row to appear in the properties table
    await this.page.waitForTimeout(400);
  }

  private async fillEntryField(dialog: Locator, fieldLabel: string, value: string): Promise<void> {
    // 1. Try to find by name attribute (often the truest mapping in form libraries)
    const byName = dialog.locator(`input[name="${fieldLabel}"], textarea[name="${fieldLabel}"]`);
    if (await byName.count() > 0 && await byName.first().isVisible()) {
      if ((await byName.first().getAttribute('type')) === 'checkbox') {
         value === 'true' ? await byName.first().check() : await byName.first().uncheck();
      } else {
         await byName.first().fill(value);
      }
      return;
    }

    // 2. Try accessible name for textboxes and spinbuttons
    const textRoles = ['textbox', 'spinbutton'];
    for (const role of textRoles) {
      const field = dialog.getByRole(role as any, { name: fieldLabel, exact: false }).first();
      if (await field.isVisible().catch(() => false)) {
        await field.fill(value);
        return;
      }
    }

    // 3. Try checkbox (for booleans)
    const checkbox = dialog.getByRole('checkbox', { name: fieldLabel, exact: false }).first();
    if (await checkbox.isVisible().catch(() => false)) {
      value === 'true' ? await checkbox.check() : await checkbox.uncheck();
      return;
    }

    // 4. Fallback: by placeholder
    const byPlaceholder = dialog.locator(`input[placeholder*="${fieldLabel}"]`).first();
    if (await byPlaceholder.isVisible().catch(() => false)) {
      await byPlaceholder.fill(value);
      return;
    }

    // 5. Fallback: Inside a group with that name (e.g., MUI date pickers)
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

  // ==========================================
  // LOCATOR HELPERS
  // ==========================================

  getInventorySidebarItem(name: string): Locator {
    // Each inventory is rendered as a <p> with its name inside the inventory list
    return this.page
      .locator('[data-test-locator="inventory-box-list"] p')
      .filter({ hasText: name })
      .first();
  }

  async waitForInventoryInSidebar(name: string, timeout = 30_000): Promise<void> {
    await this.getInventorySidebarItem(name).waitFor({ state: 'visible', timeout });
  }

  // ==========================================
  // LOCATOR STRINGS (public for specs)
  // ==========================================

  readonly inventoryBoxListLocator  = '[data-test-locator="inventory-box-list"]';
  readonly sidebarAddButtonLocator  = 'button[aria-label="Inventory hinzufügen"]';
  readonly inventorySearchLocator   = 'input[placeholder="search"]';
  readonly createDialogTitleLocator = 'text="Inventory erstellen"';
  readonly cancelButtonLocator      = 'button:has-text("Abbrechen")';
  readonly submitButtonLocator      = 'button:has-text("Inventory erstellen")';
}
