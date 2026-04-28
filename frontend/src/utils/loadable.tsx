import React, { Suspense } from 'react';
import { Spin, Result, Button } from 'antd';
import type { ErrorInfo, ReactNode } from 'react';

type Loader = () => Promise<{ default: React.ComponentType<any> }>;

const PAGE_SPINNER = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <Spin size="large" />
  </div>
);

interface ErrorBoundaryState {
  error: Error | null;
}

export class PageErrorBoundary extends React.Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Result
          status="error"
          title="Page Error"
          subTitle={this.state.error.message}
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}

export function loadable(loader: Loader): React.FC {
  const LazyComponent = React.lazy(loader);

  const Loadable: React.FC = (props) => (
    <PageErrorBoundary>
      <Suspense fallback={PAGE_SPINNER}>
        <LazyComponent {...props} />
      </Suspense>
    </PageErrorBoundary>
  );

  return Loadable;
}
