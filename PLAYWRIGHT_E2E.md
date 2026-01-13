# Playwright E2E (Local)

This repo includes Playwright end-to-end tests that run against the local Vite dev server.

## What’s included

- **Config**: `playwright.config.ts`
- **Tests**: `e2e/*.spec.ts`
- **Fixtures**: `e2e/fixtures/*` (small dummy CSV/JSON files used for upload tests)
- **Artifacts (gitignored)**:
  - `playwright-report/` (HTML report)
  - `test-results/` (traces, screenshots, videos on failures)

## Key detail: base path

This app uses a router basename of `/pst-toolings`, so locally the app is served at:

- `http://localhost:5174/pst-toolings/`

The Playwright `baseURL` and `webServer.url` are configured accordingly.

## Running the tests

Install dependencies (once):

```bash
npm install
npx playwright install
```

Run all E2E tests (headless):

```bash
npm run test:e2e
```

Run with the Playwright UI runner:

```bash
npm run test:e2e:ui
```

## How the dev server is started

`playwright.config.ts` is configured with `webServer` to run:

- `npm run dev -- --port 5174 --force`

If you already have that server running, Playwright will reuse it (`reuseExistingServer: true`).

## Adding new functional tests

- Prefer stable locators:
  - `getByRole(...)` and visible text when possible
  - `data-testid` only when needed (e.g. hidden file inputs)
- If you add a test that needs uploads, add a small dummy file under `e2e/fixtures/`.

## What each test covers

- `e2e/smoke.spec.ts`: home load + navigation to all pages
- `e2e/theme.spec.ts`: theme toggle + localStorage persistence
- `e2e/code-renderer.spec.ts`: render HTML and assert iframe content
- `e2e/spreadsheet-diff.spec.ts`: upload two CSVs and assert diff count
- `e2e/json-extractor.spec.ts`: upload JSON and assert extracted content shows
- `e2e/deployment-tracker.spec.ts`: paste PR URLs and assert cards appear

## Troubleshooting

- **404 / blank page**: make sure you’re using `/pst-toolings/` locally (not `/`).
- **Port already in use**: stop the existing process or change the port in `playwright.config.ts`.
- **Flaky selectors**: add a minimal `data-testid` to the specific element (prefer not to overuse).

