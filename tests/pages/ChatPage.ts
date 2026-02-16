import { Page, Locator } from '@playwright/test';

/**
 * ChatPage — Chat is a drawer/sidebar, not a dedicated page.
 * Opened via a chat toggle button in the bottom nav (mobile) or sidebar (desktop).
 * Does NOT extend BasePage since there's no path to navigate to.
 *
 * Mobile viewport (390x844) uses BottomNavigationChat button.
 * Desktop uses "Open Chat" button with aria-label.
 */
export class ChatPage {
  readonly page: Page;

  // Drawer open trigger — target mobile BottomNavigationChat specifically
  readonly chatToggleButton: Locator;

  // Chat drawer container and message locators
  readonly chatDrawer: Locator;
  readonly chatMessages: Locator;
  readonly chatInput: Locator;

  // Tipping flow locators
  readonly tipButton: Locator;
  readonly tipModal: Locator;
  readonly tipAmountOptions: Locator;
  readonly selectedTipAmount: Locator;
  readonly confirmTipButton: Locator;
  readonly tipConfirmationDialog: Locator;
  readonly submitTipButton: Locator;
  readonly cancelTipButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Chat toggle: for mobile tests, target BottomNavigationChat component directly.
    // For desktop, target by aria-label. Use .last() since the desktop hidden button
    // appears first in DOM and .first() would select the invisible one at mobile viewport.
    this.chatToggleButton = page.locator('button[component="BottomNavigationChat"]');

    // Chat drawer/sidebar container — anchor on "Enter a message" placeholder input
    // and find its parent panel/container
    this.chatDrawer = page.locator('aside, [role="dialog"], div').filter({
      has: page.getByPlaceholder(/enter a message/i)
    }).first();

    // Individual chat message elements — messages show as username: text
    this.chatMessages = this.chatDrawer.locator('[class*="message"]').or(
      this.chatDrawer.locator('div, p, span').filter({ hasText: /\w+:/ })
    );

    // Message input field — "Enter a message" placeholder
    this.chatInput = page.getByPlaceholder(/enter a message/i).or(
      this.chatDrawer.locator('input, textarea').first()
    );

    // Tip button in chat interface
    this.tipButton = page.getByRole('button', { name: /tip|gift|send tip/i }).or(
      this.chatDrawer.locator('button').filter({ hasText: /tip/i }).first()
    );

    // Tip modal/dialog
    this.tipModal = page.getByRole('dialog', { name: /tip/i }).or(
      page.locator('[class*="tip-modal"], [class*="tipModal"]').first()
    );

    // Tip amount buttons (e.g., $5, $10, $20)
    this.tipAmountOptions = this.tipModal.getByRole('button', { name: /\$\d+/ }).or(
      this.tipModal.locator('button').filter({ hasText: /\$\d+/ })
    );

    // Currently selected tip amount
    this.selectedTipAmount = this.tipModal.locator('[aria-selected="true"], [data-selected], .selected').or(
      this.tipModal.locator('[class*="active"], [class*="selected"]').first()
    );

    // Confirm button in tip modal
    this.confirmTipButton = this.tipModal.getByRole('button', { name: /confirm/i }).or(
      this.tipModal.locator('button').filter({ hasText: /confirm/i }).first()
    );

    // Second confirmation dialog
    this.tipConfirmationDialog = page.getByRole('alertdialog').or(
      page.getByRole('dialog').filter({ hasText: /confirm/i })
    );

    // Final submit button (DO NOT CLICK in tests)
    this.submitTipButton = this.tipConfirmationDialog.getByRole('button', { name: /submit|send|confirm/i }).or(
      this.tipConfirmationDialog.locator('button').filter({ hasText: /submit|send|confirm/i }).first()
    );

    // Cancel button in tip dialogs
    this.cancelTipButton = this.tipModal.getByRole('button', { name: /cancel|close/i }).or(
      this.tipModal.locator('button').filter({ hasText: /cancel|close/i }).first()
    );
  }

  /** Open the chat drawer by clicking the toggle button */
  async openDrawer(): Promise<void> {
    await this.chatToggleButton.click();
    await this.chatDrawer.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Navigate to homepage and open chat drawer */
  async open(): Promise<void> {
    await this.page.goto('/');
    await this.openDrawer();
  }

  async sendMessage(text: string): Promise<void> {
    await this.chatInput.fill(text);
    await this.chatInput.press('Enter');
  }

  async clickTipButton(): Promise<void> {
    await this.tipButton.click();
  }

  async selectTipAmount(amount: string): Promise<void> {
    await this.tipAmountOptions.filter({ hasText: `$${amount}` }).click();
  }

  async clickConfirmTip(): Promise<void> {
    await this.confirmTipButton.click();
  }

  async clickCancelTip(): Promise<void> {
    await this.cancelTipButton.click();
  }
}
