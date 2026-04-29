import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config()

// Ensure the .auth directory exists. The session file itself is written by the
// 'setup' project — we never seed an empty placeholder here so authenticated
// tests always read the real session written by setup (guaranteed by dependencies).
const authFile = '.auth/session.json'
fs.mkdirSync('.auth', { recursive: true })

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 7,

  reporter: [['html'], ['list']],

  timeout: 120_000,
  expect: { timeout: 30_000 },

  use: {
    baseURL: 'https://dev.questra.s2o.dev/portal',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // --- Auth setup (runs first, saves real session to .auth/session.json) ---
    // Smart: reuses an existing valid session and skips login when possible.
    {
      name: 'setup',
      testMatch: /Login\/auth\.setup\.ts/,
    },

    // --- Smoke tests: public pages, NO auth required ---
    // Storage state is explicitly cleared inside the spec. We still depend on
    // setup so smoke doesn't race against the login flow hitting the same server.
    {
      name: 'smoke',
      testMatch: /LandingPage\/landingPage\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    // --- Inventory Create Dialog tests ---
    {
      name: 'InventoryCreateDialogTests',
      testMatch: /InventoryCreateDialog\/.*\.spec\.ts/,
      fullyParallel: false,
      retries: 0,
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
        actionTimeout: 60_000,
      },
      dependencies: ['setup'],
    },

    // --- Inventory Page tests ---
    // Depends on the create dialog tests finishing so the inventory exists.
    {
      name: 'InventoryPageTests',
      testMatch: /Inventory\/.*\.spec\.ts/,
      fullyParallel: false,
      retries: 0,
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
        actionTimeout: 60_000,
      },
      dependencies: ['setup', 'InventoryCreateDialogTests'],
    },

    // --- Authenticated tests ---
    {
      name: 'authenticated',
      testIgnore: [
        /LandingPage\/landingPage\.spec\.ts/,
        /Login\/auth\.setup\.ts/,
        /InventoryCreateDialog\/.*\.spec\.ts/,
        /Inventory\/.*\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
  ],
});
