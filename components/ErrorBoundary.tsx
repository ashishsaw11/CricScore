import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Replaced class property state initialization with a constructor to correctly initialize props and state. This resolves an error where `this.props` was not being found.
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service or console
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render a custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 text-center bg-light-gray dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-medium-gray dark:border-gray-700 max-w-lg">
                <h1 className="text-2xl font-bold text-classic-red mb-4">Oops! Something went wrong.</h1>
                <p className="text-dark-gray dark:text-gray-300 mb-4">
                    An unexpected error occurred, and the application has been paused to prevent further issues. Please try refreshing the page.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    If the problem persists, please check the developer console for more details or contact support.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    <strong>Error:</strong> {this.state.error?.message || 'An unknown error occurred.'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 w-full bg-classic-blue text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300"
                >
                    Refresh Page
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
