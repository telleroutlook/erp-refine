import { useState, useCallback } from 'react';
import { Grid } from 'antd';

export type MobilePanel = 'nav' | 'content' | 'ai';

export function useMobileLayout() {
  const breakpoint = Grid.useBreakpoint();
  const isMobile = typeof breakpoint.lg === 'undefined' ? false : !breakpoint.lg;

  const [activePanel, setActivePanel] = useState<MobilePanel>('content');

  const switchTo = useCallback((panel: MobilePanel) => {
    setActivePanel(panel);
  }, []);

  return { isMobile, activePanel, switchTo };
}
