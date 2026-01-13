import { test, expect } from '@playwright/test';

test('deployment tracker can add PR URLs and renders cards', async ({ page }) => {
  await page.goto('./deployment-tracker');

  const input = page.getByPlaceholder(/Paste GitHub PR URLs here/i);
  await input.fill([
    'https://github.com/example-org/example-repo/pull/123',
    'https://github.com/example-org/example-repo/pull/456',
  ].join('\n'));

  await page.getByRole('button', { name: 'Add PRs to Tracker' }).click();

  await expect(page.getByText('PR #123')).toBeVisible();
  await expect(page.getByText('PR #456')).toBeVisible();
});

