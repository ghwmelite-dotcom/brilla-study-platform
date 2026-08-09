import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
          <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-card text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-ghana flex items-center justify-center">
              <span className="text-white font-bold text-2xl">B</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-neutral-500 mb-6">
              An unexpected error occurred. Your progress is saved — try reloading the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all shadow-md"
              >
                Reload page
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full py-3 px-4 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-all"
              >
                Go to home
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
