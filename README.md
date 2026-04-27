# Questra E2E Tests

Playwright end-to-end test suite for the [Questra Portal](https://dev.questra.s2o.dev/portal).

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Set up credentials
cp .env.example .env
# Open .env and fill in QUESTRA_USERNAME and QUESTRA_PASSWORD
```

## Running Tests

```bash
# Run all tests (headless)
npm test

# Run with interactive UI
npm run test:ui

# Run in headed mode (see the browser)
npm run test:headed

# Debug a specific test
npm run test:debug

# Record a new test interactively
npm run codegen

# Open last HTML report
npm run report
```

## Project Structure

```
AITesting/
├── tests/
│   ├── auth.setup.ts      # Logs in and saves session to .auth/session.json
│   ├── smoke.spec.ts      # Public landing page tests (no auth)
│   └── portal.spec.ts     # Authenticated portal tests
├── .auth/                 # Git-ignored — stores cached session
├── .env.example           # Credential template
├── playwright.config.ts   # Playwright configuration
└── package.json
```

## Auth Flow

The project uses Playwright's [storage state](https://playwright.dev/docs/auth) pattern:

1. `auth.setup.ts` runs **once** — it logs in via Authentik and saves cookies/tokens to `.auth/session.json`
2. All other test files reuse the saved session — no repeated logins

## Notes

- The app is in **German** — selectors use German text (`Anmelden`, `Willkommen`, etc.)
- Authentication is via **Authentik OIDC** at `authentik.dev.questra.s2o.dev`
- Never commit `.env` or `.auth/session.json` — both are git-ignored
