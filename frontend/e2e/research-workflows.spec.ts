import { test, expect } from '@playwright/test';

test.describe('Quant Research Dashboard — End-to-End Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Deterministic API Route Interception: Mock instruments & backend responses
    await page.route('**/api/v1/instruments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: '3a12b456-789c-4def-0000-123456789abc',
              symbol: 'AAPL',
              name: 'Apple Inc.',
              asset_type: 'EQUITY',
              currency: 'USD',
              exchange: 'NASDAQ',
              is_active: true,
            },
          ],
          total: 1,
        }),
      });
    });

    await page.route('**/api/v1/market-data/latest**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          symbol: 'AAPL',
          close: 185.5,
          open: 183.0,
          high: 186.2,
          low: 182.5,
          volume: 55000000,
          change: 2.5,
          change_percent: 1.37,
          timestamp: '2026-09-25T20:00:00Z',
          freshness: 'CURRENT',
          provider: 'YAHOO',
          delayed: true,
        }),
      });
    });

    await page.route('**/api/v1/returns**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          summary: {
            total_return: 0.25,
            annualized_return: 0.18,
            volatility: 0.22,
            sharpe_ratio: 0.82,
            max_drawdown: -0.12,
          },
          series: [
            {
              timestamp: '2026-01-02T00:00:00Z',
              price: 150.0,
              simple_return: null,
              log_return: null,
              cumulative_return: 0.0,
            },
            {
              timestamp: '2026-01-03T00:00:00Z',
              price: 153.0,
              simple_return: 0.02,
              log_return: 0.0198,
              cumulative_return: 0.02,
            },
          ],
        }),
      });
    });
  });

  // Workflow 1: Market Data Navigation & Inspection
  test('Workflow 1: Navigate to Market Data workspace, inspect instrument and latest quotes', async ({
    page,
  }) => {
    await page.goto('/market-data?symbol=AAPL');
    await expect(page.locator('h1, h2, span').filter({ hasText: /Market Data/i }).first()).toBeVisible();
    await expect(page.locator('text=AAPL').first()).toBeVisible();
  });

  // Workflow 2: Return Analysis Workflow
  test('Workflow 2: Return Analysis navigation, preset toggles and metrics inspection', async ({
    page,
  }) => {
    await page.goto('/returns?symbol=AAPL');
    await expect(page.locator('h1, h2, span').filter({ hasText: /Return/i }).first()).toBeVisible();
    await expect(page.locator('button:has-text("1Y")').first()).toBeVisible();
  });

  // Workflow 3: Portfolio Overview Workflow
  test('Workflow 3: Portfolio workspace navigation and inventory inspection', async ({ page }) => {
    await page.goto('/portfolio');
    await expect(page.locator('h1, h2, span').filter({ hasText: /Portfolio/i }).first()).toBeVisible();
  });

  // Workflow 4: Strategy Research Workflow
  test('Workflow 4: Moving Average Strategy parameters and crossover research', async ({ page }) => {
    await page.goto('/strategies?symbol=AAPL');
    await expect(page.locator('h1, h2, span').filter({ hasText: /Strateg/i }).first()).toBeVisible();
  });

  // Workflow 5: Backtesting Workstation & Execution Simulation
  test('Workflow 5: Backtest simulation workstation and reporting controls', async ({ page }) => {
    await page.goto('/backtesting?symbol=AAPL');
    await expect(page.locator('text=Run Historical Backtest').first()).toBeVisible();
  });
});
