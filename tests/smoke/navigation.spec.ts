import { test, expect } from '@playwright/test';

test('top navigation reaches at least 2 major sections @warning @smoke', async ({ page }) => {
  await page.goto('/');

  // Locate the navigation element
  const navigation = page.getByRole('navigation').first().or(page.locator('nav').first());

  // Assert navigation is visible
  await expect(navigation).toBeVisible();

  // Navigate to first destination — target game category links by href
  const firstLink = navigation.locator('a[href*="/games/"]').first().or(
    navigation.getByRole('link', { name: /slots|casino|games|lobby/i }).first()
  );
  await firstLink.click();

  // Wait for navigation to a /games/ URL
  await page.waitForURL('**/games/**', { timeout: 10_000 });

  // Assert content loaded (heading or game grid visible)
  await expect(
    page.getByRole('heading').first().or(page.locator('.grid').first())
  ).toBeVisible({ timeout: 10_000 });

  // Navigate back to homepage
  await page.goto('/');

  // Navigate to second destination — promotions or other section
  const secondLink = navigation.locator('a[href*="/promotions"]').first().or(
    navigation.getByRole('link', { name: /promotions|rewards|vip|about/i }).first()
  );
  await secondLink.click();

  // Wait for URL change
  await page.waitForURL('**/*');

  // Assert content loaded (heading visible)
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 });
});
