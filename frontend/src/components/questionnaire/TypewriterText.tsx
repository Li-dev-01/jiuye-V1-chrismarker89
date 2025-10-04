/**
 * 打字机效果文本组件 - 第二问卷专用
 * 实现逐字显示的打字机效果
 */

import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // 打字速度（毫秒）
  onComplete?: () => void;
  className?: string;
  cursor?: boolean; // 是否显示光标
  cursorChar?: string; // 光标字符
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  onComplete,
  className = '',
  cursor = true,
  cursorChar = '|'
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  
  // 打字机效果
  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, isComplete]);
  
  // 光标闪烁效果
  useEffect(() => {
    if (!cursor) return;
    
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => clearInterval(cursorTimer);
  }, [cursor]);
  
  return (
    <span className={className}>
      {displayText}
      {cursor && (
        <span 
          className={`inline-block transition-opacity duration-100 ${
            showCursor ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {cursorChar}
        </span>
      )}
    </span>
  );
};
