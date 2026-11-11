import { defineConfig, devices } from '@playwright/test';

// Os testes rodam contra o build de produção (`pnpm build` antes), servido
// pelo `vite preview`: é ali que existem a CSP e o service worker.
const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/pdf/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'galaxy-a55', use: { ...devices['Galaxy A55'] } },
  ],
  webServer: {
    command: `pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/pdf/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
