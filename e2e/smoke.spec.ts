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

