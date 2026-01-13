import { test, expect } from '@playwright/test';
import { fixturePath } from './fixture-path';

test('json extractor imports JSON file and shows extracted content', async ({ page }) => {
  await page.goto('./json-extractor');

  const jsonPath = fixturePath('sample.json');
  await page.locator('input[type="file"][accept=".json"]').setInputFiles(jsonPath);

  await expect(page.getByText('Records', { exact: true })).toBeVisible();
  await expect(page.getByText('Alice')).toBeVisible();
  await expect(page.getByText('Bob')).toBeVisible();
});

