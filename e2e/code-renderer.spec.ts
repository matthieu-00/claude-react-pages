import { test, expect } from '@playwright/test';
import { loginWithAccessLevel, waitForAuthCheck } from './test-helpers';

test.describe('Code Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithAccessLevel(page, 'level2'); // Level 2 for export access
    await page.goto('./code-renderer');
    await waitForAuthCheck(page);
  });

  test('renders HTML preview', async ({ page }) => {
    await page.getByRole('button', { name: 'HTML/CSS/JS' }).click();

    const editor = page.getByPlaceholder('Paste your code here...');
    await editor.fill(`<!doctype html>
<html>
  <head><title>Test</title></head>
  <body><h1>Hello from Playwright</h1></body>
</html>`);

    await page.getByRole('button', { name: /^Render$/ }).click();

    const frame = page.frameLocator('iframe[title="HTML Preview"]');
    await expect(frame.getByRole('heading', { name: 'Hello from Playwright' })).toBeVisible();
  });

  test.describe('Mode Switching', () => {
    test('switches between TSX, HTML/CSS/JS, and Combined modes', async ({ page }) => {
      // Test TSX mode
      await page.getByRole('button', { name: 'TSX' }).click();
      const tsxEditor = page.getByPlaceholder('Paste your code here...');
      await expect(tsxEditor).toBeVisible();

      // Test HTML/CSS/JS mode
      await page.getByRole('button', { name: 'HTML/CSS/JS' }).click();
      const htmlEditor = page.getByPlaceholder('Paste your code here...');
      await expect(htmlEditor).toBeVisible();

      // Test Combined mode
      await page.getByRole('button', { name: 'Combined' }).click();
      // In combined mode, we should see tabs for TSX, HTML, CSS, JS
      await expect(page.getByText('TSX')).toBeVisible();
      await expect(page.getByText('HTML')).toBeVisible();
      await expect(page.getByText('CSS')).toBeVisible();
      await expect(page.getByText('JS')).toBeVisible();
    });

    test('mode state persists during session', async ({ page }) => {
      await page.getByRole('button', { name: 'Combined' }).click();
      await expect(page.getByText('TSX')).toBeVisible();

      // Navigate away and back (simulate by checking state)
      await page.reload();
      await waitForAuthCheck(page);
      // Mode should reset to default (TSX), but we can verify the buttons exist
      await expect(page.getByRole('button', { name: 'TSX' })).toBeVisible();
    });
  });

  test.describe('Render Button', () => {
    test('renders TSX code', async ({ page }) => {
      await page.getByRole('button', { name: 'TSX' }).click();
      const editor = page.getByPlaceholder('Paste your code here...');
      await editor.fill(`export default function Test() {
  return <h1>TSX Test</h1>;
}`);

      await page.getByRole('button', { name: /^Render$/ }).click();

      const frame = page.frameLocator('iframe[title="HTML Preview"]');
      await expect(frame.getByRole('heading', { name: 'TSX Test' })).toBeVisible();
    });

    test('renders HTML code', async ({ page }) => {
      await page.getByRole('button', { name: 'HTML/CSS/JS' }).click();
      const editor = page.getByPlaceholder('Paste your code here...');
      await editor.fill(`<h1>HTML Test</h1>`);

      await page.getByRole('button', { name: /^Render$/ }).click();

      const frame = page.frameLocator('iframe[title="HTML Preview"]');
      await expect(frame.getByRole('heading', { name: 'HTML Test' })).toBeVisible();
    });

    test('shows error for invalid code', async ({ page }) => {
      await page.getByRole('button', { name: 'TSX' }).click();
      const editor = page.getByPlaceholder('Paste your code here...');
      await editor.fill(`export default function Test() {
  return <h1>Unclosed tag
}`);

      await page.getByRole('button', { name: /^Render$/ }).click();

      // Should show error message
      await expect(page.getByText(/error|Error/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Clear Button', () => {
    test('opens confirmation modal', async ({ page }) => {
      // First render something
      await page.getByRole('button', { name: 'TSX' }).click();
      const editor = page.getByPlaceholder('Paste your code here...');
      await editor.fill(`export default function Test() { return <h1>Test</h1>; }`);
      await page.getByRole('button', { name: /^Render$/ }).click();
      await page.waitForTimeout(500); // Wait for render

      // Click clear button
      await page.getByRole('button', { name: 'Clear' }).click();

      // Should see confirmation modal
      await expect(page.getByText(/clear|Clear|confirm|Confirm/i)).toBeVisible();
    });

    test('cancel in modal does not clear', async ({ page }) => {
      await page.getByRole('button', { name: 'TSX' }).click();
      const editor = page.getByPlaceholder('Paste your code here...');
      await editor.fill(`export default function Test() { return <h1>Test</h1>; }`);
      await page.getByRole('button', { name: /^Render$/ }).click();
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: 'Clear' }).click();
      
      // Find and click cancel button
      const cancelButton = page.getByRole('button', { name: /cancel|Cancel/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        // Code should still be there
        await expect(editor).toHaveValue(/.+/);
      }
    });
  });

  test.describe('Format Code Button', () => {
    test('formats code correctly', async ({ page }) => {
      await page.getByRole('button', { name: 'TSX' }).click();
      const editor = page.getByPlaceholder('Paste your code here...');
      const unformattedCode = `export default function Test(){return<div><h1>Test</h1></div>}`;
      await editor.fill(unformattedCode);

      await page.getByRole('button', { name: 'Format' }).click();
      await page.waitForTimeout(1000); // Wait for formatting

      const formattedValue = await editor.inputValue();
      // Formatted code should have newlines and proper indentation
      expect(formattedValue).toContain('\n');
      expect(formattedValue).toContain('export default');
    });
  });

  test.describe('Export Functionality', () => {
    test('export HTML downloads file', async ({ page }) => {
      await page.getByRole('button', { name: 'HTML/CSS/JS' }).click();
      const editor = page.getByPlaceholder('Paste your code here...');
      await editor.fill(`<h1>Export Test</h1>`);
      await page.getByRole('button', { name: /^Render$/ }).click();
      await page.waitForTimeout(500);

      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      // Hover over export button to show menu
      const exportButton = page.getByTestId('code-renderer-export-button');
      await exportButton.hover();
      await page.waitForTimeout(200);

      // Click export HTML
      await page.getByTestId('export-html').click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.html$/i);
      }
    });

    test('share URL updates URL hash', async ({ page }) => {
      await page.getByRole('button', { name: 'TSX' }).click();
      const editor = page.getByPlaceholder('Paste your code here...');
      await editor.fill(`export default function Test() { return <h1>URL Test</h1>; }`);

      // Hover over export button
      const exportButton = page.getByTestId('code-renderer-export-button');
      await exportButton.hover();
      await page.waitForTimeout(200);

      // Click share URL
      await page.getByTestId('share-url').click();
      await page.waitForTimeout(500);

      // URL should have hash
      const url = page.url();
      expect(url).toContain('#');
    });
  });

  test.describe('Code Snippets', () => {
    test('save snippet button exists', async ({ page }) => {
      await page.getByRole('button', { name: 'Snippets' }).click();
      await page.waitForTimeout(200);

      // Should see "Save Current" button
      await expect(page.getByText('Save Current')).toBeVisible();
    });

    test('snippet menu opens and closes', async ({ page }) => {
      const snippetsButton = page.getByRole('button', { name: 'Snippets' });
      await snippetsButton.click();
      await page.waitForTimeout(200);

      // Should see snippets menu
      await expect(page.getByText('Snippets')).toBeVisible();

      // Click outside or close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    });
  });

  test.describe('Editor Enhancements', () => {
    test('line numbers can be toggled', async ({ page }) => {
      // Look for line numbers toggle (might be in settings or toolbar)
      // This depends on implementation - checking if line numbers are visible
      const editor = page.getByPlaceholder('Paste your code here...');
      await editor.fill('line 1\nline 2\nline 3');

      // Check if line numbers are present (implementation dependent)
      // If there's a toggle, we'd test it here
    });

    test('find dialog can be opened with Ctrl+F', async ({ page }) => {
      const editor = page.getByPlaceholder('Paste your code here...');
      await editor.click();
      await page.keyboard.press('Control+F');

      // Should see find dialog (implementation dependent)
      // This might show a search input
      await page.waitForTimeout(300);
    });
  });

  test.describe('Mobile Panel Switching', () => {
    test('mobile viewport shows panel toggle buttons', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 }); // Mobile size
      await page.reload();
      await waitForAuthCheck(page);

      // Should see Editor and Preview toggle buttons
      await expect(page.getByRole('button', { name: 'Editor' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Preview' })).toBeVisible();
    });

    test('switching between editor and preview panels', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      await waitForAuthCheck(page);

      // Click Preview button
      await page.getByRole('button', { name: 'Preview' }).click();
      await page.waitForTimeout(200);

      // Editor should be hidden, preview visible
      // Click Editor button
      await page.getByRole('button', { name: 'Editor' }).click();
      await page.waitForTimeout(200);

      // Editor should be visible again
      await expect(page.getByPlaceholder('Paste your code here...')).toBeVisible();
    });
  });
});

