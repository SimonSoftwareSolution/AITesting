/**
 * Minimal config for running smoke tests standalone — no auth setup dependency.
 * Usage: npx playwright test --config playwright.smoke-only.config.ts
 */
import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
  testDir: './tests/LandingPage',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report-smoke' }], ['list']],
  timeout: 90_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: 'https://dev.questra.s2o.dev/portal',
    trace: 'off',
    screenshot: 'on',
    video: 'off',
  },
  projects: [
    {
      name: 'smoke',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
