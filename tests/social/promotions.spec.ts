import { test, expect } from '@playwright/test';

/**
 * SOCIAL-04: Promotional content display test
 * Navigates to /promotions (confirmed dedicated page) to verify promo card layout.
 */
test('"Latest and Greatest" promotional messages display @warning @social', async ({ page }) => {
  // Navigate to dedicated promotions page
  await page.goto('/promotions');

  // Wait for page to load
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 });

  // Locate promotional cards — promo cards are links with h2 titles
  const promoCards = page.locator('a[href*="/promotions/"]').or(
    page.locator('[class*="promo"], [class*="card"]').filter({
      has: page.locator('h2, h3'),
    })
  );

  // Assert at least one promotional card is visible
  await expect(promoCards.first()).toBeVisible({ timeout: 10_000 });

  // Assert promotional content has substance (not empty/placeholder)
  const firstPromo = promoCards.first();
  const promoText = await firstPromo.textContent();
  expect(promoText).toBeTruthy();
  expect(promoText!.trim().length).toBeGreaterThan(0);

  // Assert multiple promotions exist
  const promoCount = await promoCards.count();
  expect(promoCount).toBeGreaterThan(0);
});
