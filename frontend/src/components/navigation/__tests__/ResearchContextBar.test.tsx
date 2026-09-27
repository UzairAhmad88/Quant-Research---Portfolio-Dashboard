import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ResearchContextBar } from '../ResearchContextBar';
import { Breadcrumbs } from '../Breadcrumbs';

describe('Cross-Module Navigation Components', () => {
  it('renders ResearchContextBar with default active preset and price source buttons', () => {
    render(
      <BrowserRouter>
        <ResearchContextBar
          availableInstruments={[
            { id: 'inst-1', symbol: 'AAPL', name: 'Apple Inc.' },
            { id: 'inst-2', symbol: 'MSFT', name: 'Microsoft Corp.' },
          ]}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/Research Context:/i)).toBeDefined();
    expect(screen.getByText(/AAPL — Apple Inc./i)).toBeDefined();
    expect(screen.getByText(/5Y/i)).toBeDefined();
    expect(screen.getByText(/Adjusted/i)).toBeDefined();
    expect(screen.getByText(/Reset Context/i)).toBeDefined();
  });

  it('renders hierarchical Breadcrumbs navigation items correctly', () => {
    render(
      <BrowserRouter>
        <Breadcrumbs
          items={[
            { label: 'Backtesting', route: '/backtesting' },
            { label: 'AAPL' },
            { label: 'Backtest #12345678' },
          ]}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/Dashboard/i)).toBeDefined();
    expect(screen.getByText(/Backtesting/i)).toBeDefined();
    expect(screen.getByText(/AAPL/i)).toBeDefined();
    expect(screen.getByText(/Backtest #12345678/i)).toBeDefined();
  });
});
