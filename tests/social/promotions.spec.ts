import { test, expect } from '@playwright/test';
import { LobbyPage } from '../pages/LobbyPage.js';

/**
 * SOCIAL-04: Promotional content display test
 * Validates "Latest and Greatest" promotional messages display on the appropriate page.
 * Tests structure and presence, not specific content (promotions may be A/B tested, personalized, or time-limited).
 *
 * TODO: If promotions are not on lobby page, update to navigate to dedicated promotions/offers page
 * TODO: Refine promo section selector after inspecting live site. Check lobby, homepage, and dedicated promotions page.
 */
test('"Latest and Greatest" promotional messages display @warning @social', async ({ page }) => {
  const lobbyPage = new LobbyPage(page);

  // Navigate to lobby/homepage (promotions most likely appear there)
  await lobbyPage.open();

  // Locate promotional section using flexible selectors
  // Promotions may use various patterns across different sites
  const promoSection = page.getByTestId('promotions').or(
    page.getByRole('region', { name: /latest|promotions|featured|greatest/i })
  ).or(
    page.locator('[data-testid*="promo"], [class*="promo"], section:has-text("Latest")')
  );

  // Wait for promotional section to appear (may load asynchronously or after main content)
  await expect(promoSection).toBeVisible({ timeout: 15_000 });

  // Locate promotional items within the section
  const promoItems = promoSection.locator('[data-testid*="promo-card"], article, [class*="promo-item"], [class*="card"]').or(
    promoSection.locator('> *')
  );

  // Assert at least one promotional item is visible
  await expect(promoItems.first()).toBeVisible();

  // Assert promotional content has substance (not empty/placeholder)
  const firstPromo = promoItems.first();
  const promoText = await firstPromo.textContent();
  expect(promoText).toBeTruthy();
  expect(promoText!.trim().length).toBeGreaterThan(0);

  // Validates promotional content section is present and populated.
  // Does not assert specific promo text since promotions may be A/B tested, personalized, or time-limited.
});
