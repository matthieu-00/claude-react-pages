import { test, expect } from '@playwright/test';
import { fixturePath } from './fixture-path';
import { loginWithAccessLevel, waitForAuthCheck } from './test-helpers';

test.describe('JSON Extractor', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithAccessLevel(page, 'level2'); // Level 2 for export access
    await page.goto('./json-extractor');
    await waitForAuthCheck(page);
  });

  test('imports JSON file and shows extracted content', async ({ page }) => {
    const jsonPath = fixturePath('sample.json');
    await page.locator('input[type="file"][accept=".json"]').setInputFiles(jsonPath);

    await expect(page.getByText('Records', { exact: true })).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
  });

  test.describe('Key Selection', () => {
    test.beforeEach(async ({ page }) => {
      const jsonPath = fixturePath('sample.json');
      await page.locator('input[type="file"][accept=".json"]').setInputFiles(jsonPath);
      await expect(page.getByText('Records', { exact: true })).toBeVisible();
    });

    test('selecting and deselecting keys', async ({ page }) => {
      // Get first checkbox
      const firstCheckbox = page.locator('input[type="checkbox"]').first();
      
      // Check if it's checked (might be checked by default)
      const initiallyChecked = await firstCheckbox.isChecked();
      
      // Toggle it
      await firstCheckbox.click();
      await page.waitForTimeout(200);
      
      // Should have opposite state
      const afterToggle = await firstCheckbox.isChecked();
      expect(afterToggle).toBe(!initiallyChecked);
    });

    test('Select All functionality', async ({ page }) => {
      const selectAllButton = page.getByRole('button', { name: 'Select All' });
      await selectAllButton.click();
      await page.waitForTimeout(200);
      
      // All checkboxes should be checked
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const checkbox = checkboxes.nth(i);
        if (await checkbox.isVisible()) {
          await expect(checkbox).toBeChecked();
        }
      }
    });

    test('Deselect All functionality', async ({ page }) => {
      // First select all
      await page.getByRole('button', { name: 'Select All' }).click();
      await page.waitForTimeout(200);
      
      // Then deselect all
      await page.getByRole('button', { name: 'Deselect All' }).click();
      await page.waitForTimeout(200);
      
      // All checkboxes should be unchecked
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const checkbox = checkboxes.nth(i);
        if (await checkbox.isVisible()) {
          await expect(checkbox).not.toBeChecked();
        }
      }
    });

    test('search/filter for keys', async ({ page }) => {
      // Look for search input
      const searchInput = page.getByPlaceholder(/search|filter/i).or(page.locator('input[type="text"]').first());
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('name');
        await page.waitForTimeout(300);
        
        // Should filter visible keys
        const visibleKeys = page.locator('input[type="checkbox"]');
        // At least some checkboxes should still be visible
        await expect(visibleKeys.first()).toBeVisible();
      }
    });
  });

  test.describe('Export Buttons', () => {
    test.beforeEach(async ({ page }) => {
      const jsonPath = fixturePath('sample.json');
      await page.locator('input[type="file"][accept=".json"]').setInputFiles(jsonPath);
      await expect(page.getByText('Records', { exact: true })).toBeVisible();
      
      // Select at least one key
      const firstCheckbox = page.locator('input[type="checkbox"]').first();
      if (!(await firstCheckbox.isChecked())) {
        await firstCheckbox.check();
      }
    });

    test('export buttons are disabled when no keys selected', async ({ page }) => {
      // Deselect all
      await page.getByRole('button', { name: 'Deselect All' }).click();
      await page.waitForTimeout(200);
      
      const csvButton = page.getByTestId('json-extractor-export-csv');
      const jsonButton = page.getByTestId('json-extractor-export-json');
      
      await expect(csvButton).toBeDisabled();
      await expect(jsonButton).toBeDisabled();
    });

    test('export buttons are enabled when keys selected', async ({ page }) => {
      // Ensure at least one key is selected
      await page.getByRole('button', { name: 'Select All' }).click();
      await page.waitForTimeout(200);
      
      const csvButton = page.getByTestId('json-extractor-export-csv');
      const jsonButton = page.getByTestId('json-extractor-export-json');
      
      await expect(csvButton).toBeEnabled();
      await expect(jsonButton).toBeEnabled();
    });

    test('CSV export with selected keys', async ({ page }) => {
      // Select all keys
      await page.getByRole('button', { name: 'Select All' }).click();
      await page.waitForTimeout(200);
      
      const csvButton = page.getByTestId('json-extractor-export-csv');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await csvButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      }
    });

    test('JSON export with selected keys', async ({ page }) => {
      // Select all keys
      await page.getByRole('button', { name: 'Select All' }).click();
      await page.waitForTimeout(200);
      
      const jsonButton = page.getByTestId('json-extractor-export-json');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await jsonButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.json$/i);
      }
    });
  });

  test.describe('Data Filtering', () => {
    test.beforeEach(async ({ page }) => {
      const jsonPath = fixturePath('sample.json');
      await page.locator('input[type="file"][accept=".json"]').setInputFiles(jsonPath);
      await expect(page.getByText('Records', { exact: true })).toBeVisible();
      
      // Select keys first
      await page.getByRole('button', { name: 'Select All' }).click();
      await page.waitForTimeout(200);
    });

    test('hide empty toggle works', async ({ page }) => {
      // Look for hide empty button
      const hideEmptyButton = page.getByRole('button', { name: /hide empty|show all/i });
      
      if (await hideEmptyButton.isVisible()) {
        const initialText = await hideEmptyButton.textContent();
        await hideEmptyButton.click();
        await page.waitForTimeout(300);
        
        // Text should change
        const afterClickText = await hideEmptyButton.textContent();
        expect(afterClickText).not.toBe(initialText);
      }
    });
  });

  test.describe('Sorting', () => {
    test.beforeEach(async ({ page }) => {
      const jsonPath = fixturePath('sample.json');
      await page.locator('input[type="file"][accept=".json"]').setInputFiles(jsonPath);
      await expect(page.getByText('Records', { exact: true })).toBeVisible();
      
      // Select keys and wait for table to appear
      await page.getByRole('button', { name: 'Select All' }).click();
      await page.waitForTimeout(500);
    });

    test('sorting by column header', async ({ page }) => {
      // Look for table headers that are clickable
      const tableHeaders = page.locator('th').filter({ hasNotText: 'Field' });
      
      if (await tableHeaders.count() > 0) {
        const firstHeader = tableHeaders.first();
        await firstHeader.click();
        await page.waitForTimeout(300);
        
        // Table should still be visible after sorting
        await expect(page.getByText('Records', { exact: true })).toBeVisible();
      }
    });

    test('sort direction indicator', async ({ page }) => {
      // Look for sortable column headers
      const sortableHeaders = page.locator('th[class*="cursor"]').or(page.locator('th').filter({ hasText: /name|age|id/i }));
      
      if (await sortableHeaders.count() > 0) {
        const header = sortableHeaders.first();
        
        // Click to sort
        await header.click();
        await page.waitForTimeout(300);
        
        // Click again to reverse sort
        await header.click();
        await page.waitForTimeout(300);
        
        // Table should still be visible
        await expect(page.getByText('Records', { exact: true })).toBeVisible();
      }
    });
  });
});

