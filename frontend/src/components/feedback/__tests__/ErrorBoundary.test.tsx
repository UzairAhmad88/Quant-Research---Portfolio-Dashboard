import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalErrorBoundary, ModuleErrorBoundary } from '../ErrorBoundary';

const CrashComponent: React.FC<{ shouldCrash?: boolean; message?: string }> = ({
  shouldCrash = true,
  message = 'Simulated rendering explosion',
}) => {
  if (shouldCrash) {
    throw new Error(message);
  }
  return <div>Component Rendered Normally</div>;
};

describe('Frontend Error Boundaries', () => {
  // Suppress console.error in test output for expected intentional render errors
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  describe('GlobalErrorBoundary', () => {
    it('renders normal children when no error occurs', () => {
      render(
        <GlobalErrorBoundary>
          <div>Dashboard Content</div>
        </GlobalErrorBoundary>
      );
      expect(screen.getByText('Dashboard Content')).toBeDefined();
    });

    it('catches render errors and displays institutional crash screen', () => {
      render(
        <GlobalErrorBoundary>
          <CrashComponent message="Critical root explosion" />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Application Rendering Error')).toBeDefined();
      expect(screen.getByText(/Critical root explosion/i)).toBeDefined();
      expect(screen.getByText('Reload Dashboard')).toBeDefined();
      expect(screen.getByText('Try Again')).toBeDefined();
    });
  });

  describe('ModuleErrorBoundary', () => {
    it('renders normal module children when healthy', () => {
      render(
        <ModuleErrorBoundary moduleName="Correlation Module">
          <div>Correlation Heatmap Active</div>
        </ModuleErrorBoundary>
      );
      expect(screen.getByText('Correlation Heatmap Active')).toBeDefined();
    });

    it('isolates module-level crash without crashing parent', () => {
      const handleReset = vi.fn();
      render(
        <div>
          <nav>Sidebar Navigation (Always Operational)</nav>
          <ModuleErrorBoundary moduleName="Backtest Engine" onReset={handleReset}>
            <CrashComponent message="Backtest calculation matrix failed" />
          </ModuleErrorBoundary>
        </div>
      );

      // Parent navigation remains 100% active and rendered
      expect(screen.getByText('Sidebar Navigation (Always Operational)')).toBeDefined();

      // Module boundary displays isolated error
      expect(screen.getByText('Backtest Engine Error')).toBeDefined();
      expect(screen.getByText(/Backtest calculation matrix failed/i)).toBeDefined();

      // Clicking reset calls onReset
      const resetButton = screen.getByText('Reset Backtest Engine');
      fireEvent.click(resetButton);
      expect(handleReset).toHaveBeenCalled();
    });
  });
});
