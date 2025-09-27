/**
 * 移动端专用页面包装器
 * 提供移动端优化的页面布局和交互
 */

import React from 'react';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import styles from './MobilePage.module.css';

interface MobilePageProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export const MobilePage: React.FC<MobilePageProps> = ({
  children,
  title,
  showBackButton = false,
  onBack,
  className = ''
}) => {
  const { isMobile, safeAreaInsets } = useMobileDetection();
  
  if (!isMobile) {
    return <>{children}</>;
  }
  
  return (
    <div 
      className={`${styles.mobilePage} ${className}`}
      style={{
        paddingTop: safeAreaInsets.top,
        paddingBottom: safeAreaInsets.bottom
      }}
    >
      {title && (
        <div className={styles.mobileHeader}>
          {showBackButton && (
            <button className={styles.backButton} onClick={onBack}>
              ←
            </button>
          )}
          <h1 className={styles.pageTitle}>{title}</h1>
        </div>
      )}
      
      <div className={styles.pageContent}>
        {children}
      </div>
    </div>
  );
};

export default MobilePage;