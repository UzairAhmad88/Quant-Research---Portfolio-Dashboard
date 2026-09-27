import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LatestMarketDataPanel } from '../LatestMarketDataPanel';
import { LatestMarketDataResponse } from '../../../lib/apiClient';

describe('LatestMarketDataPanel Component', () => {
  const mockData: LatestMarketDataResponse = {
    instrument_id: 'test-inst-1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    asset_type: 'EQUITY',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 224.5,
    open: 220.0,
    high: 225.0,
    low: 219.0,
    close: 224.5,
    adjusted_close: 224.5,
    volume: 52000000,
    previous_close: 220.0,
    change: 4.5,
    change_pct: 0.02045,
    market_timestamp: '2026-09-25T20:00:00Z',
    received_at: '2026-09-25T20:01:30Z',
    frequency: 'DAILY',
    provider: 'yahoo_finance',
    provider_symbol: 'AAPL',
    freshness: 'CURRENT',
    quality: 'GOOD',
    is_cached: false,
  };

  it('renders price, change, volume, and provenance correctly', () => {
    render(<LatestMarketDataPanel data={mockData} />);

    expect(screen.getAllByText(/\$224.50/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\+4.50/i)).toBeDefined();
    expect(screen.getByText(/CURRENT/i)).toBeDefined();
    expect(screen.getByText(/YAHOO FINANCE/i)).toBeDefined();
    expect(screen.getByText(/52.00M/i)).toBeDefined();
  });


  it('renders warning banner when provider warning is returned', () => {
    const dataWithWarning: LatestMarketDataResponse = {
      ...mockData,
      is_cached: true,
      warning: 'Provider temporarily unavailable. Showing the most recent validated observation.',
    };

    render(<LatestMarketDataPanel data={dataWithWarning} />);

    expect(
      screen.getByText(/Provider temporarily unavailable. Showing the most recent validated observation./i)
    ).toBeDefined();
  });

  it('triggers onRefresh callback when refresh button is clicked', () => {
    const onRefreshMock = vi.fn();
    render(<LatestMarketDataPanel data={mockData} onRefresh={onRefreshMock} />);

    const refreshButton = screen.getByRole('button', { name: /Refresh Latest/i });
    fireEvent.click(refreshButton);
    expect(onRefreshMock).toHaveBeenCalledTimes(1);
  });

  it('renders loading state properly', () => {
    render(<LatestMarketDataPanel isLoading={true} />);
    expect(screen.getByText(/Retrieving latest validated observation.../i)).toBeDefined();
  });

  it('renders error state properly', () => {
    render(<LatestMarketDataPanel error={new Error('Provider rate limited')} />);
    expect(screen.getByText(/Observation Unavailable:/i)).toBeDefined();
    expect(screen.getByText(/Provider rate limited/i)).toBeDefined();
  });
});
