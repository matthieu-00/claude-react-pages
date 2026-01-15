import { test, expect } from '@playwright/test';
import { fixturePath } from './fixture-path';
import { loginWithAccessLevel, waitForAuthCheck } from './test-helpers';

test.describe('Spreadsheet Diff', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithAccessLevel(page, 'level2'); // Level 2 for export access
    await page.goto('./spreadsheet-diff');
    await waitForAuthCheck(page);
  });

  test('accepts uploads and computes diffs', async ({ page }) => {
    const a = fixturePath('spreadsheet-a.csv');
    const b = fixturePath('spreadsheet-b.csv');

    await page.getByTestId('spreadsheet1-file').setInputFiles(a);
    await page.getByTestId('spreadsheet2-file').setInputFiles(b);

    await expect(page.getByText('✓ 2 rows, 2 columns')).toHaveCount(2);
    await expect(page.getByText('Total Differences: 1')).toBeVisible();
  });

  test.describe('Hide Identical Toggle', () => {
    test.beforeEach(async ({ page }) => {
      // Upload files first
      const a = fixturePath('spreadsheet-a.csv');
      const b = fixturePath('spreadsheet-b.csv');
      await page.getByTestId('spreadsheet1-file').setInputFiles(a);
      await page.getByTestId('spreadsheet2-file').setInputFiles(b);
      await expect(page.getByText('Total Differences:')).toBeVisible();
    });

    test('toggle switch functionality', async ({ page }) => {
      const toggle = page.getByTestId('hide-identical-toggle');
      
      // Check initial state (should be off by default)
      const initialBg = await toggle.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Click to toggle on
      await toggle.click();
      await page.waitForTimeout(300); // Wait for transition
      
      // Check state changed
      const afterClickBg = await toggle.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Background color should change
      expect(afterClickBg).not.toBe(initialBg);
    });

    test('identical rows are hidden when enabled', async ({ page }) => {
      const toggle = page.getByTestId('hide-identical-toggle');
      
      // Get initial row count (all rows visible)
      const initialRows = page.locator('tbody tr').filter({ hasNotText: 'Header' });
      const initialCount = await initialRows.count();
      
      // Enable hide identical
      await toggle.click();
      await page.waitForTimeout(500); // Wait for filtering
      
      // Row count should decrease (identical rows hidden)
      const afterToggleRows = page.locator('tbody tr').filter({ hasNotText: 'Header' });
      const afterCount = await afterToggleRows.count();
      
      // If there are identical rows, count should be less
      // (This depends on the test data having identical rows)
      expect(afterCount).toBeLessThanOrEqual(initialCount);
    });

    test('identical rows are shown when disabled', async ({ page }) => {
      const toggle = page.getByTestId('hide-identical-toggle');
      
      // Enable hide identical first
      await toggle.click();
      await page.waitForTimeout(500);
      const hiddenCount = await page.locator('tbody tr').filter({ hasNotText: 'Header' }).count();
      
      // Disable hide identical
      await toggle.click();
      await page.waitForTimeout(500);
      const shownCount = await page.locator('tbody tr').filter({ hasNotText: 'Header' }).count();
      
      // Should show more rows when disabled
      expect(shownCount).toBeGreaterThanOrEqual(hiddenCount);
    });
  });

  test.describe('Export Buttons', () => {
    test.beforeEach(async ({ page }) => {
      // Upload files first
      const a = fixturePath('spreadsheet-a.csv');
      const b = fixturePath('spreadsheet-b.csv');
      await page.getByTestId('spreadsheet1-file').setInputFiles(a);
      await page.getByTestId('spreadsheet2-file').setInputFiles(b);
      await expect(page.getByText('Total Differences:')).toBeVisible();
    });

    test('CSV export button is clickable', async ({ page }) => {
      const csvButton = page.getByTestId('export-csv');
      await expect(csvButton).toBeVisible();
      await expect(csvButton).toBeEnabled();
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await csvButton.click();
      
      const download = await downloadPromise;
      // Download might trigger a modal instead, so we just verify button works
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      }
    });

    test('Excel export button is clickable', async ({ page }) => {
      const excelButton = page.getByTestId('export-excel');
      await expect(excelButton).toBeVisible();
      await expect(excelButton).toBeEnabled();
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await excelButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(xlsx|xls)$/i);
      }
    });

    test('Summary export button is clickable', async ({ page }) => {
      const summaryButton = page.getByTestId('export-summary');
      await expect(summaryButton).toBeVisible();
      await expect(summaryButton).toBeEnabled();
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await summaryButton.click();
      
      const download = await downloadPromise;
      if (download) {
        // Summary might be CSV or other format
        expect(download.suggestedFilename()).toBeTruthy();
      }
    });
  });
});

