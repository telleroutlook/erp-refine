import React, { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { Layout, Button, Tooltip, Spin, Drawer, Grid, theme } from 'antd';
import { RobotOutlined, RightOutlined, CloseOutlined } from '@ant-design/icons';
import { ThemedLayoutContextProvider } from '@refinedev/antd';
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

export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { token } = theme.useToken();
  const breakpoint = Grid.useBreakpoint();
  const isMobile = typeof breakpoint.lg === 'undefined' ? false : !breakpoint.lg;

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  });
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : SIDEBAR_DEFAULT;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('content');
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const currentWidth = useRef(sidebarWidth);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentWidth.current = sidebarWidth;
  }, [sidebarWidth]);

  // Mouse drag for desktop
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = currentWidth.current;
    setIsDragging(true);
  }, []);

  // Touch drag for tablet
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

  const handleMobileSwitch = useCallback((panel: MobilePanel) => {
    setMobilePanel(panel);
    if (panel === 'ai') {
      setAiDrawerOpen(true);
    } else {
      setAiDrawerOpen(false);
    }
  }, []);

  const transition = isDragging ? 'none' : 'width 0.25s var(--ease-spring)';

  // ── Mobile layout ──
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <ThemedLayoutContextProvider>
          <Layout style={{ flex: 1, minHeight: 0 }} hasSider>
            <Sider />
            <Layout>
              <Header />
              <Layout.Content className="erp-main-content" style={{ overflow: 'auto' }}>
                <div className="erp-content-area" style={{ minHeight: 200, padding: 12 }}>
                  {children}
                </div>
              </Layout.Content>
            </Layout>
          </Layout>
        </ThemedLayoutContextProvider>

        {/* AI Drawer — bottom sheet */}
        <Drawer
          open={aiDrawerOpen}
          onClose={() => { setAiDrawerOpen(false); setMobilePanel('content'); }}
          placement="bottom"
          height="85dvh"
          closable={false}
          styles={{
            body: { padding: 0, display: 'flex', flexDirection: 'column' },
            wrapper: { borderRadius: '16px 16px 0 0' },
          }}
          style={{ borderRadius: '16px 16px 0 0' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px 8px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: token.colorText }}>AI Assistant</span>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => { setAiDrawerOpen(false); setMobilePanel('content'); }}
            />
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spin size="small" /></div>}>
              <AiSidebar />
            </Suspense>
          </div>
        </Drawer>

        <MobileTabBar activePanel={mobilePanel} onSwitch={handleMobileSwitch} />
      </div>
    );
  }

  // ── Desktop layout ──
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Main content area */}
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

      {/* Resize handle */}
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

      {/* Toggle button */}
      <div ref={toggleRef} style={{
        position: 'absolute',
        right: collapsed ? 4 : sidebarWidth + HANDLE_W + 4,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        transition,
      }}>
        <Tooltip title={collapsed ? '打开 AI 助手' : '关闭 AI 助手'} placement="left">
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
              width: 28,
              height: 28,
              minWidth: 28,
              fontSize: 12,
            }}
          />
        </Tooltip>
      </div>

      {/* AI Sidebar */}
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
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spin size="small" /></div>}>
            <AiSidebar />
          </Suspense>
        </div>
      )}
    </div>
  );
};
