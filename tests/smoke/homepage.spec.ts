import { test, expect } from '@playwright/test';

test('homepage loads and hero/promo banner is visible @critical @smoke', async ({ page }) => {
  await page.goto('/');

  // Verify the page loaded with a non-empty title
  await expect(page).toHaveTitle(/.+/);

  // Verify promotional banners are visible (carousel/slider area)
  const promoBanner = page.locator('[class*="swiper"], [class*="carousel"], [class*="slider"], [class*="banner"]').first()
    .or(page.locator('a[href*="/promotions"], a[href*="/bonus"]').first());
  await expect(promoBanner).toBeVisible({ timeout: 10_000 });

  // Verify "Popular" section with game tiles is rendered
  const popularHeading = page.getByText(/popular/i).first();
  await expect(popularHeading).toBeVisible({ timeout: 10_000 });

  // Verify at least one game link is visible anywhere on the page
  const gameLink = page.locator('a[href*="/games/"]').first();
  await expect(gameLink).toBeVisible({ timeout: 10_000 });
});
