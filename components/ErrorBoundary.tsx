import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-fadeIn">
          <div className="bg-rose-100 dark:bg-rose-900/30 p-4 rounded-full mb-4">
            <svg className="w-12 h-12 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">發生了一些錯誤</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md">
            應用程式遇到預期外的狀況。請嘗試重新整理頁面。
            <br />
            <span className="text-xs text-slate-400 mt-2 block font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded text-left overflow-auto max-w-full">
                {this.state.error?.message}
            </span>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold transition-colors shadow-lg"
          >
            重新整理頁面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;