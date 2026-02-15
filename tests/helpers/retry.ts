import { config } from './test-config.js';

/**
 * Retries an async action up to maxAttempts times before failing.
 * Used for operations that may be flaky due to timing (not for Playwright
 * locator actions which auto-retry via the Locator API).
 *
 * Use cases: API calls, navigation to dynamic URLs, custom state checks.
 * Do NOT use for: click(), fill(), expect() — these already auto-retry.
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    delayMs?: number;
    label?: string;
  }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? config.retry.maxAttempts;
  const delayMs = options?.delayMs ?? config.retry.delayMs;
  const label = options?.label ?? 'action';
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        console.warn(
          `Retry ${attempt}/${maxAttempts} for "${label}": ${lastError.message}`
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `"${label}" failed after ${maxAttempts} attempts. Last error: ${lastError!.message}`
  );
}
