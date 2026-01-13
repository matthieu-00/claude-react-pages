import { test, expect } from '@playwright/test';

test('code renderer renders HTML preview', async ({ page }) => {
  await page.goto('./code-renderer');

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

