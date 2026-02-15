import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LobbyPage extends BasePage {
  protected readonly path = '/';

  // Locators — update selectors after live site inspection
  readonly searchInput: Locator;
  readonly gameCategories: Locator;
  readonly gameGrid: Locator;
  readonly firstGameTile: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByRole('searchbox').or(
      page.getByTestId('game-search')
    );
    this.gameCategories = page.getByRole('tablist').or(
      page.getByTestId('game-categories')
    );
    this.gameGrid = page.getByTestId('game-grid').or(
      page.getByRole('list', { name: /games/i })
    );
    this.firstGameTile = this.gameGrid.locator('> *').first();
  }

  async searchForGame(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async selectCategory(categoryName: string): Promise<void> {
    await this.page.getByRole('tab', { name: categoryName }).click();
  }

  async clickFirstGame(): Promise<void> {
    await this.firstGameTile.click();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    // Wait for game grid to have at least one item
    await this.gameGrid.waitFor({ state: 'visible' });
  }
}
