import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class GameDetailPage extends BasePage {
  protected readonly path = '/games'; // Will be dynamic: /games/:id

  readonly gameIframe: Locator;
  readonly playButton: Locator;
  readonly gameName: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    super(page);
    // Iframe: match any iframe (game providers use various src patterns)
    this.gameIframe = page.locator('iframe[src*="game"]').or(
      page.locator('iframe').first()
    );
    this.playButton = page.getByRole('button', { name: /play|launch|start/i }).or(
      page.locator('button').filter({ hasText: /play|launch|start/i }).first()
    );
    // Game name: client-rendered heading
    this.gameName = page.getByRole('heading', { level: 1 }).or(
      page.getByRole('heading').first()
    );
    this.loadingIndicator = page.locator('[role="progressbar"]').or(
      page.locator('[class*="loading"], [class*="spinner"]').first()
    );
  }

  /** Navigate to a specific game by slug or ID */
  async gotoGame(gameIdOrSlug: string): Promise<void> {
    await this.page.goto(`/games/${gameIdOrSlug}`);
    await this.waitForReady();
  }

  /** Check if game iframe has loaded */
  async isGameLoaded(): Promise<boolean> {
    return this.gameIframe.isVisible();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    // Client-rendered content needs longer wait; try heading first, fall back to any content
    try {
      await this.gameName.waitFor({ state: 'visible', timeout: 15_000 });
    } catch {
      // Game detail may not have a heading — wait for any main content instead
      await this.page.locator('main, [class*="game"]').first().waitFor({ state: 'visible', timeout: 10_000 });
    }
  }
}
