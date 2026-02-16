import { Page } from '@playwright/test';

/**
 * Handle the "Set your details" modal that appears on game pages for new accounts.
 * Clicks "Fun Play" to load the game in demo mode, bypassing profile completion.
 * Returns true if the modal was found and handled.
 */
export async function dismissDetailsModal(page: Page): Promise<boolean> {
  const funPlayButton = page.getByRole('button', { name: /fun play/i });
  const visible = await funPlayButton.isVisible({ timeout: 3_000 }).catch(() => false);
  if (!visible) return false;

  await funPlayButton.click();
  await page.waitForTimeout(1_000);
  return true;
}
