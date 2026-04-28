import React, { Suspense } from 'react';
import { Spin, Result, Button } from 'antd';

type Loader = () => Promise<{ default: React.ComponentType<any> }>;

const PAGE_SPINNER = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <Spin size="large" />
  </div>
);

class LoadableErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Page Error"
          subTitle="Something went wrong rendering this page."
          extra={
            <Button type="primary" onClick={() => this.setState({ hasError: false })}>
              Retry
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
    <LoadableErrorBoundary>
      <Suspense fallback={PAGE_SPINNER}>
        <LazyComponent {...props} />
      </Suspense>
    </LoadableErrorBoundary>
  );

  return Loadable;
}
