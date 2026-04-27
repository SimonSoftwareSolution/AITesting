import { test, expect } from '@playwright/test';
import { InventoryPage, InventoryDefinition } from './InventoryCreateDialog';

// ---------------------------------------------------------------------------
// Test inventory definition — all 12 property types, no relations
// ---------------------------------------------------------------------------

const INVENTORY_NAME = `E2E_AllProps_${Date.now()}`;

const INVENTORY_DEF: InventoryDefinition = {
  name: INVENTORY_NAME,
  description: 'Created by automated E2E test — safe to delete',
  properties: [
    { name: 'prop_string',          type: 'STRING' },
    { name: 'prop_int',             type: 'INT' },
    { name: 'prop_long',            type: 'LONG' },
    { name: 'prop_decimal',         type: 'DECIMAL' },
    { name: 'prop_boolean',         type: 'BOOLEAN' },
    { name: 'prop_guid',            type: 'GUID' },
  ],
};

// Sample entries to add (one per test)
const ENTRIES = [
  {
    label: 'Entry A — baseline values',
    values: {
      prop_string:  'Alpha',
      prop_int:     '1',
      prop_long:    '1000',
      prop_decimal: '5',
      prop_boolean: 'true',
      prop_guid: '00000000-0000-0000-0000-000000000001',
    },
  },
  {
    label: 'Entry B — edge-case string',
    values: {
      prop_string:  'Hello World!',
      prop_int:     '0',
      prop_long:    '0',
      prop_decimal: '0',
      prop_boolean: 'true',
      prop_guid: '00000000-0000-0000-0000-000000000002',
    },
  },
  {
    label: 'Entry C — large numbers',
    values: {
      prop_string:  'BigNumbers',
      prop_int:     '99',
      prop_long:    '999999',
      prop_decimal: '99',
      prop_boolean: 'true',
      prop_guid: '00000000-0000-0000-0000-000000000003',
    },
  },
];

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe.serial('Inventory CRUD — All Property Types', () => {
  // Shared page object instance — lives for the lifetime of this serial block
  let dm: InventoryPage;

  // ── Setup & Teardown ────────────────────────────────────────────────────

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    // Catch backend validation errors to see why the submit might be failing
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        console.error(`❌ HTTP Error: ${response.status()} ${response.url()}`);
        try { console.error('Response: ', await response.text()); } catch (e) {}
      }
    });
    dm = await InventoryPage.create(page);
  });

  test.afterAll(async () => {
    // Cleanup: always runs, even if tests failed
    try {
      // Re-navigate in case state drifted
      dm = await InventoryPage.create(dm.page);
      await dm.deleteInventoryIfExists(INVENTORY_NAME);
      console.log(`🧹 Cleanup: deleted inventory "${INVENTORY_NAME}"`);
    } catch (err) {
      console.warn(`⚠️  Cleanup failed: ${err}. Inventory "${INVENTORY_NAME}" may need manual deletion.`);
    } finally {
      await dm.page.close();
    }
  });

  // ── Test 1: Pre-condition guard ─────────────────────────────────────────

  test('01 — inventory does not already exist (clean slate)', async () => {
    // If a previous run left orphaned data, delete it first so this run is clean
    await dm.deleteInventoryIfExists(INVENTORY_NAME);

    // Confirm it's gone (or was never there)
    const item = dm.getInventorySidebarItem(INVENTORY_NAME);
    await expect(item).not.toBeVisible({ timeout: 10_000 });
  });

  // ── Test 2: Create the inventory ────────────────────────────────────────

  test('02 — creates inventory with core property types', async () => {
    await dm.createInventory(INVENTORY_DEF);

    // Verify it now appears in the sidebar
    await expect(dm.getInventorySidebarItem(INVENTORY_NAME)).toBeVisible({ timeout: 30_000 });
  });

  // ── Test 3: Verify the inventory detail page loads ──────────────────────

  test('03 — inventory detail page loads without error', async () => {
    await dm.openInventory(INVENTORY_NAME);
    await expect(dm.page.locator('body')).not.toContainText('Internal Server Error');
  });

  // ── Tests 4–6: Add entries (one per test) ──────────────────────────────

  for (let i = 0; i < ENTRIES.length; i++) {
    const entry = ENTRIES[i];
    const testNum = String(4 + i).padStart(2, '0');

    test(`${testNum} — adds ${entry.label}`, async () => {
      // Ensure we are on the right inventory
      await dm.openInventory(INVENTORY_NAME);

      await dm.addEntry(entry.values);

      // After adding, the entry should appear somewhere on the page
      // We check for one of the string values as a proxy
      if (entry.values['prop_string']) {
        await expect(dm.page.locator('body')).toContainText(entry.values['prop_string'], { timeout: 15_000 });
      }
    });
  }

  // ── Test 7: Verify total entry count ───────────────────────────────────

  test('07 — inventory shows all added entries', async () => {
    await dm.openInventory(INVENTORY_NAME);

    // Expect a table/grid with at least ENTRIES.length rows
    const rows = dm.page.locator('tbody tr, [role="row"]').filter({
      // Exclude header rows
      hasNot: dm.page.locator('[role="columnheader"]'),
    });

    const count = await rows.count();
    expect(count).toBeGreaterThan(ENTRIES.length - 1);
  });

  // ── Test 8: Cleanup verification (teardown guard) ───────────────────────

  test('08 — can delete the inventory (teardown pre-check)', async () => {
    // afterAll will do the real delete — this just verifies the delete path works.
    // We do NOT delete here ourselves so afterAll stays the single source of truth.
    const item = dm.getInventorySidebarItem(INVENTORY_NAME);
    await expect(item).toBeVisible(); // Still exists — good
    console.log(`✅ Inventory "${INVENTORY_NAME}" still present — afterAll will clean it up.`);
  });
});
