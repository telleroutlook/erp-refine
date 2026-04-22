import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Spin } from 'antd';

const PAGE_SPINNER = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <Spin size="large" />
  </div>
);

function ProgressBar({ loading }: { loading: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (loading) {
      setState('loading');
      if (timerRef.current) clearTimeout(timerRef.current);
    } else if (state === 'loading') {
      setState('done');
      timerRef.current = setTimeout(() => setState('idle'), 350);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [loading]);

  if (state === 'idle') return null;

  return (
    <div
      className={`erp-nav-progress erp-nav-progress--${state}`}
    />
  );
}

function SuspenseDetector({ onSuspense, children }: { onSuspense: (suspended: boolean) => void; children: React.ReactNode }) {
  useEffect(() => {
    onSuspense(false);
  });
  return <>{children}</>;
}

export const NavigationProgress: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSuspended, setIsSuspended] = useState(false);

  const handleSuspense = useCallback((suspended: boolean) => {
    setIsSuspended(suspended);
  }, []);

  return (
    <>
      <ProgressBar loading={isSuspended} />
      <Suspense
        fallback={
          <SuspenseFallbackNotifier onFallback={() => setIsSuspended(true)}>
            {PAGE_SPINNER}
          </SuspenseFallbackNotifier>
        }
      >
        <SuspenseDetector onSuspense={handleSuspense}>
          <div key={location.pathname} className="erp-page-enter">
            {children}
          </div>
        </SuspenseDetector>
      </Suspense>
    </>
  );
};

function SuspenseFallbackNotifier({ onFallback, children }: { onFallback: () => void; children: React.ReactNode }) {
  useEffect(() => {
    onFallback();
  }, [onFallback]);
  return <>{children}</>;
}
