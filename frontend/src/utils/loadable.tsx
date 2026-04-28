import React, { useState, useEffect, useRef } from 'react';
import { Spin } from 'antd';

type ComponentModule = { default: React.ComponentType<any> };
type Loader = () => Promise<ComponentModule>;

const PAGE_SPINNER = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <Spin size="large" />
  </div>
);

export function loadable(loader: Loader): React.FC {
  let cached: React.ComponentType<any> | null = null;
  let promise: Promise<ComponentModule> | null = null;

  const Loadable: React.FC = (props) => {
    const [Component, setComponent] = useState<React.ComponentType<any> | null>(cached);
    const mounted = useRef(true);

    useEffect(() => {
      mounted.current = true;
      if (cached) {
        setComponent(() => cached);
        return;
      }
      if (!promise) {
        promise = loader();
      }
      promise.then((mod) => {
        cached = mod.default;
        if (mounted.current) {
          setComponent(() => mod.default);
        }
      });
      return () => { mounted.current = false; };
    }, []);

    if (Component) {
      return <Component {...props} />;
    }
    return PAGE_SPINNER;
  };

  return Loadable;
}
