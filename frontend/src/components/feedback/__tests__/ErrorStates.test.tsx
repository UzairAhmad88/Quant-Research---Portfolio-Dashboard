import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModuleErrorState } from '../ModuleErrorState';
import { InsufficientDataState } from '../InsufficientDataState';
import { ProviderErrorState } from '../ProviderErrorState';
import { StaleDataBanner } from '../StaleDataBanner';
import { InlineError } from '../InlineError';

describe('Reusable UI Error and Resilience Components', () => {
  it('renders ModuleErrorState with error code, request ID, and retry handler', () => {
    const onRetry = vi.fn();
    render(
      <ModuleErrorState
        title="Volatility Calculation Failed"
        message="Matrix inversion error encountered during rolling analysis."
        code="CALCULATION_ERROR"
        requestId="req-xyz-987"
        details={{ matrix_size: 5, rank: 2 }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Volatility Calculation Failed')).toBeDefined();
    expect(screen.getByText('CALCULATION_ERROR')).toBeDefined();
    expect(screen.getByText(/req-xyz-987/i)).toBeDefined();

    // Toggle diagnostics
    const toggleBtn = screen.getByText('View Diagnostics');
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/matrix_size/i)).toBeDefined();

    // Click retry
    const retryBtn = screen.getByText('Retry Module');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders InsufficientDataState with required and available observation counts', () => {
    const onExpand = vi.fn();
    render(
      <InsufficientDataState
        title="Insufficient Returns for Volatility"
        metricName="annualized volatility"
        requiredObservations={30}
        availableObservations={12}
        dateRange="2024-01-01 to 2024-01-18"
        onExpandRange={onExpand}
      />
    );

    expect(screen.getByText('Insufficient Returns for Volatility')).toBeDefined();
    expect(screen.getByText('30')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText(/2024-01-01 to 2024-01-18/i)).toBeDefined();

    const expandBtn = screen.getByText(/Expand Date Range/i);
    fireEvent.click(expandBtn);
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('renders ProviderErrorState with rate limit indicator and cached data message', () => {
    const onRetry = vi.fn();
    render(
      <ProviderErrorState
        providerName="Yahoo Finance"
        isRateLimited={true}
        retryAfterSeconds={60}
        hasCachedData={true}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Yahoo Finance Unavailable')).toBeDefined();
    expect(screen.getByText('RATE_LIMITED')).toBeDefined();
    expect(screen.getByText(/retry recommended after 60s/i)).toBeDefined();
    expect(screen.getByText(/Previously validated historical observations/i)).toBeDefined();

    const retryBtn = screen.getByText('Retry Provider Sync');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders StaleDataBanner with observation timestamp and force refresh trigger', () => {
    const onRefresh = vi.fn();
    render(
      <StaleDataBanner
        lastUpdated="2024-02-15 16:00:00 UTC"
        warningMessage="Live quote feed unavailable. Showing latest validated database close."
        onRefresh={onRefresh}
      />
    );

    expect(screen.getByText(/Cached \/ Stale Data:/i)).toBeDefined();
    expect(screen.getByText(/Live quote feed unavailable/i)).toBeDefined();
    expect(screen.getByText(/2024-02-15 16:00:00 UTC/i)).toBeDefined();

    const refreshBtn = screen.getByText('Force Refresh');
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders InlineError with accessible role and message', () => {
    render(<InlineError field="Start Date" message="must precede end date" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeDefined();
    expect(alert.textContent).toContain('Start Date: must precede end date');
  });
});
