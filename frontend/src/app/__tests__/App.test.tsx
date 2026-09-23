import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App';

describe('Quant Research Dashboard App Shell & Design System', () => {
  it('renders application shell, top bar, and overview page', () => {
    render(<App />);
    expect(screen.getAllByText(/Quant Research/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Overview/i).length).toBeGreaterThan(0);
  });

  it('renders navigation section headers', () => {
    render(<App />);
    expect(screen.getAllByText(/RESEARCH/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ANALYSIS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/STRATEGIES/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SYSTEM/i).length).toBeGreaterThan(0);
  });
});
