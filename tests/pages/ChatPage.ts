import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Chat page object for WebSocket-based chat interface.
 * Includes locators for chat messages and tipping flow.
 * All locators use .or() chains — update selectors after live site inspection.
 *
 * TODO: Verify actual chat path (/chat or /live-chat) against live site
 * TODO: Update chat container structure after inspecting production DOM
 * TODO: Update message item selectors after inspecting live chat messages
 * TODO: Update tip button location and tipping modal structure after live site inspection
 */
export class ChatPage extends BasePage {
  // TODO: Verify path — could be /chat or /live-chat
  protected readonly path = '/chat';

  // Chat container and message locators
  readonly chatContainer: Locator;
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
    super(page);

    // Chat container — often uses role="log" for accessibility
    this.chatContainer = page.getByTestId('chat-container').or(
      page.getByRole('log').or(
        page.locator('[class*="chat"], [id*="chat"]').first()
      )
    );

    // Individual chat message elements
    this.chatMessages = this.chatContainer.getByRole('listitem').or(
      this.chatContainer.locator('[data-testid="chat-message"], [class*="message"]')
    );

    // Message input field
    this.chatInput = page.getByRole('textbox', { name: /message|chat/i }).or(
      page.getByTestId('chat-input')
    );

    // Tip button in chat interface
    this.tipButton = page.getByRole('button', { name: /tip|gift|send tip/i }).or(
      page.getByTestId('tip-button')
    );

    // Tip modal/dialog
    this.tipModal = page.getByRole('dialog', { name: /tip/i }).or(
      page.getByTestId('tip-modal')
    );

    // Tip amount buttons (e.g., $5, $10, $20)
    this.tipAmountOptions = this.tipModal.getByRole('button', { name: /\$\d+/ }).or(
      this.tipModal.getByTestId('tip-amount')
    );

    // Currently selected tip amount
    this.selectedTipAmount = this.tipModal.locator('[aria-selected="true"], [data-selected], .selected').or(
      this.tipModal.getByTestId('selected-amount')
    );

    // Confirm button in tip modal
    this.confirmTipButton = this.tipModal.getByRole('button', { name: /confirm/i }).or(
      this.tipModal.getByTestId('confirm-tip')
    );

    // Second confirmation dialog (alertdialog role for confirmation step)
    this.tipConfirmationDialog = page.getByRole('alertdialog').or(
      page.getByTestId('tip-confirmation')
    );

    // Final submit button (DO NOT CLICK in tests to avoid real transactions)
    this.submitTipButton = this.tipConfirmationDialog.getByRole('button', { name: /submit|send|confirm/i }).or(
      this.tipConfirmationDialog.getByTestId('submit-tip')
    );

    // Cancel button in tip dialogs
    this.cancelTipButton = this.tipModal.getByRole('button', { name: /cancel|close/i }).or(
      this.tipModal.getByTestId('cancel-tip')
    );
  }

  /**
   * Send a chat message (for future use).
   * Not needed for SOCIAL-01/02 but included for completeness.
   */
  async sendMessage(text: string): Promise<void> {
    await this.chatInput.fill(text);
    await this.chatInput.press('Enter');
  }

  /**
   * Click the tip button to open tipping flow.
   */
  async clickTipButton(): Promise<void> {
    await this.tipButton.click();
  }

  /**
   * Select a tip amount by clicking the button matching the dollar amount.
   * @param amount - Dollar amount as string (e.g., '5' for $5)
   */
  async selectTipAmount(amount: string): Promise<void> {
    await this.tipAmountOptions.filter({ hasText: `$${amount}` }).click();
  }

  /**
   * Click the confirm button in the tip modal.
   */
  async clickConfirmTip(): Promise<void> {
    await this.confirmTipButton.click();
  }

  /**
   * Click the cancel button in tip dialogs.
   */
  async clickCancelTip(): Promise<void> {
    await this.cancelTipButton.click();
  }

  /**
   * Override waitForReady to wait for chat container to be visible.
   * Chat must be loaded before tests can interact with messages.
   */
  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    // Wait for chat container with 10s timeout
    await this.chatContainer.waitFor({ state: 'visible', timeout: 10_000 });
  }
}
