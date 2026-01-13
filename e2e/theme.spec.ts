import { test, expect } from '@playwright/test';

test('theme toggle toggles dark class and persists to localStorage', async ({ page }) => {
  await page.goto('./');

  const root = page.locator('html');
  const hadDark = await root.evaluate((el) => el.classList.contains('dark'));

  await page.getByRole('button', { name: /Switch to (dark|light) mode/i }).click();

  await expect
    .poll(async () => root.evaluate((el) => el.classList.contains('dark')))
    .toBe(!hadDark);

  const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
  expect(storedTheme === 'light' || storedTheme === 'dark').toBeTruthy();
});

