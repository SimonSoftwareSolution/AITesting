import { test, expect } from '@playwright/test'
import { Page } from '@playwright/test'

const BASE = 'https://dev.questra.s2o.dev/portal'

async function ensureAuthenticated(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
  const sidebar = page.locator('[data-test-locator^="sidebar-item"]').first()
  const anmelden = page.getByRole('button', { name: /^Anmelden$/i }).first()

  try {
    await Promise.race([
      sidebar.waitFor({ state: 'visible', timeout: 60000 }),
      anmelden.waitFor({ state: 'visible', timeout: 60000 })
    ])
  } catch { }

  if (await anmelden.isVisible()) {
    await anmelden.click()
    await sidebar.waitFor({ state: 'visible', timeout: 60000 })
  }
}

test.describe('Dashboard', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, BASE)
  })

  test('shows personalised welcome heading', async ({ page }) => {
    await expect(page.getByText(/willkommen zurück/i)).toBeVisible()
  })

  test('shows all three feature cards (Inventories, Access, Automation)', async ({ page }) => {
    await expect(page.getByText('Inventories')).toBeVisible()
    await expect(page.getByText('Access')).toBeVisible()
    await expect(page.getByText('Automation')).toBeVisible()
  })

  test('has a "Dokumentation" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /dokumentation/i })).toBeVisible()
  })

  test('has an "Erstes Widget hinzufügen" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /erstes widget hinzufügen/i })).toBeVisible()
  })

  test('displays current version badge', async ({ page }) => {
    await expect(page.getByText(/\d+\.\d+\.\d+/)).toBeVisible()
  })

  test('does not show the public "Anmelden" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^anmelden$/i })).not.toBeVisible()
  })
})

test.describe('Access Manager — Users', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, `${BASE}/access-manager/users`)
  })

  test('navigates to users page', async ({ page }) => {
    await expect(page).toHaveURL(/\/access-manager\/users/)
  })

  test('shows a users table or list', async ({ page }) => {
    const table = page.locator('table, [role="grid"], [class*="DataGrid"], [class*="Table"]').first()
    await expect(table).toBeVisible({ timeout: 10_000 })
  })

  test('has a search/filter input', async ({ page }) => {
    const search = page.locator('input[type="search"], input[placeholder*="such"], input[placeholder*="Search"]').first()
    await expect(search).toBeVisible()
  })

  test('has a "Benutzer hinzufügen" add-user link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /benutzer hinzufügen/i })).toBeVisible()
  })
})

test.describe('Access Manager — Sub-pages', () => {
  const subPages = [
    { label: 'Benutzergruppen', path: 'groups' },
    { label: 'Berechtigungen', path: 'permissions' },
    { label: 'API-Keys', path: 'api-keys' },
  ]

  for (const { label, path } of subPages) {
    test(`${label} page loads`, async ({ page }) => {
      await ensureAuthenticated(page, `${BASE}/access-manager/${path}`)
      await expect(page).toHaveURL(new RegExp(`/access-manager/${path}`))
      await expect(page.locator('body')).not.toContainText('Internal Server Error')
    })
  }
})

test.describe('Data Manager — Inventories', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, `${BASE}/data-manager/inventories`)
  })

  test('navigates to inventories page', async ({ page }) => {
    await expect(page).toHaveURL(/\/data-manager\/inventories/)
  })

  test('shows at least one inventory in the list', async ({ page }) => {
    const items = page.locator('[class*="inventory"], [class*="card"], tbody tr, [role="row"]')
    await expect(items.first()).toBeVisible({ timeout: 10_000 })
  })

  test('has an "Inventory hinzufügen" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /inventory hinzufügen|hinzufügen/i })).toBeVisible()
  })

  test('has a search bar', async ({ page }) => {
    const search = page.locator('input[type="search"], input[type="text"], input[placeholder]').first()
    await expect(search).toBeVisible()
  })
})

test.describe('Automation Manager — Automations', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, `${BASE}/automation-manager/automations`)
  })

  test('navigates to automations page', async ({ page }) => {
    await expect(page).toHaveURL(/\/automation-manager\/automations/)
  })

  test('page loads without error', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('shows automation workspaces or scripts', async ({ page }) => {
    const content = page.locator('[class*="automation"], [class*="workspace"], tbody tr, [role="row"]')
    await expect(content.first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Automation Manager — Sub-pages', () => {
  const subPages = [
    { label: 'History', path: 'history' },
    { label: 'Tasks', path: 'tasks' },
    { label: 'Schedules', path: 'schedules' },
    { label: 'Connections', path: 'connections' },
  ]

  for (const { label, path } of subPages) {
    test(`${label} page loads`, async ({ page }) => {
      await ensureAuthenticated(page, `${BASE}/automation-manager/${path}`)
      await expect(page).toHaveURL(new RegExp(`/automation-manager/${path}`))
      await expect(page.locator('body')).not.toContainText('Internal Server Error')
    })
  }
})
