import React, { useState, useEffect } from 'react';
import { Layout, Drawer, Button, Grid } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  siderContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  siderWidth?: number;
  collapsible?: boolean;
  theme?: 'light' | 'dark';
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  siderContent,
  headerContent,
  siderWidth = 256,
  collapsible = true,
  theme = 'light'
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const screens = useBreakpoint();

  // 判断是否为移动端
  const isMobile = !screens.md;

  useEffect(() => {
    // 在移动端自动收起侧边栏
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const toggleCollapsed = () => {
    if (isMobile) {
      setMobileDrawerVisible(!mobileDrawerVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const siderProps = {
    width: siderWidth,
    collapsedWidth: isMobile ? 0 : 80,
    collapsed: isMobile ? false : collapsed,
    theme,
    style: {
      overflow: 'auto',
      height: '100vh',
      position: 'fixed' as const,
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100
    }
  };

  const contentStyle = {
    marginLeft: isMobile ? 0 : (collapsed ? 80 : siderWidth),
    minHeight: '100vh',
    transition: 'margin-left 0.2s ease'
  };

  const headerStyle = {
    background: '#ffffff', // 强制使用白色背景
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e8e8e8',
    position: 'sticky' as const,
    top: 0,
    zIndex: 99,
    marginLeft: isMobile ? 0 : (collapsed ? 80 : siderWidth),
    transition: 'margin-left 0.2s ease',
    color: '#333333'
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 桌面端侧边栏 */}
      {!isMobile && siderContent && (
        <Sider {...siderProps}>
          {siderContent}
        </Sider>
      )}

      {/* 移动端抽屉 */}
      {isMobile && siderContent && (
        <Drawer
          title="菜单"
          placement="left"
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          styles={{ body: { padding: 0 } }}
          width={siderWidth}
        >
          {siderContent}
        </Drawer>
      )}

      <Layout>
        {/* 头部 */}
        {(headerContent || collapsible) && (
          <Header style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {collapsible && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={toggleCollapsed}
                  style={{ marginRight: 16 }}
                />
              )}
              {headerContent}
            </div>
          </Header>
        )}

        {/* 内容区域 */}
        <Content style={contentStyle}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

// 响应式容器组件
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  maxWidth?: number;
  padding?: number | string;
  centered?: boolean;
}> = ({ 
  children, 
  maxWidth = 1200, 
  padding = 24,
  centered = true 
}) => {
  const screens = useBreakpoint();
  
  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: maxWidth,
    padding: typeof padding === 'number' ? 
      (screens.xs ? padding / 2 : padding) : 
      padding,
    margin: centered ? '0 auto' : undefined
  };

  return (
    <div style={containerStyle}>
      {children}
    </div>
  );
};

// 响应式网格组件
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  gutter?: number | [number, number];
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
}> = ({ 
  children, 
  gutter = [16, 16],
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }
}) => {
  const screens = useBreakpoint();
  
  // 根据屏幕大小确定列数
  const getColumns = () => {
    if (screens.xxl && cols.xxl) return cols.xxl;
    if (screens.xl && cols.xl) return cols.xl;
    if (screens.lg && cols.lg) return cols.lg;
    if (screens.md && cols.md) return cols.md;
    if (screens.sm && cols.sm) return cols.sm;
    return cols.xs || 1;
  };

  const columns = getColumns();
  const childrenArray = React.Children.toArray(children);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: Array.isArray(gutter) ? `${gutter[1]}px ${gutter[0]}px` : `${gutter}px`,
        width: '100%'
      }}
    >
      {childrenArray.map((child, index) => (
        <div key={index} className="fade-in">
          {child}
        </div>
      ))}
    </div>
  );
};

// 响应式文本组件
export const ResponsiveText: React.FC<{
  children: React.ReactNode;
  size?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  weight?: number | string;
  color?: string;
}> = ({ 
  children, 
  size = { xs: 14, sm: 16, md: 16, lg: 18 },
  weight,
  color 
}) => {
  const screens = useBreakpoint();
  
  const getFontSize = () => {
    if (screens.lg && size.lg) return size.lg;
    if (screens.md && size.md) return size.md;
    if (screens.sm && size.sm) return size.sm;
    return size.xs || 14;
  };

  return (
    <span
      style={{
        fontSize: getFontSize(),
        fontWeight: weight,
        color: color
      }}
    >
      {children}
    </span>
  );
};

// 响应式间距组件
export const ResponsiveSpace: React.FC<{
  size?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  direction?: 'horizontal' | 'vertical';
}> = ({ 
  size = { xs: 8, sm: 16, md: 24, lg: 32 },
  direction = 'vertical'
}) => {
  const screens = useBreakpoint();
  
  const getSpacing = () => {
    if (screens.lg && size.lg) return size.lg;
    if (screens.md && size.md) return size.md;
    if (screens.sm && size.sm) return size.sm;
    return size.xs || 8;
  };

  const spacing = getSpacing();

  return (
    <div
      style={{
        width: direction === 'horizontal' ? spacing : '100%',
        height: direction === 'vertical' ? spacing : '100%'
      }}
    />
  );
};

export default ResponsiveLayout;
