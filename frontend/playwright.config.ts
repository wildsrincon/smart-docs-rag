import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Disable parallel to avoid conflicts with backend
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for E2E
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start both frontend and backend for E2E tests
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'cd ../backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000',
      url: 'http://localhost:8000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        DATABASE_URL: 'postgresql+asyncpg://postgres:postgres@localhost:5432/test_db',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-key',
      },
    },
  ],
});
