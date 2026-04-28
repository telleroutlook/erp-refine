import React from 'react';
import { PageErrorBoundary } from '../../utils/loadable';

export const NavigationProgress: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PageErrorBoundary>
      {children}
    </PageErrorBoundary>
  );
};
