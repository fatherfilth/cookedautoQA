import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LobbyPage extends BasePage {
  protected readonly path = '/games/lobby';

  // Locators — search removed (mobile-only BottomNavigationSearch, not available on desktop)
  readonly gameCategories: Locator;
  readonly gameGrid: Locator;
  readonly firstGameTile: Locator;

  constructor(page: Page) {
    super(page);
    // Categories: site uses links (not tabs) for game categories
    this.gameCategories = page.locator('nav a[href*="/games/"]').or(
      page.getByRole('navigation').filter({ hasText: /slots|live|table/i })
    );
    // Game grid: CSS grid with aspect-3/4 game cards
    this.gameGrid = page.locator('.grid').filter({ has: page.locator('[class*="aspect"]') }).first().or(
      page.locator('[class*="game-grid"], [class*="gameGrid"]').first()
    );
    this.firstGameTile = this.gameGrid.locator('a, [class*="aspect"]').first();
  }

  async selectCategory(categoryName: string): Promise<void> {
    await this.page.getByRole('link', { name: new RegExp(categoryName, 'i') }).click();
  }

  async clickFirstGame(): Promise<void> {
    await this.firstGameTile.click();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    // Wait for game grid to have at least one item
    await this.gameGrid.waitFor({ state: 'visible', timeout: 15_000 });
  }
}
