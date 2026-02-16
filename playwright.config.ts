import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://cooked.com',
    headless: process.env.HEADLESS !== 'false',

    // Artifacts on failure only (INFRA-04)
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',

    // Timeouts
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  timeout: 60_000,

  projects: [
    // Auth setup — runs first, registers fresh account, saves storageState
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Main test suite — depends on setup, uses saved auth state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
