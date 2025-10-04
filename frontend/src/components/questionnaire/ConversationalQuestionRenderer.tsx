/**
 * 对话式问题渲染器 - 第二问卷专用组件
 * 实现H5对话式交互体验，与第一问卷组件完全独立
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Typography, Space, Tag } from 'antd';
import { TagSelector } from './TagSelector';
import { TypewriterText } from './TypewriterText';

const { Title, Text } = Typography;

interface ConversationalQuestionRendererProps {
  question: any;
  value: any;
  onChange: (value: any) => void;
  questionNumber: number;
  totalQuestions: number;
  sectionTitle: string;
  isConversationalMode?: boolean;
}

export const ConversationalQuestionRenderer: React.FC<ConversationalQuestionRendererProps> = ({
  question,
  value,
  onChange,
  questionNumber,
  totalQuestions,
  sectionTitle,
  isConversationalMode = false // 默认关闭对话模式，优化体验
}) => {
  const [showOptions, setShowOptions] = useState(true); // 默认显示选项
  const [typingComplete, setTypingComplete] = useState(true); // 默认完成打字
  const [showUserResponse, setShowUserResponse] = useState(false);

  // 重置状态当问题改变时
  useEffect(() => {
    setShowOptions(true); // 立即显示选项
    setTypingComplete(true); // 立即完成打字
    setShowUserResponse(false);

    // 移除打字机效果延迟，提升体验
  }, [question.id, isConversationalMode]);
  
  // 当用户选择答案时显示用户回答气泡
  useEffect(() => {
    if (value) {
      setShowUserResponse(true);
    } else {
      setShowUserResponse(false);
    }
  }, [value]);
  
  // 处理选项点击
  const handleOptionSelect = (optionValue: any) => {
    onChange(optionValue);
  };
  
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* 优化的问题卡片 - 移除深色背景，使用浅色系 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {/* 问题展示区 - 浅色背景 */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-6">
          {/* 问题元信息 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">Q</span>
              </div>
              <span className="text-blue-600 text-sm font-medium">
                {sectionTitle}
              </span>
            </div>
            <span className="text-gray-500 text-sm font-medium">
              {questionNumber} / {totalQuestions}
            </span>
          </div>

          {/* 问题标题 - 移除打字机效果，直接显示 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-l-4 border-blue-400">
            <div className="text-gray-800 text-lg font-medium leading-relaxed">
              {question.title}
            </div>
          </div>

          {/* 问题描述 */}
          {question.description && (
            <div className="text-gray-600 text-sm leading-relaxed mt-3 pl-4 border-l-2 border-blue-200">
              {question.description}
            </div>
          )}

          {/* 选项区域 - 直接在卡片内显示 */}
          <div className="mt-5 space-y-2">
            {question.type === 'radio' && (
              <TagSelector
                options={question.options}
                value={value}
                onChange={handleOptionSelect}
                mode="single"
                size="medium"
                animated={false}
                conversationalStyle={false}
              />
            )}

            {question.type === 'checkbox' && (
              <TagSelector
                options={question.options}
                value={value || []}
                onChange={handleOptionSelect}
                mode="multiple"
                size="medium"
                animated={false}
                conversationalStyle={false}
                maxSelections={question.config?.maxSelections}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* 已选择提示 - 简化显示 */}
      {value && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <Text className="text-green-700 text-sm font-medium">
              已选择: {formatUserResponse(value, question.options)}
            </Text>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// 格式化用户回答显示
const formatUserResponse = (value: any, options: any[]): string => {
  if (Array.isArray(value)) {
    // 多选题
    if (value.length === 0) return '未选择';
    
    return value
      .map(v => {
        const option = options?.find(opt => opt.value === v);
        return option?.label || v;
      })
      .join('、');
  } else {
    // 单选题
    const option = options?.find(opt => opt.value === value);
    return option?.label || value;
  }
};

// 动画变体
const bubbleVariants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.9 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.9,
    transition: {
      duration: 0.3
    }
  }
};

const optionsVariants = {
  hidden: { 
    opacity: 0, 
    y: 30 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const optionItemVariants = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: { 
    opacity: 1, 
    x: 0 
  }
};
