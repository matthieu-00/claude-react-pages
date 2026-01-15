import { test, expect } from '@playwright/test';
import { loginWithAccessLevel, clearAuth, waitForAuthCheck } from './test-helpers';

test.describe('Export Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test.describe('Code Renderer Export Buttons', () => {
    test('Level 1: export button is not visible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level1');
      await page.goto('./code-renderer');
      await waitForAuthCheck(page);
      
      const exportButton = page.getByTestId('code-renderer-export-button');
      await expect(exportButton).not.toBeVisible();
    });

    test('Level 2: export button is visible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./code-renderer');
      await waitForAuthCheck(page);
      
      const exportButton = page.getByTestId('code-renderer-export-button');
      await expect(exportButton).toBeVisible();
    });

    test('Level 2: export dropdown menu appears on hover', async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./code-renderer');
      await waitForAuthCheck(page);
      
      const exportButton = page.getByTestId('code-renderer-export-button');
      await exportButton.hover();
      
      const exportMenu = page.getByTestId('code-renderer-export-menu');
      await expect(exportMenu).toBeVisible();
      
      // Check all export options exist
      await expect(page.getByTestId('export-html')).toBeVisible();
      await expect(page.getByTestId('export-code')).toBeVisible();
      await expect(page.getByTestId('share-url')).toBeVisible();
    });

    test('Level 3: export button is visible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level3');
      await page.goto('./code-renderer');
      await waitForAuthCheck(page);
      
      const exportButton = page.getByTestId('code-renderer-export-button');
      await expect(exportButton).toBeVisible();
    });
  });

  test.describe('Spreadsheet Diff Export Buttons', () => {
    test('Level 1: export buttons are not visible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level1');
      await page.goto('./spreadsheet-diff');
      await waitForAuthCheck(page);
      
      await expect(page.getByTestId('export-csv')).not.toBeVisible();
      await expect(page.getByTestId('export-excel')).not.toBeVisible();
      await expect(page.getByTestId('export-summary')).not.toBeVisible();
    });

    test('Level 2: all export buttons are visible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./spreadsheet-diff');
      await waitForAuthCheck(page);
      
      await expect(page.getByTestId('export-csv')).toBeVisible();
      await expect(page.getByTestId('export-excel')).toBeVisible();
      await expect(page.getByTestId('export-summary')).toBeVisible();
    });

    test('Level 2: export buttons are clickable', async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./spreadsheet-diff');
      await waitForAuthCheck(page);
      
      // Upload files first to enable exports
      const { fixturePath } = await import('./fixture-path');
      const a = fixturePath('spreadsheet-a.csv');
      const b = fixturePath('spreadsheet-b.csv');
      
      await page.getByTestId('spreadsheet1-file').setInputFiles(a);
      await page.getByTestId('spreadsheet2-file').setInputFiles(b);
      
      // Wait for files to process
      await expect(page.getByText('Total Differences:')).toBeVisible();
      
      // Buttons should be clickable (not disabled)
      const csvButton = page.getByTestId('export-csv');
      const excelButton = page.getByTestId('export-excel');
      const summaryButton = page.getByTestId('export-summary');
      
      await expect(csvButton).toBeEnabled();
      await expect(excelButton).toBeEnabled();
      await expect(summaryButton).toBeEnabled();
    });

    test('Level 3: all export buttons are visible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level3');
      await page.goto('./spreadsheet-diff');
      await waitForAuthCheck(page);
      
      await expect(page.getByTestId('export-csv')).toBeVisible();
      await expect(page.getByTestId('export-excel')).toBeVisible();
      await expect(page.getByTestId('export-summary')).toBeVisible();
    });
  });

  test.describe('JSON Extractor Export Buttons', () => {
    test('Level 1: export buttons are not visible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level1');
      await page.goto('./json-extractor');
      await waitForAuthCheck(page);
      
      await expect(page.getByTestId('json-extractor-export-csv')).not.toBeVisible();
      await expect(page.getByTestId('json-extractor-export-json')).not.toBeVisible();
    });

    test('Level 2: export buttons are visible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./json-extractor');
      await waitForAuthCheck(page);
      
      await expect(page.getByTestId('json-extractor-export-csv')).toBeVisible();
      await expect(page.getByTestId('json-extractor-export-json')).toBeVisible();
    });

    test('Level 2: export buttons are disabled when no keys selected', async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./json-extractor');
      await waitForAuthCheck(page);
      
      const csvButton = page.getByTestId('json-extractor-export-csv');
      const jsonButton = page.getByTestId('json-extractor-export-json');
      
      await expect(csvButton).toBeDisabled();
      await expect(jsonButton).toBeDisabled();
    });

    test('Level 2: export buttons are enabled when keys selected', async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./json-extractor');
      await waitForAuthCheck(page);
      
      // Upload JSON file
      const { fixturePath } = await import('./fixture-path');
      const jsonPath = fixturePath('sample.json');
      await page.locator('input[type="file"][accept=".json"]').setInputFiles(jsonPath);
      
      // Wait for data to load
      await expect(page.getByText('Records', { exact: true })).toBeVisible();
      
      // Select a key
      const firstKey = page.locator('input[type="checkbox"]').first();
      await firstKey.check();
      
      // Export buttons should be enabled
      const csvButton = page.getByTestId('json-extractor-export-csv');
      const jsonButton = page.getByTestId('json-extractor-export-json');
      
      await expect(csvButton).toBeEnabled();
      await expect(jsonButton).toBeEnabled();
    });

    test('Level 3: export buttons are visible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level3');
      await page.goto('./json-extractor');
      await waitForAuthCheck(page);
      
      await expect(page.getByTestId('json-extractor-export-csv')).toBeVisible();
      await expect(page.getByTestId('json-extractor-export-json')).toBeVisible();
    });
  });

  test.describe('Deployment Tracker Export Menu', () => {
    test('Level 1: page is not accessible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level1');
      await page.goto('./deployment-tracker');
      await waitForAuthCheck(page);
      
      // Should see access denied
      await expect(page.getByTestId('access-denied')).toBeVisible();
      
      // Export button should not be visible
      await expect(page.getByTestId('deployment-tracker-export-button')).not.toBeVisible();
    });

    test('Level 2: page is not accessible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./deployment-tracker');
      await waitForAuthCheck(page);
      
      // Should see access denied
      await expect(page.getByTestId('access-denied')).toBeVisible();
      
      // Export button should not be visible
      await expect(page.getByTestId('deployment-tracker-export-button')).not.toBeVisible();
    });

    test('Level 3: export button is visible', async ({ page }) => {
      await loginWithAccessLevel(page, 'level3');
      await page.goto('./deployment-tracker');
      await waitForAuthCheck(page);
      
      const exportButton = page.getByTestId('deployment-tracker-export-button');
      await expect(exportButton).toBeVisible();
    });

    test('Level 3: export dropdown menu appears on hover', async ({ page }) => {
      await loginWithAccessLevel(page, 'level3');
      await page.goto('./deployment-tracker');
      await waitForAuthCheck(page);
      
      const exportButton = page.getByTestId('deployment-tracker-export-button');
      await exportButton.hover();
      
      const exportMenu = page.getByTestId('deployment-tracker-export-menu');
      await expect(exportMenu).toBeVisible();
      
      // Check all export options exist
      await expect(page.getByTestId('export-release-list')).toBeVisible();
      await expect(page.getByTestId('export-status-report')).toBeVisible();
      await expect(page.getByTestId('export-json')).toBeVisible();
      await expect(page.getByTestId('export-markdown')).toBeVisible();
    });

    test('Level 3: export menu options are clickable', async ({ page }) => {
      await loginWithAccessLevel(page, 'level3');
      await page.goto('./deployment-tracker');
      await waitForAuthCheck(page);
      
      // Add a PR first to have data
      const input = page.getByPlaceholder(/Paste GitHub PR URLs here/i);
      await input.fill('https://github.com/example-org/example-repo/pull/123');
      await page.getByRole('button', { name: 'Add PRs to Tracker' }).click();
      
      // Wait for PR card to appear
      await expect(page.getByText('PR #123')).toBeVisible();
      
      // Hover over export button
      const exportButton = page.getByTestId('deployment-tracker-export-button');
      await exportButton.hover();
      
      // All menu items should be visible and clickable
      const releaseList = page.getByTestId('export-release-list');
      const statusReport = page.getByTestId('export-status-report');
      const exportJson = page.getByTestId('export-json');
      const exportMarkdown = page.getByTestId('export-markdown');
      
      await expect(releaseList).toBeVisible();
      await expect(statusReport).toBeVisible();
      await expect(exportJson).toBeVisible();
      await expect(exportMarkdown).toBeVisible();
      
      // They should be clickable (not disabled)
      await expect(releaseList).toBeEnabled();
      await expect(statusReport).toBeEnabled();
      await expect(exportJson).toBeEnabled();
      await expect(exportMarkdown).toBeEnabled();
    });
  });
});
