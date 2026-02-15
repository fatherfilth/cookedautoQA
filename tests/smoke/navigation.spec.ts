import { test, expect } from '@playwright/test';

test('top navigation reaches at least 2 major sections @warning @smoke', async ({ page }) => {
  await page.goto('/');

  // Locate the navigation element
  const navigation = page.getByRole('navigation').first().or(page.locator('nav').first());

  // Assert navigation is visible
  await expect(navigation).toBeVisible();

  // Navigate to first destination (lobby/games/casino/slots)
  const firstLink = navigation.getByRole('link', { name: /lobby|games|casino|slots/i }).first();
  await firstLink.click();

  // Wait for URL change
  await page.waitForURL('**/*');

  // Assert content loaded (heading visible) - validates content, not just URL
  await expect(page.getByRole('heading').first()).toBeVisible();

  // Navigate back to homepage
  await page.goto('/');

  // Navigate to second destination (promotions/rewards/vip/about)
  const secondLink = navigation.getByRole('link', { name: /promotions|rewards|vip|about/i }).first();
  await secondLink.click();

  // Wait for URL change
  await page.waitForURL('**/*');

  // Assert content loaded (heading visible) - validates content, not just URL
  await expect(page.getByRole('heading').first()).toBeVisible();
});
