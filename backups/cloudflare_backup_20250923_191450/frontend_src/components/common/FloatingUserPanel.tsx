/**
 * 半匿名用户浮窗组件
 * 支持四个角移动，适用于A+B用户类型
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, Avatar, Button, Space, Tooltip, Dropdown } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  DragOutlined,
  CloseOutlined,
  MinusOutlined,
  ExpandOutlined,
  CompressOutlined
} from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import styles from './FloatingUserPanel.module.css';

type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface FloatingUserPanelProps {
  /** 初始位置 */
  initialPosition?: CornerPosition;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否显示最小化按钮 */
  showMinimize?: boolean;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
}

export const FloatingUserPanel: React.FC<FloatingUserPanelProps> = ({
  initialPosition = 'bottom-right',
  draggable = true,
  showMinimize = true,
  showClose = true,
  onClose
}) => {
  // 完全禁用组件以解决问题
  console.log('FloatingUserPanel: 组件已禁用');
  return null;
  const [position, setPosition] = useState<CornerPosition>(initialPosition);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // 获取位置样式
  const getPositionStyle = () => {
    const baseStyle = {
      position: 'fixed' as const,
      zIndex: 1000,
      transition: isDragging ? 'none' : 'all 0.3s ease'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: 20, left: 20 };
      case 'top-right':
        return { ...baseStyle, top: 20, right: 20 };
      case 'bottom-left':
        return { ...baseStyle, bottom: 20, left: 20 };
      case 'bottom-right':
      default:
        return { ...baseStyle, bottom: 20, right: 20 };
    }
  };

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !panelRef.current) return;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // 限制在视窗内
    const maxX = window.innerWidth - panelRef.current.offsetWidth;
    const maxY = window.innerHeight - panelRef.current.offsetHeight;
    
    const clampedX = Math.max(0, Math.min(x, maxX));
    const clampedY = Math.max(0, Math.min(y, maxY));
    
    panelRef.current.style.left = `${clampedX}px`;
    panelRef.current.style.top = `${clampedY}px`;
    panelRef.current.style.right = 'auto';
    panelRef.current.style.bottom = 'auto';
  };

  const handleMouseUp = () => {
    if (!isDragging || !panelRef.current) return;
    
    setIsDragging(false);
    
    // 自动吸附到最近的角
    const rect = panelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const isLeft = centerX < window.innerWidth / 2;
    const isTop = centerY < window.innerHeight / 2;
    
    let newPosition: CornerPosition;
    if (isTop && isLeft) {
      newPosition = 'top-left';
    } else if (isTop && !isLeft) {
      newPosition = 'top-right';
    } else if (!isTop && isLeft) {
      newPosition = 'bottom-left';
    } else {
      newPosition = 'bottom-right';
    }
    
    setPosition(newPosition);
    
    // 重置样式
    panelRef.current.style.left = '';
    panelRef.current.style.top = '';
    panelRef.current.style.right = '';
    panelRef.current.style.bottom = '';
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '退出登录',
      onClick: logout
    }
  ];

  if (!currentUser) return null;

  return (
    <div
      ref={panelRef}
      className={`${styles.floatingPanel} ${isMinimized ? styles.minimized : ''} ${isExpanded ? styles.expanded : ''}`}
      style={getPositionStyle()}
    >
      <Card
        size="small"
        className={styles.card}
        styles={{ body: { padding: isMinimized ? '8px' : '12px' } }}
      >
        {/* 拖拽手柄和控制按钮 */}
        <div className={styles.header}>
          {draggable && (
            <div
              ref={dragRef}
              className={styles.dragHandle}
              onMouseDown={handleMouseDown}
            >
              <DragOutlined />
            </div>
          )}
          
          <div className={styles.controls}>
            {showMinimize && (
              <Tooltip title={isMinimized ? '展开' : '最小化'}>
                <Button
                  type="text"
                  size="small"
                  icon={isMinimized ? <ExpandOutlined /> : <MinusOutlined />}
                  onClick={() => setIsMinimized(!isMinimized)}
                  className={styles.controlButton}
                />
              </Tooltip>
            )}
            
            <Tooltip title={isExpanded ? '收起' : '展开详情'}>
              <Button
                type="text"
                size="small"
                icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => setIsExpanded(!isExpanded)}
                className={styles.controlButton}
              />
            </Tooltip>
            
            {showClose && (
              <Tooltip title="关闭">
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={onClose}
                  className={styles.controlButton}
                />
              </Tooltip>
            )}
          </div>
        </div>

        {/* 用户信息 */}
        {!isMinimized && (
          <div className={styles.content}>
            <div className={styles.userInfo}>
              <Avatar
                size={isExpanded ? 'large' : 'default'}
                icon={<UserOutlined />}
                className={styles.avatar}
              />
              
              <div className={styles.userDetails}>
                <div className={styles.userName}>
                  {currentUser?.displayName || '匿名用户'}
                </div>

                {isExpanded && (
                  <>
                    <div className={styles.userType}>
                      {currentUser?.userType === 'A' ? 'A类用户' : 'B类用户'}
                    </div>
                    <div className={styles.userStatus}>
                      在线
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 扩展信息 */}
            {isExpanded && (
              <div className={styles.expandedContent}>
                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>问卷完成</span>
                    <span className={styles.statValue}>3</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>故事分享</span>
                    <span className={styles.statValue}>1</span>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className={styles.actions}>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="top"
                trigger={['click']}
              >
                <Button type="primary" size="small" block>
                  用户菜单
                </Button>
              </Dropdown>
            </div>
          </div>
        )}

        {/* 最小化状态显示 */}
        {isMinimized && (
          <div className={styles.minimizedContent}>
            <Avatar
              size="small"
              icon={<UserOutlined />}
              className={styles.avatar}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
