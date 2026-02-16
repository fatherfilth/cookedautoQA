import { Page, Locator } from '@playwright/test';

/**
 * ChatPage — Chat is a drawer/sidebar, not a dedicated page.
 * Opened via a chat toggle button in the bottom nav or sidebar.
 * Does NOT extend BasePage since there's no path to navigate to.
 */
export class ChatPage {
  readonly page: Page;

  // Drawer open trigger
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

    // Chat toggle: look for chat button in nav/sidebar
    this.chatToggleButton = page.getByRole('button', { name: /chat/i }).or(
      page.locator('[class*="chat"] button, button[class*="chat"], [aria-label*="chat" i]').first()
    );

    // Chat drawer/sidebar container
    this.chatDrawer = page.locator('[class*="ChatDrawer"], [class*="chat-drawer"], [class*="chatDrawer"]').first().or(
      page.getByRole('complementary').filter({ hasText: /chat/i })
    ).or(
      page.locator('[class*="drawer"], [class*="sidebar"]').filter({ has: page.locator('[class*="chat" i]') }).first()
    );

    // Individual chat message elements
    this.chatMessages = this.chatDrawer.locator('[class*="message"]').or(
      this.chatDrawer.getByRole('listitem')
    );

    // Message input field
    this.chatInput = page.getByRole('textbox', { name: /message|chat/i }).or(
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
