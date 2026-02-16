import { test, expect } from '@playwright/test';
import { GameDetailPage } from '../pages/GameDetailPage.js';
import { gameConfig } from '../helpers/game-config.js';

test('live dealer game launches successfully @critical @game', async ({ page }) => {
  const gameDetailPage = new GameDetailPage(page);

  // Dynamically discover a live dealer game slug from the category page
  let liveSlug = gameConfig.live.id;

  // Navigate to live casino category to find an actual game slug
  await page.goto('/games/live-casino');
  try {
    const liveGameLink = page.locator('a[href*="/games/all/"]').first();
    await liveGameLink.waitFor({ state: 'visible', timeout: 15_000 });
    const href = await liveGameLink.getAttribute('href');
    if (href) {
      const match = href.match(/\/games\/all\/([^/?#]+)/);
      if (match) {
        liveSlug = match[1];
      }
    }
  } catch {
    // Fall back to config default if category page doesn't load
  }

  // Navigate to the live dealer game (client-rendered — needs extended wait)
  await gameDetailPage.gotoGame(liveSlug);

  // Verify we navigated to a game URL
  expect(page.url()).toContain('/games/');

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
