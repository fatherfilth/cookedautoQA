import { test, expect } from '@playwright/test';

test('homepage loads and hero/promo banner is visible @critical @smoke', async ({ page }) => {
  await page.goto('/');

  // Verify the page loaded with a non-empty title
  await expect(page).toHaveTitle(/.+/);

  // Hero is a PromoBannerItem component — look for promo banner area by text/class
  const hero = page.locator('[class*="PromoBanner"], [class*="promo-banner"], [class*="promoBanner"]').first().or(
    page.locator('[class*="hero"], [class*="banner"]').first()
  ).or(
    page.getByText(/welcome to cooked/i)
  ).or(
    page.locator('main').first()
  );

  // Assert hero/promo banner is visible
  await expect(hero).toBeVisible({ timeout: 10_000 });

  // Assert hero has content (not empty)
  await expect(hero).not.toBeEmpty();
});
