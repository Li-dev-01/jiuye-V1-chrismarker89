/**
 * 标签选择器组件 - 第二问卷专用
 * 实现标签式选择交互，支持单选和多选模式
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Typography, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TagSelectorProps {
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  value: any;
  onChange: (value: any) => void;
  mode: 'single' | 'multiple';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  conversationalStyle?: boolean;
  maxSelections?: number;
  disabled?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  options,
  value,
  onChange,
  mode,
  size = 'medium',
  animated = true,
  conversationalStyle = false,
  maxSelections,
  disabled = false
}) => {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  
  // 获取当前选中的值数组
  const getSelectedValues = (): string[] => {
    if (mode === 'single') {
      return value ? [value] : [];
    } else {
      return Array.isArray(value) ? value : [];
    }
  };
  
  // 处理选项点击
  const handleOptionClick = (optionValue: string) => {
    if (disabled) return;
    
    const selectedValues = getSelectedValues();
    
    if (mode === 'single') {
      onChange(optionValue);
    } else {
      // 多选模式
      if (selectedValues.includes(optionValue)) {
        // 取消选择
        const newValues = selectedValues.filter(v => v !== optionValue);
        onChange(newValues);
      } else {
        // 添加选择
        if (maxSelections && selectedValues.length >= maxSelections) {
          return; // 达到最大选择数量
        }
        const newValues = [...selectedValues, optionValue];
        onChange(newValues);
      }
    }
  };
  
  // 检查选项是否被选中
  const isSelected = (optionValue: string): boolean => {
    return getSelectedValues().includes(optionValue);
  };
  
  // 检查是否可以继续选择
  const canSelect = (optionValue: string): boolean => {
    if (disabled) return false;
    if (isSelected(optionValue)) return true;
    if (mode === 'single') return true;
    if (maxSelections && getSelectedValues().length >= maxSelections) return false;
    return true;
  };
  
  // 获取标签样式类
  const getTagClassName = (optionValue: string): string => {
    const baseClasses = [
      'cursor-pointer',
      'transition-all',
      'duration-300',
      'border-2',
      'rounded-lg',
      'select-none'
    ];
    
    if (conversationalStyle) {
      baseClasses.push('shadow-sm', 'hover:shadow-md');
    }
    
    // 尺寸样式
    if (size === 'large') {
      baseClasses.push('px-6', 'py-3', 'text-base');
    } else if (size === 'medium') {
      baseClasses.push('px-4', 'py-2', 'text-sm');
    } else {
      baseClasses.push('px-3', 'py-1', 'text-xs');
    }
    
    // 选中状态样式
    if (isSelected(optionValue)) {
      if (conversationalStyle) {
        baseClasses.push(
          'bg-blue-500',
          'border-blue-500',
          'text-white',
          'shadow-lg'
        );
      } else {
        baseClasses.push(
          'bg-blue-50',
          'border-blue-500',
          'text-blue-700'
        );
      }
    } else {
      // 未选中状态
      if (canSelect(optionValue)) {
        if (hoveredOption === optionValue) {
          baseClasses.push(
            'bg-blue-50',
            'border-blue-300',
            'text-blue-600'
          );
        } else {
          baseClasses.push(
            'bg-white',
            'border-gray-300',
            'text-gray-700',
            'hover:border-blue-300',
            'hover:bg-blue-50'
          );
        }
      } else {
        baseClasses.push(
          'bg-gray-100',
          'border-gray-200',
          'text-gray-400',
          'cursor-not-allowed'
        );
      }
    }
    
    return baseClasses.join(' ');
  };
  
  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animated ? 0.1 : 0
      }
    }
  };
  
  const itemVariants = {
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
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <div className="space-y-4">
      {/* 选择提示 */}
      {mode === 'multiple' && maxSelections && (
        <div className="text-center">
          <Text className="text-gray-500 text-sm">
            最多可选择 {maxSelections} 项，已选择 {getSelectedValues().length} 项
          </Text>
        </div>
      )}
      
      {/* 选项列表 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-2 sm:gap-3"
      >
        {options.map((option, index) => (
          <motion.div
            key={option.value}
            variants={itemVariants}
            whileHover={canSelect(option.value) ? { scale: 1.02 } : {}}
            whileTap={canSelect(option.value) ? { scale: 0.98 } : {}}
          >
            <div
              className={getTagClassName(option.value)}
              onClick={() => handleOptionClick(option.value)}
              onMouseEnter={() => setHoveredOption(option.value)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{option.label}</span>
                    {isSelected(option.value) && (
                      <CheckOutlined className="text-current" />
                    )}
                  </div>
                  {option.description && (
                    <div className="mt-1">
                      <Text 
                        className={`text-xs ${
                          isSelected(option.value) 
                            ? 'text-blue-100' 
                            : 'text-gray-500'
                        }`}
                      >
                        {option.description}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* 已选择项目预览（多选模式） */}
      {mode === 'multiple' && getSelectedValues().length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
        >
          <Text className="text-blue-700 text-sm font-medium mb-2 block">
            已选择的选项：
          </Text>
          <Space wrap>
            {getSelectedValues().map(selectedValue => {
              const option = options.find(opt => opt.value === selectedValue);
              return (
                <Tag 
                  key={selectedValue}
                  color="blue"
                  closable
                  onClose={() => handleOptionClick(selectedValue)}
                >
                  {option?.label || selectedValue}
                </Tag>
              );
            })}
          </Space>
        </motion.div>
      )}
    </div>
  );
};
