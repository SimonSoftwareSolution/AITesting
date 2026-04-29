# AI Testing - Project Standards and Patterns

## Playwright Page Object Model (POM) Pattern

We use a strict Page Object Model pattern for our Playwright tests. When generating or refactoring tests, please adhere to the following rules:

### 1. Fluent Interface (Method Chaining)
**All page action functions MUST return the Page Object the application is currently on after the action is executed.** 
This enables a fluent, chainable API for writing tests.

- If an action keeps the user on the same page or dialog (e.g., filling out a form, clicking a tab), return `this` (the current Page Object).
- If an action navigates the user to a new page or opens a new dialog, return a new instance of that corresponding Page Object.

**Good Usage Example:**
```typescript
// `createNewInventory` returns `InventoryCreateDialog`
const dialog = await inventoryPage.createNewInventory();

// `fillInventoryDetails` returns `this` (the dialog) so we can chain `submit`
// `submit` returns the `InventoryPage` we land on afterwards
const inventoryPageAfterSubmit = await dialog
    .fillInventoryDetails(INVENTORY_DEF)
    .then(d => d.submit()); 

// Alternatively, with cleaner async/await syntax:
// await dialog.fillInventoryDetails(INVENTORY_DEF);
// const nextState = await dialog.submit();

await expect(inventoryPageAfterSubmit.getInventorySidebarItem(SHARED_INVENTORY_NAME)).toBeVisible({ timeout: 30_000 });
```

### 2. Implementation Example
To support the fluent pattern, ensure your return types are correctly defined as Promises of the Page Object. Return `this` for actions that don't trigger navigation.

```typescript
export class InventoryCreateDialog {
  // ... constructor and locators ...

  // Stays on the same dialog, so it returns `this`
  async fillInventoryDetails(def: InventoryDefinition): Promise<this> {
    await this.dialog.getByPlaceholder('z.B. InventoryName').fill(def.name);
    // ... (fill other details)
    
    // Always return `this` at the end of actions that stay on the current page
    return this; 
  }

  // Closes the dialog and goes back to the Inventory Page, so it returns `InventoryPage`
  async submit(): Promise<InventoryPage> {
    await this.dialog.getByRole('button', { name: 'Inventory erstellen', exact: true }).click();
    await this.dialog.waitFor({ state: 'hidden', timeout: 30_000 });
    
    // Return the new page state
    return await InventoryPage.create(this.page);
  }
}
```

### 3. Summary
- **Why?** It makes tests incredibly clean, readable, and strongly typed. You always know exactly what page you are on after an action.
- **Rule of Thumb:** Never return `Promise<void>` from a page action method unless it strictly makes sense to do so. Always ask: "What page am I looking at after this action finishes?" and return that page object.
