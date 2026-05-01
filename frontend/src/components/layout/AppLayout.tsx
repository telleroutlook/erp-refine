import React, { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { Layout, Button, Tooltip, Spin, Drawer, Grid, theme } from 'antd';
import { RobotOutlined, RightOutlined } from '@ant-design/icons';
import { ThemedLayoutContextProvider, useThemedLayoutContext } from '@refinedev/antd';
import { useTranslate } from '@refinedev/core';
import { Sider } from './Sider';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';
import type { MobilePanel } from '../../hooks/useMobileLayout';

const AiSidebar = lazy(() => import('../ai/AiSidebar').then(m => ({ default: m.AiSidebar })));

const SIDEBAR_MIN = 260;
const SIDEBAR_MAX = 640;
const SIDEBAR_DEFAULT = 360;
const HANDLE_W = 5;
const STORAGE_KEY = 'erp_ai_sidebar_width';
const COLLAPSED_KEY = 'erp_ai_sidebar_collapsed';

const AI_FALLBACK = (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <Spin size="small" />
  </div>
);

const MobileLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('content');
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const { setMobileSiderOpen } = useThemedLayoutContext();

  const handleMobileSwitch = useCallback((panel: MobilePanel) => {
    setMobilePanel(panel);
    if (panel === 'nav') {
      setMobileSiderOpen(true);
      setAiDrawerOpen(false);
    } else if (panel === 'ai') {
      setAiDrawerOpen(true);
      setMobileSiderOpen(false);
    } else {
      setAiDrawerOpen(false);
      setMobileSiderOpen(false);
    }
  }, [setMobileSiderOpen]);

  const closeAi = useCallback(() => {
    setAiDrawerOpen(false);
    setMobilePanel('content');
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <Layout style={{ flex: 1, minHeight: 0 }} hasSider>
        <Sider />
        <Layout>
          <Header />
          <Layout.Content className="erp-main-content" style={{ overflow: 'auto' }}>
            <div className="erp-content-area" style={{ minHeight: 200, padding: 'var(--content-padding)' }}>
              {children}
            </div>
          </Layout.Content>
        </Layout>
      </Layout>

      <Drawer
        open={aiDrawerOpen}
        onClose={closeAi}
        placement="bottom"
        height="100dvh"
        closable={false}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          <Suspense fallback={AI_FALLBACK}>
            <AiSidebar onClose={closeAi} />
          </Suspense>
        </div>
      </Drawer>

      <MobileTabBar activePanel={mobilePanel} onSwitch={handleMobileSwitch} />
    </div>
  );
};

export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { token } = theme.useToken();
  const translate = useTranslate();
  const breakpoint = Grid.useBreakpoint();
  const isMobile = typeof breakpoint.lg === 'undefined' ? false : !breakpoint.lg;

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return isNaN(parsed) ? SIDEBAR_DEFAULT : Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, parsed));
  });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const currentWidth = useRef(sidebarWidth);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentWidth.current = sidebarWidth;
  }, [sidebarWidth]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = currentWidth.current;
    setIsDragging(true);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    dragStartWidth.current = currentWidth.current;
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const delta = dragStartX.current - e.clientX;
      const next = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, dragStartWidth.current + delta));
      currentWidth.current = next;
      if (sidebarRef.current) sidebarRef.current.style.width = `${next}px`;
      if (toggleRef.current) toggleRef.current.style.right = `${next + HANDLE_W + 4}px`;
    };

    const onTouchMove = (e: TouchEvent) => {
      const delta = dragStartX.current - e.touches[0].clientX;
      const next = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, dragStartWidth.current + delta));
      currentWidth.current = next;
      if (sidebarRef.current) sidebarRef.current.style.width = `${next}px`;
      if (toggleRef.current) toggleRef.current.style.right = `${next + HANDLE_W + 4}px`;
    };

    const onEnd = () => {
      setIsDragging(false);
      setSidebarWidth(currentWidth.current);
      localStorage.setItem(STORAGE_KEY, String(currentWidth.current));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const transition = isDragging ? 'none' : 'width 0.25s var(--ease-spring)';

  if (isMobile) {
    return (
      <ThemedLayoutContextProvider>
        <MobileLayout>{children}</MobileLayout>
      </ThemedLayoutContextProvider>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', transition }}>
        <ThemedLayoutContextProvider>
          <Layout style={{ minHeight: '100vh' }} hasSider>
            <Sider />
            <Layout>
              <Header />
              <Layout.Content>
                <div className="erp-content-area" style={{ minHeight: 360, padding: 'var(--content-padding)' }}>
                  {children}
                </div>
              </Layout.Content>
            </Layout>
          </Layout>
        </ThemedLayoutContextProvider>
      </div>

      {!collapsed && (
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          style={{
            width: HANDLE_W,
            cursor: 'col-resize',
            flexShrink: 0,
            background: isDragging ? 'var(--ai-drag-bg)' : 'transparent',
            position: 'relative',
            zIndex: 10,
            transition: 'background 0.15s',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 2,
            height: isDragging ? 80 : 40,
            background: isDragging ? 'var(--ai-primary)' : token.colorBorder,
            borderRadius: 2,
            transition: 'height 0.15s, background 0.15s',
          }} />
        </div>
      )}

      <div ref={toggleRef} style={{
        position: 'absolute',
        right: collapsed ? 4 : sidebarWidth + HANDLE_W + 4,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        transition,
      }}>
        <Tooltip title={translate(collapsed ? 'layout.openAi' : 'layout.closeAi')} placement="left">
          <Button
            type="primary"
            shape="circle"
            size="small"
            icon={collapsed ? <RobotOutlined /> : <RightOutlined />}
            onClick={toggleCollapsed}
            style={{
              background: 'var(--ai-primary)',
              borderColor: 'var(--ai-primary)',
              boxShadow: 'var(--ai-glow)',
              width: 36,
              height: 36,
              minWidth: 36,
              fontSize: 14,
            }}
          />
        </Tooltip>
      </div>

      {!collapsed && (
        <div ref={sidebarRef} style={{
          width: sidebarWidth,
          flexShrink: 0,
          borderLeft: `1px solid ${token.colorBorderSecondary}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition,
        }}>
          <Suspense fallback={AI_FALLBACK}>
            <AiSidebar />
          </Suspense>
        </div>
      )}
    </div>
  );
};
