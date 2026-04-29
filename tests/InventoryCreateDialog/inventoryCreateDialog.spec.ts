import { test, expect } from '@playwright/test';
import { InventoryPage } from '../Inventory/InventoryPage';
import { InventoryDefinition } from './InventoryCreateDialog';

export const SHARED_INVENTORY_NAME = 'E2E_AllProps_Shared_Inventory';

const INVENTORY_DEF: InventoryDefinition = {
  name: SHARED_INVENTORY_NAME,
  description: 'Created by automated E2E test — safe to delete',
  properties: [
    { name: 'prop_string', type: 'STRING' },
    { name: 'prop_int', type: 'INT' },
    { name: 'prop_long', type: 'LONG' },
    { name: 'prop_decimal', type: 'DECIMAL' },
    { name: 'prop_boolean', type: 'BOOLEAN' },
    { name: 'prop_guid', type: 'GUID' },
  ],
};

test.describe.serial('Inventory Create Dialog', () => {
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
    await inventoryPage.page.close();
  });

  test('01 — inventory does not already exist (clean slate)', async () => {
    await inventoryPage.deleteInventoryIfExists(SHARED_INVENTORY_NAME);
    const item = inventoryPage.getInventorySidebarItem(SHARED_INVENTORY_NAME);
    await expect(item).not.toBeVisible({ timeout: 10_000 });
  });

  test('02 — creates inventory with core property types', async () => {
    inventoryPage = await inventoryPage.createNewInventory()
      .then(dialog => dialog.fillInventoryDetails(INVENTORY_DEF))
      .then(dialog => dialog.submit());
    await expect(inventoryPage.getInventorySidebarItem(SHARED_INVENTORY_NAME)).toBeVisible({ timeout: 30_000 });
  });
});
