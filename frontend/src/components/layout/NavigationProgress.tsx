import React, { Suspense, Component, type ErrorInfo, type ReactNode } from 'react';
import { Spin, Result, Button } from 'antd';

const PAGE_SPINNER = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <Spin size="large" />
  </div>
);

interface ErrorBoundaryState {
  error: Error | null;
}

class PageErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary]', error, info.componentStack);
    (window as any).__PAGE_ERROR = error.message + ' | ' + (info.componentStack || '').substring(0, 300);
  }

  render() {
    if (this.state.error) {
      return (
        <Result
          status="error"
          title="Page Error"
          subTitle={this.state.error.message}
          extra={<Button onClick={() => window.location.reload()}>Reload</Button>}
        />
      );
    }
    return this.props.children;
  }
}

export const NavigationProgress: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PageErrorBoundary>
      {children}
    </PageErrorBoundary>
  );
};
