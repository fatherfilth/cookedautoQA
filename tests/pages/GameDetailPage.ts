import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { waitForApiResponse } from '../helpers/waits.js';

export class GameDetailPage extends BasePage {
  protected readonly path = '/games'; // Will be dynamic: /games/:id

  readonly gameIframe: Locator;
  readonly playButton: Locator;
  readonly gameName: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.gameIframe = page.locator('iframe[src*="game"]').or(
      page.getByTestId('game-iframe')
    );
    this.playButton = page.getByRole('button', { name: /play|launch|start/i }).or(
      page.getByTestId('game-play')
    );
    this.gameName = page.getByRole('heading', { level: 1 }).or(
      page.getByTestId('game-name')
    );
    this.loadingIndicator = page.getByTestId('game-loading').or(
      page.getByRole('progressbar')
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
    // Wait for game name heading to appear
    await this.gameName.waitFor({ state: 'visible' });
  }
}
