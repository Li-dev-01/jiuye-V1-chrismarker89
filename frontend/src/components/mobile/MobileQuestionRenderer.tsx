/**
 * 移动端专用问题渲染器
 * 针对移动端用户体验优化的问题组件
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Rate, Slider, Typography, Space, Alert } from 'antd';
import { CheckOutlined, StarOutlined } from '@ant-design/icons';
import type { UniversalQuestion } from '../../types/universal-questionnaire';
import styles from './MobileQuestionRenderer.module.css';

const { Text, TextArea } = Input;
const { Title } = Typography;

interface MobileQuestionRendererProps {
  question: UniversalQuestion;
  value?: any;
  onChange: (value: any) => void;
  error?: string;
  questionNumber?: number;
  onNext?: () => void; // 移动端自动进入下一题
}

export const MobileQuestionRenderer: React.FC<MobileQuestionRendererProps> = ({
  question,
  value,
  onChange,
  error,
  questionNumber,
  onNext
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 处理选择并提供触觉反馈
  const handleSelect = (selectedValue: any) => {
    setLocalValue(selectedValue);
    onChange(selectedValue);
    
    // 显示选择反馈
    setShowFeedback(true);
    
    // 触觉反馈（如果支持）
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // 自动进入下一题（延迟以显示反馈）
    if (onNext && question.type !== 'text' && question.type !== 'textarea') {
      setTimeout(() => {
        onNext();
      }, 800);
    }
    
    // 隐藏反馈
    setTimeout(() => {
      setShowFeedback(false);
    }, 1000);
  };

  // 渲染单选题
  const renderRadio = () => (
    <div className={styles.optionsContainer}>
      {question.options?.map((option, index) => (
        <button
          key={option.value}
          className={`${styles.optionButton} ${
            localValue === option.value ? styles.selected : ''
          }`}
          onClick={() => handleSelect(option.value)}
          type="button"
        >
          <div className={styles.optionContent}>
            <span className={styles.optionText}>{option.label}</span>
            {localValue === option.value && (
              <CheckOutlined className={styles.checkIcon} />
            )}
          </div>
        </button>
      ))}
    </div>
  );

  // 渲染多选题
  const renderCheckbox = () => {
    const selectedValues = Array.isArray(localValue) ? localValue : [];
    
    return (
      <div className={styles.optionsContainer}>
        {question.options?.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <button
              key={option.value}
              className={`${styles.optionButton} ${
                isSelected ? styles.selected : ''
              }`}
              onClick={() => {
                const newValues = isSelected
                  ? selectedValues.filter(v => v !== option.value)
                  : [...selectedValues, option.value];
                handleSelect(newValues);
              }}
              type="button"
            >
              <div className={styles.optionContent}>
                <span className={styles.optionText}>{option.label}</span>
                {isSelected && (
                  <CheckOutlined className={styles.checkIcon} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // 渲染标签选择
  const renderTags = () => {
    const selectedValues = Array.isArray(localValue) ? localValue : [];
    
    return (
      <div className={styles.tagsContainer}>
        {question.options?.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <button
              key={option.value}
              className={`${styles.tagButton} ${
                isSelected ? styles.tagSelected : ''
              }`}
              onClick={() => {
                const newValues = isSelected
                  ? selectedValues.filter(v => v !== option.value)
                  : [...selectedValues, option.value];
                handleSelect(newValues);
              }}
              type="button"
            >
              {option.label}
              {isSelected && <CheckOutlined className={styles.tagCheckIcon} />}
            </button>
          );
        })}
      </div>
    );
  };

  // 渲染文本输入
  const renderText = () => (
    <Input
      className={styles.textInput}
      placeholder={question.placeholder || '请输入您的答案'}
      value={localValue || ''}
      onChange={(e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange(newValue);
      }}
      size="large"
    />
  );

  // 渲染多行文本
  const renderTextarea = () => (
    <TextArea
      className={styles.textareaInput}
      placeholder={question.placeholder || '请输入您的详细回答'}
      value={localValue || ''}
      onChange={(e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange(newValue);
      }}
      rows={4}
      size="large"
    />
  );

  // 渲染评分
  const renderRating = () => (
    <div className={styles.ratingContainer}>
      <Rate
        className={styles.rating}
        value={localValue || 0}
        onChange={(value) => handleSelect(value)}
        character={<StarOutlined />}
        allowHalf
        count={question.max || 5}
      />
      <div className={styles.ratingLabels}>
        <Text type="secondary">很差</Text>
        <Text type="secondary">很好</Text>
      </div>
    </div>
  );

  // 渲染滑块
  const renderSlider = () => (
    <div className={styles.sliderContainer}>
      <Slider
        className={styles.slider}
        value={localValue || question.min || 0}
        onChange={(value) => {
          setLocalValue(value);
          onChange(value);
        }}
        min={question.min || 0}
        max={question.max || 100}
        step={question.step || 1}
        marks={{
          [question.min || 0]: `${question.min || 0}`,
          [question.max || 100]: `${question.max || 100}`
        }}
      />
      <div className={styles.sliderValue}>
        当前值: {localValue || question.min || 0}
      </div>
    </div>
  );

  // 根据问题类型渲染对应组件
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'radio':
        return renderRadio();
      case 'checkbox':
        return renderCheckbox();
      case 'tags':
        return renderTags();
      case 'text':
        return renderText();
      case 'textarea':
        return renderTextarea();
      case 'rating':
        return renderRating();
      case 'slider':
        return renderSlider();
      default:
        return <div>不支持的问题类型: {question.type}</div>;
    }
  };

  return (
    <div className={styles.questionCard}>
      {/* 问题标题 */}
      <div className={styles.questionHeader}>
        <Title level={4} className={styles.questionTitle}>
          {questionNumber && (
            <span className={styles.questionNumber}>{questionNumber}. </span>
          )}
          {question.title}
        </Title>
        
        {question.description && (
          <Text className={styles.questionDescription}>
            {question.description}
          </Text>
        )}
        
        {question.required && (
          <Text type="danger" className={styles.requiredMark}>*</Text>
        )}
      </div>

      {/* 问题内容 */}
      <div className={styles.questionContent}>
        {renderQuestionContent()}
      </div>

      {/* 选择反馈 */}
      {showFeedback && (
        <div className={styles.feedback}>
          <CheckOutlined className={styles.feedbackIcon} />
          <Text className={styles.feedbackText}>已选择</Text>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          className={styles.errorAlert}
        />
      )}

      {/* 提示信息 */}
      {question.hint && (
        <Text type="secondary" className={styles.hint}>
          💡 {question.hint}
        </Text>
      )}
    </div>
  );
};

export default MobileQuestionRenderer;
