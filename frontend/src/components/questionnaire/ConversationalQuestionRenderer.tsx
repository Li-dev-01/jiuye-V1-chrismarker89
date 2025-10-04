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
  isConversationalMode = true
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const [showUserResponse, setShowUserResponse] = useState(false);
  
  // 重置状态当问题改变时
  useEffect(() => {
    setShowOptions(false);
    setTypingComplete(false);
    setShowUserResponse(false);
    
    if (isConversationalMode) {
      // 打字机效果延迟
      const timer = setTimeout(() => {
        setTypingComplete(true);
        setTimeout(() => setShowOptions(true), 500);
      }, 1200);
      
      return () => clearTimeout(timer);
    } else {
      setTypingComplete(true);
      setShowOptions(true);
    }
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
    <div className="space-y-3">
      {/* 系统消息气泡 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-start space-x-3"
      >
        {/* 小头像 */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
        </div>
        
        {/* 优化的问题展示区 */}
        <div className="flex-1 max-w-full">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 space-y-3">
              {/* 问题元信息 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <span className="text-blue-600 text-sm font-medium">
                    {sectionTitle}
                  </span>
                </div>
                <span className="text-gray-500 text-sm">
                  {questionNumber} / {totalQuestions}
                </span>
              </div>

              {/* 问题标题 - 优化显示 */}
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                {isConversationalMode ? (
                  <TypewriterText
                    text={question.title}
                    speed={60}
                    onComplete={() => setTypingComplete(true)}
                    className="text-gray-800 text-base font-medium leading-relaxed"
                  />
                ) : (
                  <div className="text-gray-800 text-base font-medium leading-relaxed">
                    {question.title}
                  </div>
                )}
              </div>
              
              {/* 问题描述 */}
              {question.description && typingComplete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-600 text-sm leading-relaxed mt-2 pl-4 border-l-2 border-gray-200"
                >
                  {question.description}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* 紧凑选项区域 */}
      {showOptions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="ml-8 sm:ml-11 space-y-2"
        >
          {question.type === 'radio' && (
            <TagSelector
              options={question.options}
              value={value}
              onChange={handleOptionSelect}
              mode="single"
              size="medium"
              animated={true}
              conversationalStyle={true}
            />
          )}

          {question.type === 'checkbox' && (
            <TagSelector
              options={question.options}
              value={value || []}
              onChange={handleOptionSelect}
              mode="multiple"
              size="medium"
              animated={true}
              conversationalStyle={true}
              maxSelections={question.config?.maxSelections}
            />
          )}

          {/* 其他问题类型可以在这里扩展 */}
        </motion.div>
      )}
      
      {/* 用户回答气泡 */}
      <AnimatePresence>
        {showUserResponse && value && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="flex justify-end"
          >
            <div className="flex items-start space-x-3 max-w-2xl">
              {/* 用户回答气泡 */}
              <Card className="bg-gray-100 border-0 shadow-md">
                <div className="text-gray-800">
                  <Text className="text-sm font-medium">
                    {formatUserResponse(value, question.options)}
                  </Text>
                </div>
              </Card>
              
              {/* 用户头像 */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">我</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 确认反馈 */}
      <AnimatePresence>
        {showUserResponse && value && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="flex items-start space-x-3"
          >
            {/* AI头像 */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            
            {/* 确认消息 */}
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Text className="text-green-700 text-sm">
                收到您的回答，正在准备下一个问题...
              </Text>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
