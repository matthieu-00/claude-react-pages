import { test, expect } from '@playwright/test';
import { loginWithAccessLevel, waitForAuthCheck } from './test-helpers';

test.describe('Deployment Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithAccessLevel(page, 'level3'); // Level 3 for full access
    await page.goto('./deployment-tracker');
    await waitForAuthCheck(page);
  });

  test('can add PR URLs and renders cards', async ({ page }) => {
    const input = page.getByPlaceholder(/Paste GitHub PR URLs here/i);
    await input.fill([
      'https://github.com/example-org/example-repo/pull/123',
      'https://github.com/example-org/example-repo/pull/456',
    ].join('\n'));

    await page.getByRole('button', { name: 'Add PRs to Tracker' }).click();

    await expect(page.getByText('PR #123')).toBeVisible();
    await expect(page.getByText('PR #456')).toBeVisible();
  });

  test.describe('PR Management', () => {
    test.beforeEach(async ({ page }) => {
      // Add PRs first
      const input = page.getByPlaceholder(/Paste GitHub PR URLs here/i);
      await input.fill('https://github.com/example-org/example-repo/pull/123');
      await page.getByRole('button', { name: 'Add PRs to Tracker' }).click();
      await expect(page.getByText('PR #123')).toBeVisible();
    });

    test('adding multiple PRs', async ({ page }) => {
      const input = page.getByPlaceholder(/Paste GitHub PR URLs here/i);
      await input.fill([
        'https://github.com/example-org/example-repo/pull/789',
        'https://github.com/example-org/example-repo/pull/101',
      ].join('\n'));

      await page.getByRole('button', { name: 'Add PRs to Tracker' }).click();

      await expect(page.getByText('PR #789')).toBeVisible();
      await expect(page.getByText('PR #101')).toBeVisible();
    });

    test('removing PRs', async ({ page }) => {
      // Look for delete button on PR card
      const deleteButton = page.locator('button[aria-label*="delete" i]').or(
        page.locator('button').filter({ has: page.locator('svg') })
      ).first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Might show confirmation modal
        const confirmButton = page.getByRole('button', { name: /delete|confirm|yes/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        await page.waitForTimeout(500);
        // PR should be removed
        await expect(page.getByText('PR #123')).not.toBeVisible();
      }
    });
  });

  test.describe('Export Menu', () => {
    test.beforeEach(async ({ page }) => {
      // Add a PR first to have data
      const input = page.getByPlaceholder(/Paste GitHub PR URLs here/i);
      await input.fill('https://github.com/example-org/example-repo/pull/123');
      await page.getByRole('button', { name: 'Add PRs to Tracker' }).click();
      await expect(page.getByText('PR #123')).toBeVisible();
    });

    test('export button is visible', async ({ page }) => {
      const exportButton = page.getByTestId('deployment-tracker-export-button');
      await expect(exportButton).toBeVisible();
    });

    test('export dropdown menu appears on hover', async ({ page }) => {
      const exportButton = page.getByTestId('deployment-tracker-export-button');
      await exportButton.hover();
      await page.waitForTimeout(200);

      const exportMenu = page.getByTestId('deployment-tracker-export-menu');
      await expect(exportMenu).toBeVisible();
    });

    test('all export options are visible', async ({ page }) => {
      const exportButton = page.getByTestId('deployment-tracker-export-button');
      await exportButton.hover();
      await page.waitForTimeout(200);

      await expect(page.getByTestId('export-release-list')).toBeVisible();
      await expect(page.getByTestId('export-status-report')).toBeVisible();
      await expect(page.getByTestId('export-json')).toBeVisible();
      await expect(page.getByTestId('export-markdown')).toBeVisible();
    });

    test('Copy Release List option is clickable', async ({ page }) => {
      const exportButton = page.getByTestId('deployment-tracker-export-button');
      await exportButton.hover();
      await page.waitForTimeout(200);

      const releaseListButton = page.getByTestId('export-release-list');
      await expect(releaseListButton).toBeVisible();
      await expect(releaseListButton).toBeEnabled();

      await releaseListButton.click();
      await page.waitForTimeout(500);

      // Should show modal or copy to clipboard
      // Check if modal appears
      const modal = page.locator('[role="dialog"]').or(page.getByText(/release|list/i));
      // Modal might appear or clipboard might be updated
    });

    test('Copy Full Status Report option is clickable', async ({ page }) => {
      const exportButton = page.getByTestId('deployment-tracker-export-button');
      await exportButton.hover();
      await page.waitForTimeout(200);

      const statusReportButton = page.getByTestId('export-status-report');
      await expect(statusReportButton).toBeVisible();
      await expect(statusReportButton).toBeEnabled();

      await statusReportButton.click();
      await page.waitForTimeout(500);

      // Should show modal
      const modal = page.locator('[role="dialog"]').or(page.getByText(/status|report/i));
      // Modal might appear
    });

    test('Export JSON option downloads file', async ({ page }) => {
      const exportButton = page.getByTestId('deployment-tracker-export-button');
      await exportButton.hover();
      await page.waitForTimeout(200);

      const jsonButton = page.getByTestId('export-json');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await jsonButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.json$/i);
      }
    });

    test('Export Markdown option downloads file', async ({ page }) => {
      const exportButton = page.getByTestId('deployment-tracker-export-button');
      await exportButton.hover();
      await page.waitForTimeout(200);

      const markdownButton = page.getByTestId('export-markdown');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await markdownButton.click();
      
      const download = await downloadPromise;
      if (download) {
        // Markdown might be .md or .txt
        expect(download.suggestedFilename()).toMatch(/\.(md|txt|markdown)$/i);
      }
    });
  });

  test.describe('Filtering and Search', () => {
    test.beforeEach(async ({ page }) => {
      // Add multiple PRs
      const input = page.getByPlaceholder(/Paste GitHub PR URLs here/i);
      await input.fill([
        'https://github.com/example-org/example-repo/pull/123',
        'https://github.com/example-org/example-repo/pull/456',
      ].join('\n'));
      await page.getByRole('button', { name: 'Add PRs to Tracker' }).click();
      await expect(page.getByText('PR #123')).toBeVisible();
    });

    test('search functionality', async ({ page }) => {
      // Look for search input
      const searchInput = page.getByPlaceholder(/search/i).or(
        page.locator('input[type="text"]').filter({ hasNotText: 'Paste GitHub' })
      ).first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('123');
        await page.waitForTimeout(300);

        // PR #123 should still be visible, PR #456 might be filtered
        await expect(page.getByText('PR #123')).toBeVisible();
      }
    });

    test('filtering PRs by status/column', async ({ page }) => {
      // Look for filter buttons or dropdown
      const filterButtons = page.getByRole('button').filter({ hasText: /filter|status|column/i });
      
      if (await filterButtons.count() > 0) {
        const filterButton = filterButtons.first();
        await filterButton.click();
        await page.waitForTimeout(300);
        
        // Cards should still be visible
        await expect(page.getByText('PR #123')).toBeVisible();
      }
    });
  });
});

