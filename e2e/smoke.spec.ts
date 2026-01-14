import { test, expect } from '@playwright/test';

test('home loads and navigation works', async ({ page }) => {
  await page.goto('./');

  await expect(page.getByRole('heading', { name: 'PST Toolings' })).toBeVisible();

  const nav = page.locator('nav');

  await nav.getByRole('link', { name: 'Code Renderer', exact: true }).click();
  await expect(page.getByText('Live Code Renderer')).toBeVisible();

  await nav.getByRole('link', { name: 'Spreadsheet Diff', exact: true }).click();
  await expect(page.getByText('Spreadsheet Differential Check')).toBeVisible();

  await nav.getByRole('link', { name: 'Deployment Tracker', exact: true }).click();
  await expect(page.getByText('GitHub PR Deployment Tracker')).toBeVisible();

  await nav.getByRole('link', { name: 'JSON Extractor', exact: true }).click();
  await expect(page.getByText('JSON Data Extractor')).toBeVisible();

  await nav.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PST Toolings' })).toBeVisible();
});

test('mobile hamburger menu opens and navigates', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12-ish
  await page.goto('./');

  // Desktop links should be hidden at this width; use the hamburger.
  const openMenu = page.getByRole('button', { name: 'Open menu' });
  await expect(openMenu).toBeVisible();
  await openMenu.click();

  const navLink = page.getByRole('link', { name: 'Code Renderer', exact: true });
  await expect(navLink).toBeVisible();
  await navLink.click();

  await expect(page.getByText('Live Code Renderer')).toBeVisible();
});

