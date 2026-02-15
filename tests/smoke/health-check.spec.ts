import { test, expect } from '@playwright/test';

test('homepage loads successfully @critical @smoke', async ({ page }) => {
  await page.goto('/');

  // Verify the page loaded — use a broad assertion that works regardless of content
  await expect(page).toHaveTitle(/.+/);

  // Verify we're on the expected domain
  expect(page.url()).toContain(process.env.BASE_URL || 'cooked.com');
});
