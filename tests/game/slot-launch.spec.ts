import { test, expect } from '@playwright/test';
import { GameDetailPage } from '../pages/GameDetailPage.js';
import { gameConfig } from '../helpers/game-config.js';

test('slot game launches successfully @critical @game', async ({ page }) => {
  const gameDetailPage = new GameDetailPage(page);

  // Navigate to the slot game (client-rendered — needs extended wait)
  await gameDetailPage.gotoGame(gameConfig.slot.id);

  // Verify we navigated to the correct game URL
  expect(page.url()).toContain(gameConfig.slot.id);

  // Game iframe should load for verified accounts
  // Exclude the Intercom chat iframe which is always present but aria-hidden
  const gameIframe = page.locator('iframe:not([title="Intercom"]):not([aria-hidden="true"])').first();
  await expect(gameIframe).toBeVisible({ timeout: 30_000 });
});
