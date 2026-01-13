import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    // Use a dedicated port for E2E to avoid conflicts with an already-running dev server.
    baseURL: 'http://localhost:5174/pst-toolings/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    colorScheme: 'light',
  },
  webServer: {
    // --force avoids "Outdated Optimize Dep" (504) flakiness during test startup.
    command: 'npm run dev -- --port 5174 --strictPort --force',
    url: 'http://localhost:5174/pst-toolings/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

