import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors in child components and displays a fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Layout>
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#d8b19f] bg-[#f6e1d8]">
                <AlertTriangle className="h-10 w-10 text-[#8a4f2a]" />
              </div>
              
              <h1 className="mb-4 text-3xl font-bold text-[#2c4632]">Something went wrong</h1>
              <p className="mb-8 text-[#6c5a3d]">
                We're sorry, but something unexpected happened. Please try again.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <div className="mb-8 rounded-lg border border-[#d7c7a8] bg-[#f7eddc] p-4 text-left">
                  <p className="mb-2 font-mono text-sm text-[#8a4f2a]">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-4">
                      <summary className="mb-2 cursor-pointer text-sm font-medium text-[#315f3b]">
                        Stack trace
                      </summary>
                      <pre className="overflow-auto rounded border border-[#e3d6ba] bg-[#fffaf0] p-4 text-xs text-[#5b4d37]">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button onClick={this.handleReset} variant="outline" className="border-[#d7c7a8] bg-[#fffaf0] text-[#315f3b] hover:bg-[#f4ead6]">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => (window.location.href = '/')} className="border border-[#c89b3a] bg-[#d89b2b] text-[#2f2513] hover:bg-[#c98c1d]">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </Layout>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;






