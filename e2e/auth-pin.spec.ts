import { test, expect } from '@playwright/test';
import { loginWithAccessLevel, clearAuth, waitForAuthCheck, getCurrentAccessLevel } from './test-helpers';

test.describe('PIN Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
    await page.goto('./');
  });

  test.describe('PIN Entry Modal', () => {
    test('modal appears when not authenticated', async ({ page }) => {
      await waitForAuthCheck(page);
      const modal = page.getByTestId('pin-modal');
      await expect(modal).toBeVisible();
    });

    test('modal blocks page interaction', async ({ page }) => {
      await waitForAuthCheck(page);
      const modal = page.getByTestId('pin-modal');
      await expect(modal).toBeVisible();
      
      // Navigation should not be visible when modal is shown
      const nav = page.locator('nav');
      // Nav might be rendered but modal should be on top
      await expect(modal).toHaveCSS('z-index', '50');
    });

    test('input field is focused on mount', async ({ page }) => {
      await waitForAuthCheck(page);
      const pinInput = page.getByTestId('pin-input');
      await expect(pinInput).toBeFocused();
    });

    test('submit button is disabled when PIN is empty', async ({ page }) => {
      await waitForAuthCheck(page);
      const submitButton = page.getByTestId('pin-submit');
      await expect(submitButton).toBeDisabled();
    });

    test('submit button is enabled when PIN has value', async ({ page }) => {
      await waitForAuthCheck(page);
      const pinInput = page.getByTestId('pin-input');
      const submitButton = page.getByTestId('pin-submit');
      
      await pinInput.fill('test');
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Invalid PIN Rejection', () => {
    test('shows error message for invalid PIN', async ({ page }) => {
      await waitForAuthCheck(page);
      const pinInput = page.getByTestId('pin-input');
      const submitButton = page.getByTestId('pin-submit');
      
      await pinInput.fill('invalid-pin');
      await submitButton.click();
      
      // Wait for error message
      await expect(page.getByText('Invalid PIN. Please try again.')).toBeVisible();
    });

    test('clears PIN field after failed attempt', async ({ page }) => {
      await waitForAuthCheck(page);
      const pinInput = page.getByTestId('pin-input');
      const submitButton = page.getByTestId('pin-submit');
      
      await pinInput.fill('invalid-pin');
      await submitButton.click();
      
      // Wait for error and check PIN is cleared
      await expect(page.getByText('Invalid PIN. Please try again.')).toBeVisible();
      await expect(pinInput).toHaveValue('');
    });

    test('input regains focus after error', async ({ page }) => {
      await waitForAuthCheck(page);
      const pinInput = page.getByTestId('pin-input');
      const submitButton = page.getByTestId('pin-submit');
      
      await pinInput.fill('invalid-pin');
      await submitButton.click();
      
      // Wait for error
      await expect(page.getByText('Invalid PIN. Please try again.')).toBeVisible();
      
      // Input should regain focus
      await expect(pinInput).toBeFocused();
    });

    test('user remains unauthenticated after invalid PIN', async ({ page }) => {
      await waitForAuthCheck(page);
      const pinInput = page.getByTestId('pin-input');
      const submitButton = page.getByTestId('pin-submit');
      
      await pinInput.fill('invalid-pin');
      await submitButton.click();
      
      // Wait for error
      await expect(page.getByText('Invalid PIN. Please try again.')).toBeVisible();
      
      // Modal should still be visible
      await expect(page.getByTestId('pin-modal')).toBeVisible();
      
      // Check localStorage
      const isAuth = await page.evaluate(() => {
        return !!localStorage.getItem('pst-auth-token');
      });
      expect(isAuth).toBe(false);
    });
  });

  test.describe('Access Level 1 (Standard Access)', () => {
    test.beforeEach(async ({ page }) => {
      await loginWithAccessLevel(page, 'level1');
      await page.goto('./');
    });

    test('modal closes after login', async ({ page }) => {
      await waitForAuthCheck(page);
      const modal = page.getByTestId('pin-modal');
      await expect(modal).not.toBeVisible();
    });

    test('navigation shows only allowed pages', async ({ page }) => {
      await waitForAuthCheck(page);
      const nav = page.locator('nav');
      
      // Should see Home, Code Renderer, Spreadsheet Diff, JSON Extractor
      await expect(nav.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Code Renderer', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Spreadsheet Diff', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'JSON Extractor', exact: true })).toBeVisible();
      
      // Should NOT see Deployment Tracker
      await expect(nav.getByRole('link', { name: 'Deployment Tracker', exact: true })).not.toBeVisible();
    });

    test('export buttons are not visible', async ({ page }) => {
      await page.goto('./code-renderer');
      await waitForAuthCheck(page);
      
      // Code renderer export button should not be visible
      const exportButton = page.getByTestId('code-renderer-export-button');
      await expect(exportButton).not.toBeVisible();
      
      // Spreadsheet diff export buttons should not be visible
      await page.goto('./spreadsheet-diff');
      await waitForAuthCheck(page);
      await expect(page.getByTestId('export-csv')).not.toBeVisible();
      await expect(page.getByTestId('export-excel')).not.toBeVisible();
      await expect(page.getByTestId('export-summary')).not.toBeVisible();
      
      // JSON extractor export buttons should not be visible
      await page.goto('./json-extractor');
      await waitForAuthCheck(page);
      await expect(page.getByTestId('json-extractor-export-csv')).not.toBeVisible();
      await expect(page.getByTestId('json-extractor-export-json')).not.toBeVisible();
    });

    test('localStorage contains auth token', async ({ page }) => {
      const accessLevel = await getCurrentAccessLevel(page);
      expect(accessLevel).toBe('level1');
    });
  });

  test.describe('Access Level 2 (Export Enabled)', () => {
    test.beforeEach(async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./');
    });

    test('modal closes after login', async ({ page }) => {
      await waitForAuthCheck(page);
      const modal = page.getByTestId('pin-modal');
      await expect(modal).not.toBeVisible();
    });

    test('navigation shows same pages as Level 1', async ({ page }) => {
      await waitForAuthCheck(page);
      const nav = page.locator('nav');
      
      await expect(nav.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Code Renderer', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Spreadsheet Diff', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'JSON Extractor', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Deployment Tracker', exact: true })).not.toBeVisible();
    });

    test('export buttons are visible and functional', async ({ page }) => {
      // Code renderer export button
      await page.goto('./code-renderer');
      await waitForAuthCheck(page);
      const exportButton = page.getByTestId('code-renderer-export-button');
      await expect(exportButton).toBeVisible();
      
      // Hover to show menu
      await exportButton.hover();
      await expect(page.getByTestId('code-renderer-export-menu')).toBeVisible();
      await expect(page.getByTestId('export-html')).toBeVisible();
      await expect(page.getByTestId('export-code')).toBeVisible();
      await expect(page.getByTestId('share-url')).toBeVisible();
      
      // Spreadsheet diff export buttons
      await page.goto('./spreadsheet-diff');
      await waitForAuthCheck(page);
      await expect(page.getByTestId('export-csv')).toBeVisible();
      await expect(page.getByTestId('export-excel')).toBeVisible();
      await expect(page.getByTestId('export-summary')).toBeVisible();
      
      // JSON extractor export buttons
      await page.goto('./json-extractor');
      await waitForAuthCheck(page);
      await expect(page.getByTestId('json-extractor-export-csv')).toBeVisible();
      await expect(page.getByTestId('json-extractor-export-json')).toBeVisible();
    });

    test('localStorage contains auth token', async ({ page }) => {
      const accessLevel = await getCurrentAccessLevel(page);
      expect(accessLevel).toBe('level2');
    });
  });

  test.describe('Access Level 3 (Full Access)', () => {
    test.beforeEach(async ({ page }) => {
      await loginWithAccessLevel(page, 'level3');
      await page.goto('./');
    });

    test('modal closes after login', async ({ page }) => {
      await waitForAuthCheck(page);
      const modal = page.getByTestId('pin-modal');
      await expect(modal).not.toBeVisible();
    });

    test('all pages appear in navigation', async ({ page }) => {
      await waitForAuthCheck(page);
      const nav = page.locator('nav');
      
      await expect(nav.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Code Renderer', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Spreadsheet Diff', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Deployment Tracker', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'JSON Extractor', exact: true })).toBeVisible();
    });

    test('export buttons are visible and functional', async ({ page }) => {
      await page.goto('./code-renderer');
      await waitForAuthCheck(page);
      await expect(page.getByTestId('code-renderer-export-button')).toBeVisible();
      
      await page.goto('./deployment-tracker');
      await waitForAuthCheck(page);
      await expect(page.getByTestId('deployment-tracker-export-button')).toBeVisible();
    });

    test('can access all protected routes', async ({ page }) => {
      const routes = ['/code-renderer', '/spreadsheet-diff', '/deployment-tracker', '/json-extractor'];
      
      for (const route of routes) {
        await page.goto(`.${route}`);
        await waitForAuthCheck(page);
        
        // Should not see access denied
        await expect(page.getByTestId('access-denied')).not.toBeVisible();
        
        // Should see page content (check for page-specific content)
        if (route === '/code-renderer') {
          await expect(page.getByText('Live Code Renderer')).toBeVisible();
        } else if (route === '/spreadsheet-diff') {
          await expect(page.getByText('Spreadsheet Differential Check')).toBeVisible();
        } else if (route === '/deployment-tracker') {
          await expect(page.getByText('GitHub PR Deployment Tracker')).toBeVisible();
        } else if (route === '/json-extractor') {
          await expect(page.getByText('JSON Data Extractor')).toBeVisible();
        }
      }
    });
  });

  test.describe('Access Level Persistence', () => {
    test('authentication persists after page refresh', async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./');
      await waitForAuthCheck(page);
      
      // Verify export buttons are visible
      await page.goto('./code-renderer');
      await waitForAuthCheck(page);
      await expect(page.getByTestId('code-renderer-export-button')).toBeVisible();
      
      // Refresh page
      await page.reload();
      await waitForAuthCheck(page);
      
      // Export buttons should still be visible
      await expect(page.getByTestId('code-renderer-export-button')).toBeVisible();
      
      // Navigation should still be filtered correctly
      const nav = page.locator('nav');
      await expect(nav.getByRole('link', { name: 'Deployment Tracker', exact: true })).not.toBeVisible();
    });
  });

  test.describe('Protected Route Access Denial', () => {
    test('shows access denied page for restricted route', async ({ page }) => {
      await loginWithAccessLevel(page, 'level1');
      await page.goto('./deployment-tracker');
      await waitForAuthCheck(page);
      
      // Should see access denied page
      await expect(page.getByTestId('access-denied')).toBeVisible();
      await expect(page.getByText('Access Denied')).toBeVisible();
      await expect(page.getByText("You don't have permission to access this page")).toBeVisible();
    });

    test('return home button works', async ({ page }) => {
      await loginWithAccessLevel(page, 'level1');
      await page.goto('./deployment-tracker');
      await waitForAuthCheck(page);
      
      const returnHomeButton = page.getByTestId('access-denied-return-home');
      await expect(returnHomeButton).toBeVisible();
      await returnHomeButton.click();
      
      // Should be redirected to home
      await expect(page).toHaveURL(/.*\/$/);
      await expect(page.getByRole('heading', { name: 'PST Toolings' })).toBeVisible();
    });
  });

  test.describe('Navigation Filtering', () => {
    test('Level 1 shows 4 nav items', async ({ page }) => {
      await loginWithAccessLevel(page, 'level1');
      await page.goto('./');
      await waitForAuthCheck(page);
      
      const nav = page.locator('nav');
      const links = nav.locator('a[href]');
      const count = await links.count();
      expect(count).toBe(4); // Home + 3 tools
    });

    test('Level 2 shows 4 nav items', async ({ page }) => {
      await loginWithAccessLevel(page, 'level2');
      await page.goto('./');
      await waitForAuthCheck(page);
      
      const nav = page.locator('nav');
      const links = nav.locator('a[href]');
      const count = await links.count();
      expect(count).toBe(4); // Home + 3 tools
    });

    test('Level 3 shows 5 nav items', async ({ page }) => {
      await loginWithAccessLevel(page, 'level3');
      await page.goto('./');
      await waitForAuthCheck(page);
      
      const nav = page.locator('nav');
      const links = nav.locator('a[href]');
      const count = await links.count();
      expect(count).toBe(5); // Home + 4 tools
    });
  });

  test.describe('Home Page Card Filtering', () => {
    test('Level 1/2 shows 3 tool cards', async ({ page }) => {
      await loginWithAccessLevel(page, 'level1');
      await page.goto('./');
      await waitForAuthCheck(page);
      
      // Should see 3 tool cards (not Deployment Tracker)
      const cards = page.locator('a[href^="/"]').filter({ hasNotText: 'Home' });
      const count = await cards.count();
      expect(count).toBe(3);
      
      // Should not see Deployment Tracker card
      await expect(page.getByText('Deployment Tracker')).not.toBeVisible();
    });

    test('Level 3 shows 4 tool cards', async ({ page }) => {
      await loginWithAccessLevel(page, 'level3');
      await page.goto('./');
      await waitForAuthCheck(page);
      
      // Should see all 4 tool cards
      const cards = page.locator('a[href^="/"]').filter({ hasNotText: 'Home' });
      const count = await cards.count();
      expect(count).toBe(4);
      
      // Should see Deployment Tracker card
      await expect(page.getByText('Deployment Tracker')).toBeVisible();
    });
  });
});
