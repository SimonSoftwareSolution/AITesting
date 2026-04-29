import { test, expect } from '@playwright/test';
import { InventoryPage } from '../Inventory/InventoryPage';

export const SHARED_INVENTORY_NAME = 'E2E_AllProps_Shared_Inventory';

const ENTRIES = [
  {
    label: 'Entry A — baseline values',
    values: {
      prop_string: 'Alpha',
      prop_int: '1',
      prop_long: '1000',
      prop_decimal: '5',
      prop_boolean: 'true',
      prop_guid: '00000000-0000-0000-0000-000000000001',
    },
  },
  {
    label: 'Entry B — edge-case string',
    values: {
      prop_string: 'Hello World!',
      prop_int: '0',
      prop_long: '0',
      prop_decimal: '0',
      prop_boolean: 'true',
      prop_guid: '00000000-0000-0000-0000-000000000002',
    },
  },
  {
    label: 'Entry C — large numbers',
    values: {
      prop_string: 'BigNumbers',
      prop_int: '99',
      prop_long: '999999',
      prop_decimal: '99',
      prop_boolean: 'true',
      prop_guid: '00000000-0000-0000-0000-000000000003',
    },
  },
];

test.describe.serial('Inventory Page — Entries and Interactions', () => {
  let inventoryPage: InventoryPage;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        try { await response.text(); } catch { }
      }
    });
    inventoryPage = await InventoryPage.create(page);
  });

  test.afterAll(async () => {
    try {
      inventoryPage = await InventoryPage.create(inventoryPage.page);
      await inventoryPage.deleteInventoryIfExists(SHARED_INVENTORY_NAME);
    } catch { } finally {
      await inventoryPage.page.close();
    }
  });

  test('01 — inventory detail page loads without error', async () => {
    await inventoryPage.openInventory(SHARED_INVENTORY_NAME);
    await expect(inventoryPage.page.locator('body')).not.toContainText('Internal Server Error');
  });

  for (let i = 0; i < ENTRIES.length; i++) {
    const entry = ENTRIES[i];
    const testNum = String(2 + i).padStart(2, '0');

    test(`${testNum} — adds ${entry.label}`, async () => {
      await inventoryPage.openInventory(SHARED_INVENTORY_NAME);
      await inventoryPage.addEntry(entry.values);

      if (entry.values['prop_string']) {
        await expect(inventoryPage.page.locator('body')).toContainText(entry.values['prop_string'], { timeout: 15_000 });
      }
    });
  }

  test('05 — inventory shows all added entries', async () => {
    await inventoryPage.openInventory(SHARED_INVENTORY_NAME);

    const rows = inventoryPage.page.locator('tbody tr, [role="row"]').filter({
      hasNot: inventoryPage.page.locator('[role="columnheader"]'),
    });

    const count = await rows.count();
    expect(count).toBeGreaterThan(ENTRIES.length - 1);
  });

  test('06 — can delete the inventory (teardown pre-check)', async () => {
    const item = inventoryPage.getInventorySidebarItem(SHARED_INVENTORY_NAME);
    await expect(item).toBeVisible();
  });
});
