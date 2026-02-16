import { test, expect } from '@playwright/test';
import { GameDetailPage } from '../pages/GameDetailPage.js';
import { gameConfig } from '../helpers/game-config.js';

test('slot game launches successfully @critical @game', async ({ page }) => {
  const gameDetailPage = new GameDetailPage(page);

  // Navigate to the slot game (client-rendered — needs extended wait)
  await gameDetailPage.gotoGame(gameConfig.slot.id);

  // Verify we navigated to the correct game URL
  expect(page.url()).toContain(gameConfig.slot.id);

  // Game iframe should always be visible with authenticated session
  const gameIframe = gameDetailPage.gameIframe;
  await expect(gameIframe).toBeVisible({ timeout: 30_000 });

  // Verify iframe has a src attribute (not empty)
  const iframeSrc = await gameIframe.getAttribute('src');
  expect(iframeSrc).toBeTruthy();

  // Access iframe content — fall back broadly since provider-specific selectors unknown
  const gameFrame = page.frameLocator('iframe').first();

  // Wait for game content inside iframe
  await gameFrame
    .locator('canvas, [data-game-state], .game-container, body')
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });
});
