import { test, expect } from '@playwright/test';
import { fixturePath } from './fixture-path';

test('spreadsheet diff accepts uploads and computes diffs', async ({ page }) => {
  await page.goto('./spreadsheet-diff');

  const a = fixturePath('spreadsheet-a.csv');
  const b = fixturePath('spreadsheet-b.csv');

  await page.getByTestId('spreadsheet1-file').setInputFiles(a);
  await page.getByTestId('spreadsheet2-file').setInputFiles(b);

  await expect(page.getByText('✓ 2 rows, 2 columns')).toHaveCount(2);
  await expect(page.getByText('Total Differences: 1')).toBeVisible();
});

