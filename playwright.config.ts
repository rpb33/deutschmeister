import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173/deutschmeister/', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173',
    url: 'http://127.0.0.1:4173/deutschmeister/',
    reuseExistingServer: !process.env.CI,
  },
});
