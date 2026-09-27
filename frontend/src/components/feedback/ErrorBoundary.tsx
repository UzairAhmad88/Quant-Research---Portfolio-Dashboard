import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Top-Level Global Error Boundary.
 * Catches catastrophic unhandled rendering crashes at the app root level.
 */
export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GlobalErrorBoundary caught an unhandled rendering error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0B1220] text-[#E5E7EB] flex items-center justify-center p-6">
          <div className="max-w-lg w-full p-8 rounded-lg border border-[#EF4444]/40 bg-[#111827] shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight mb-2">Application Rendering Error</h1>
            <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
              An unexpected error prevented the quantitative interface from displaying.
              No portfolio or market data records were modified.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 rounded bg-[#151F2E] border border-[#263244] text-left overflow-auto max-h-36">
                <p className="text-xs font-mono text-[#F87171] break-words">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={this.handleReset}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Try Again
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={this.handleReload}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Reload Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Module-Level Error Boundary.
 * Isolates individual panel/module rendering crashes (e.g. Correlation, Backtesting, Returns)
 * so that navigation, sidebar, and other modules remain fully operational.
 */
export class ModuleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const mod = this.props.moduleName || 'Module';
    console.error(`ModuleErrorBoundary [${mod}] caught rendering error:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const mod = this.props.moduleName || 'Analytical Module';

      return (
        <div className="p-8 rounded-lg border border-[#EF4444]/30 bg-[#151F2E] text-center my-4">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#EF4444]/10 text-[#F87171] flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[#E5E7EB] mb-1">
            {mod} Error
          </h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto mb-4 leading-relaxed">
            The {mod} encountered a display or calculation rendering issue. Other workstation modules and research navigation remain unaffected.
          </p>

          {this.state.error && (
            <div className="mb-4 p-2.5 rounded bg-[#111827] border border-[#263244] max-w-md mx-auto text-left">
              <p className="text-[11px] font-mono text-[#F87171] truncate">
                {this.state.error.message || 'Render failure'}
              </p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reset {mod}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
