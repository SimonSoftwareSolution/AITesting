# DataManager — Inventory E2E Tests

This folder contains the end-to-end (E2E) test suite for the **Data Manager → Inventories** section of the Questra Portal.

---

## What is being tested?

The Questra Portal's Data Manager lets users define **Inventories** — typed schemas that act as structured data tables. Each Inventory is made up of **Properties** (columns) with strongly-typed data types, and can contain any number of **Entries** (rows).

This suite validates the full lifecycle of an Inventory through the UI:

| Phase | What is verified |
|---|---|
| **Pre-condition** | No stale data from a previous run exists |
| **Create** | An inventory with all 12 property types can be created |
| **Navigate** | The inventory detail page loads without errors |
| **Add entries** | Multiple entries can be added, each in a separate test |
| **Count** | The final row count matches the number of added entries |
| **Cleanup** | The inventory is deleted after the suite, leaving zero residue |

---

## Property types covered

All 12 supported property types are included in the test inventory (`E2E_AllPropertyTypes`):

| Type | Description |
|---|---|
| `STRING` | Free-text value |
| `INT` | 32-bit integer |
| `LONG` | 64-bit integer |
| `DECIMAL` | Floating-point number |
| `BOOLEAN` | True / false |
| `DATE` | Calendar date (ISO 8601) |
| `DATE_TIME` | Date + time without timezone |
| `DATE_TIME_OFFSET` | Date + time with UTC offset |
| `TIME` | Time of day |
| `GUID` | UUID / globally unique identifier |
| `FILE` | File attachment |
| `TIME_SERIES` | Time-series data reference |

> Relations are intentionally excluded from this suite. They will be covered separately once the base inventory CRUD suite is stable.

---

## Test structure

```
tests/DataManager/
├── InventoryPage.ts      ← Page Object Model (create, delete, open, addEntry)
├── inventory.spec.ts     ← Serial test suite (8 ordered tests)
└── README.md             ← This file
```

### `InventoryPage.ts`

The Page Object encapsulates all UI interactions with the Data Manager:

- `InventoryPage.create(page)` — navigates to the inventories section and waits for the sidebar to load
- `createInventory(def)` — fills the "Inventory erstellen" dialog with name, description, and all property rows
- `addEntry(values)` — opens the entry creation dialog and fills the specified fields
- `deleteInventoryIfExists(name)` — idempotent cleanup via the sidebar context menu (⋮ → Löschen)
- `openInventory(name)` — clicks the inventory in the sidebar and waits for the detail view

### `inventory.spec.ts`

Uses **`test.describe.serial()`** so all 8 tests run sequentially in a single worker — later tests depend on state created by earlier ones.

```
01 — Pre-condition: clean slate (delete stale data if any)
02 — Create inventory with all 12 property types ← deps above
03 — Detail page loads without error             ← deps 02
04 — Add Entry A (baseline values)               ← deps 03
05 — Add Entry B (edge-case string)              ← deps 03
06 — Add Entry C (large numbers)                 ← deps 03
07 — Row count matches entries added             ← deps 04–06
08 — Inventory still exists (afterAll guard)
     └─ afterAll: delete the inventory (always runs)
```

---

## Running the tests

```bash
# Run only the Inventory CRUD suite
npm run test:functional

# Run in headed mode to watch the browser
npm run test:functional -- --headed

# Run with the Playwright UI
npm run test:ui
```

The `Inventory` project is configured in `playwright.config.ts` with:
- `fullyParallel: false` — tests run in order
- `retries: 0` — no retries (retrying "create" would create duplicate inventories)
- `workers: 1` — single browser context throughout the suite
- `actionTimeout: 60_000` — extra time for CRUD operations

---

## Cleanup guarantee

The `afterAll` hook **always** runs — even if individual tests fail mid-suite. It re-navigates to the inventory list and calls `deleteInventoryIfExists`, ensuring no `E2E_AllPropertyTypes` inventory is left behind regardless of how many tests passed or failed.

If cleanup itself fails, a warning is logged with the inventory name so it can be found and deleted manually.

---

## Adding more test entries

To add more entries, extend the `ENTRIES` array in `inventory.spec.ts`. Each entry generates its own `test()` block automatically:

```ts
const ENTRIES = [
  {
    label: 'Entry A — baseline values',
    values: { prop_string: 'Alpha', prop_int: '1', ... },
  },
  // Add more entries here ↓
];
```
