import { test, expect } from '@playwright/test';

test('top navigation reaches at least 2 major sections @warning @smoke', async ({ page }) => {
  await page.goto('/');

  // Target sidebar navigation (complementary role with navigation > list > links)
  const sidebar = page.getByRole('complementary');
  await expect(sidebar).toBeVisible({ timeout: 10_000 });

  // Navigate to first destination — Slots category via sidebar link
  const slotsLink = sidebar.locator('a[href*="/games/slots"]').first().or(
    sidebar.getByRole('link', { name: /slots/i }).first()
  );
  await slotsLink.click();

  // Wait for navigation to a /games/ URL
  await page.waitForURL('**/games/**', { timeout: 10_000 });

  // Assert content loaded (heading or game grid visible)
  await expect(
    page.getByRole('heading').first().or(page.locator('main').first())
  ).toBeVisible({ timeout: 10_000 });

  // Navigate back to homepage
  await page.goto('/');

  // Navigate to second destination — Promotions via sidebar link
  const promoLink = sidebar.locator('a[href*="/promotions"]').first().or(
    sidebar.getByRole('link', { name: /promotions/i }).first()
  );
  await promoLink.click();

  // Wait for promotions URL
  await page.waitForURL('**/promotions**', { timeout: 10_000 });

  // Assert content loaded (heading visible)
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 });
});
