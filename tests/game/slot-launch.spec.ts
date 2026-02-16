import { test, expect } from '@playwright/test';
import { GameDetailPage } from '../pages/GameDetailPage.js';
import { gameConfig } from '../helpers/game-config.js';

test('slot game launches successfully @critical @game', async ({ page }) => {
  const gameDetailPage = new GameDetailPage(page);

  // Navigate to the slot game (client-rendered — needs extended wait)
  await gameDetailPage.gotoGame(gameConfig.slot.id);

  // Verify we navigated to the correct game URL
  expect(page.url()).toContain(gameConfig.slot.id);

  // Game page should show game content: either the game iframe (loaded game)
  // or Fun Play/Real Play buttons ("Set your details" modal for new accounts)
  // Exclude the Intercom chat iframe which is always present but aria-hidden
  const gameIframe = page.locator('iframe:not([title="Intercom"]):not([aria-hidden="true"])').first();
  const playModeButton = page.getByRole('button', { name: /fun play|real play|set your details/i }).first();
  await expect(gameIframe.or(playModeButton).first()).toBeVisible({ timeout: 30_000 });
});
