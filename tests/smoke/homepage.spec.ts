import { test, expect } from '@playwright/test';

test('homepage loads and hero element is visible @critical @smoke', async ({ page }) => {
  await page.goto('/');

  // Verify the page loaded with a non-empty title
  await expect(page).toHaveTitle(/.+/);

  // Locate hero element using data-testid fallback to main element
  const hero = page.locator('[data-testid="hero"]').or(page.locator('main').first());

  // Assert hero is visible
  await expect(hero).toBeVisible();

  // Assert hero has content (not empty)
  await expect(hero).not.toBeEmpty();
});
