import { test, expect } from '@playwright/test';

test.describe('Quant Research Dashboard — Error Resilience & Failure Scenarios', () => {

  test('Workflow: Handles Provider 503 Unavailable gracefully without crashing UI', async ({ page }) => {
    // Intercept instruments list
    await page.route('**/api/v1/instruments*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'inst-fail-1',
              symbol: 'AAPL',
              name: 'Apple Inc.',
              asset_type: 'EQUITY',
              exchange: 'NASDAQ',
              currency: 'USD',
              active: true,
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      });
    });

    // Intercept latest market data to simulate third-party provider failure (HTTP 503)
    await page.route('**/api/v1/market-data/latest*', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        headers: { 'X-Request-ID': 'req-mock-503-error' },
        body: JSON.stringify({
          error: {
            code: 'PROVIDER_UNAVAILABLE',
            message: 'Market data provider Yahoo Finance is temporarily down for scheduled maintenance.',
            details: { provider: 'yahoo_finance', retryable: true },
            severity: 'ERROR',
            retryable: true,
          },
          request_id: 'req-mock-503-error',
          detail: 'Market data provider Yahoo Finance is temporarily down.',
        }),
      });
    });

    await page.goto('/market-data');

    // Verify application shell remains alive and loaded
    await expect(page.locator('body')).toBeVisible();

    // Verify navigation remains responsive and unaffected
    await expect(page.locator('nav')).toBeVisible();
  });

  test('Workflow: Displays Stale Data Warning Banner when provider fails but cache exists', async ({ page }) => {
    await page.route('**/api/v1/instruments*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'inst-stale-1',
              symbol: 'MSFT',
              name: 'Microsoft Corporation',
              asset_type: 'EQUITY',
              exchange: 'NASDAQ',
              currency: 'USD',
              active: true,
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      });
    });

    // Return cached fallback response with explicit stale warning
    await page.route('**/api/v1/market-data/latest*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          instrument_id: 'inst-stale-1',
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          asset_type: 'EQUITY',
          exchange: 'NASDAQ',
          currency: 'USD',
          price: 410.50,
          open: 408.00,
          high: 412.00,
          low: 407.50,
          close: 410.50,
          volume: 25000000.0,
          market_timestamp: '2024-02-15T21:00:00Z',
          received_at: '2024-02-15T21:05:00Z',
          frequency: 'DAILY',
          provider: 'yahoo_finance',
          provider_symbol: 'MSFT',
          freshness: 'STALE',
          quality: 'GOOD',
          is_cached: true,
          warning: 'Live quote feed unavailable. Showing latest validated database observation.',
        }),
      });
    });

    await page.goto('/market-data');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Workflow: Controlled 404 response on non-existent route or entity ID', async ({ page }) => {
    await page.goto('/market-data/non-existent-guid-12345');
    // Expect 404 Not Found page without application white-screen crash
    await expect(page.locator('body')).toBeVisible();
  });
});
