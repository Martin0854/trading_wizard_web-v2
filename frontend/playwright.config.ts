import { defineConfig, devices } from '@playwright/test';

/**
 * Trading Wizard E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Environment variables:
 * - BASE_URL: Override the base URL for all tests (e.g., https://trading.kalee-dc.click/)
 * - DAILY_FOCUS_URL: Override URL for daily-focus app
 * - MY_PORTFOLIO_URL: Override URL for my-portfolio app
 */

// Support external URLs for testing against deployed environments
const isExternalTest = !!process.env.BASE_URL;
const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || '';
const dailyFocusUrl = process.env.DAILY_FOCUS_URL || (baseUrl ? `${baseUrl}/daily-focus` : 'http://localhost:3001');
const myPortfolioUrl = process.env.MY_PORTFOLIO_URL || (baseUrl ? `${baseUrl}/portfolio` : 'http://localhost:3002');

export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: dailyFocusUrl,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // Production tests (run when BASE_URL is set)
    ...(isExternalTest ? [
      {
        name: 'production',
        use: {
          ...devices['Desktop Chrome'],
          baseURL: baseUrl,
        },
        testMatch: /production\/.*\.spec\.ts/,
      },
    ] : []),
    // Local development tests
    {
      name: 'daily-focus',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: dailyFocusUrl,
      },
      testMatch: /daily-focus\/.*\.spec\.ts/,
    },
    {
      name: 'my-portfolio',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: myPortfolioUrl,
      },
      testMatch: /my-portfolio\/.*\.spec\.ts/,
    },
  ],

  /* Output folder for artifacts */
  outputDir: 'test-results/',

  /* Run your local dev server before starting the tests (skip if external URL) */
  ...(isExternalTest ? {} : {
    webServer: [
      {
        command: 'pnpm dev:daily-focus',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
      {
        command: 'pnpm dev:my-portfolio',
        url: 'http://localhost:3002',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
    ],
  }),
});
