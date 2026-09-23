import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App';

describe('Quant Research Dashboard App Foundation', () => {
  it('renders application shell and overview page', () => {
    render(<App />);
    expect(screen.getAllByText(/Quant Research/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Platform Overview/i)).toBeDefined();
  });
});
