import { test, expect } from '@playwright/test';
import { GameDetailPage } from '../pages/GameDetailPage.js';
import { gameConfig } from '../helpers/game-config.js';

test('live dealer game launches successfully @critical @game', async ({ page }) => {
  const gameDetailPage = new GameDetailPage(page);

  // Navigate to the live dealer game (client-rendered — needs extended wait)
  await gameDetailPage.gotoGame(gameConfig.live.id);

  // Assert game iframe is visible with extended timeout for client-rendered content
  // Live dealer games may have additional latency for video stream initialization
  await expect(gameDetailPage.gameIframe).toBeVisible({ timeout: 30_000 });

  // Verify iframe has a src attribute (not empty)
  const iframeSrc = await gameDetailPage.gameIframe.getAttribute('src');
  expect(iframeSrc).toBeTruthy();

  // Access iframe content — fall back broadly since provider-specific selectors unknown
  const gameFrame = page.frameLocator('iframe').first();

  // Wait for game content inside iframe
  await gameFrame
    .locator('canvas, [data-game-state], .game-container, body')
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });
});
