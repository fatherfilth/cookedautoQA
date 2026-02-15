export const config = {
  timeouts: {
    action: 15_000,        // Click, fill, etc.
    navigation: 30_000,    // page.goto, page.waitForURL
    assertion: 10_000,     // expect() assertions
    spinner: 10_000,       // Wait for loading spinners to disappear
    apiResponse: 15_000,   // Wait for specific API response
  },
  retry: {
    maxAttempts: 3,        // RELY-01: retry 2-3 times
    delayMs: 1_000,        // Wait between retries
  },
  selectors: {
    // Common loading indicators to wait for disappearance
    spinners: [
      '[data-testid="loading-spinner"]',
      '[role="progressbar"]',
      '.loading-spinner',   // CSS fallback (last resort)
    ],
  },
} as const;

// Criticality tags for RELY-04
export const Tags = {
  CRITICAL: '@critical',
  WARNING: '@warning',
  SMOKE: '@smoke',
} as const;
