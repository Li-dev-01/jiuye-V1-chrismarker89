/**
 * UniversalQuestionRenderer - 通用问题渲染器
 * 支持多种问题类型的渲染和交互
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Checkbox,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Rate,
  Slider,
  Upload,
  Typography,
  Space,
  Card,
  Alert
} from 'antd';
import { UploadOutlined, StarOutlined } from '@ant-design/icons';
import type { UniversalQuestion } from '../../types/universal-questionnaire';
import { LazyStatistics } from './LazyStatistics';

import styles from './UniversalQuestionRenderer.module.css';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface UniversalQuestionRendererProps {
  question: UniversalQuestion;
  value?: any;
  onChange: (value: any) => void;
  error?: string;
  questionNumber?: number;
  showStatistics?: boolean;
  refreshTrigger?: number; // 用于触发统计数据刷新
  onAuthSuccess?: (authType: 'quick-register' | 'semi-anonymous-login') => void; // 认证成功回调
  autoScrollToNext?: boolean; // 是否在选择后自动滚动到下一题
  isLastQuestion?: boolean; // 是否是最后一题
}

export const UniversalQuestionRenderer: React.FC<UniversalQuestionRendererProps> = ({
  question,
  value,
  onChange,
  error,
  questionNumber,
  showStatistics = true,
  refreshTrigger = 0,
  onAuthSuccess,
  autoScrollToNext = true,
  isLastQuestion = false,
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  // 自动滚动到下一题的函数
  const scrollToNextQuestion = useCallback(() => {
    if (!autoScrollToNext || isLastQuestion) return;

    // 显示滚动提示
    setIsScrolling(true);

    setTimeout(() => {
      // 查找当前问题的下一个问题元素
      const currentQuestionElement = document.querySelector(`[data-question-id="${question.id}"]`);
      if (currentQuestionElement) {
        const nextQuestionElement = currentQuestionElement.nextElementSibling;
        if (nextQuestionElement) {
          // 计算滚动位置，确保下一题在视窗中央偏上位置
          const rect = nextQuestionElement.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const targetPosition = window.scrollY + rect.top - (windowHeight * 0.2); // 距离顶部20%的位置

          window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth'
          });

          // 滚动完成后隐藏提示
          setTimeout(() => {
            setIsScrolling(false);
          }, 800);
        } else {
          setIsScrolling(false);
        }
      } else {
        setIsScrolling(false);
      }
    }, 600); // 延迟600ms，让用户看到选择效果和反馈
  }, [autoScrollToNext, isLastQuestion, question.id]);

  // 处理选择变化的函数
  const handleChange = useCallback((newValue: any) => {
    onChange(newValue);

    // 对于单选题和下拉选择题，选择后自动滚动到下一题
    if (question.type === 'radio' || question.type === 'select') {
      scrollToNextQuestion();
    }

    // 对于多选题，如果选择了选项也可以滚动（可选）
    // if (question.type === 'checkbox' && newValue && newValue.length > 0) {
    //   scrollToNextQuestion();
    // }
  }, [onChange, question.type, scrollToNextQuestion]);

  // 渲染问题标题
  const renderQuestionTitle = () => (
    <div className={styles.questionHeader}>
      <Title level={4} className={styles.questionTitle}>
        {questionNumber && (
          <span className={styles.questionNumber}>{questionNumber}. </span>
        )}
        {question.title}
        {question.required && (
          <span className={styles.required}>*</span>
        )}
      </Title>
      {question.description && (
        <Text className={styles.questionDescription}>
          {question.description}
        </Text>
      )}
    </div>
  );

  // 渲染统计信息（已禁用）
  const renderStatistics = () => {
    // 实时统计功能已移除，不再显示选项统计
    return null;
  };

  // 根据问题类型渲染输入组件
  const renderInput = () => {
    switch (question.type) {
      case 'radio':
        return (
          <div className={styles.tagOptionsContainer}>
            {question.options?.map(option => (
              <div
                key={option.value}
                className={`${styles.tagOption} ${value === option.value ? styles.tagOptionSelected : ''}`}
                onClick={() => {
                  handleChange(option.value);
                  // 如果是提交方式选择，触发相应的认证流程
                  if (question.id === 'submission-type' && onAuthSuccess) {
                    if (option.value === 'google-login') {
                      // 触发Google登录
                      onAuthSuccess('quick-register');
                    } else if (option.value === 'auto-login') {
                      // 触发自动登录
                      onAuthSuccess('semi-anonymous-login');
                    }
                  }
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className={styles.tagOptionsContainer}>
            {question.options?.map(option => {
              const isSelected = (value || []).includes(option.value);
              return (
                <div
                  key={option.value}
                  className={`${styles.tagOption} ${isSelected ? styles.tagOptionSelected : ''}`}
                  onClick={() => {
                    const currentValues = value || [];
                    const newValues = isSelected
                      ? currentValues.filter((v: any) => v !== option.value)
                      : [...currentValues, option.value];
                    handleChange(newValues);
                  }}
                >
                  {option.label}
                </div>
              );
            })}
          </div>
        );

      case 'select':
        return (
          <div className={styles.tagOptionsContainer}>
            {question.options?.map(option => (
              <div
                key={option.value}
                className={`${styles.tagOption} ${value === option.value ? styles.tagOptionSelected : ''}`}
                onClick={() => handleChange(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            size="large"
            className={styles.textInput}
          />
        );

      case 'textarea':
        return (
          <TextArea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className={styles.textarea}
            showCount
            maxLength={question.config?.maxLength || 500}
          />
        );

      case 'number':
        return (
          <InputNumber
            value={value}
            onChange={onChange}
            placeholder={question.placeholder}
            size="large"
            className={styles.numberInput}
            min={question.config?.min}
            max={question.config?.max}
            step={question.config?.step || 1}
          />
        );

      case 'date':
        return (
          <DatePicker
            value={value}
            onChange={onChange}
            placeholder={question.placeholder || "选择日期"}
            size="large"
            className={styles.datePicker}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || "请输入邮箱地址"}
            size="large"
            className={styles.emailInput}
          />
        );

      case 'rating':
        return (
          <div className={styles.ratingContainer}>
            <Rate
              value={value}
              onChange={onChange}
              count={question.config?.maxRating || 5}
              allowHalf={question.config?.allowHalf || false}
              character={<StarOutlined />}
              className={styles.rating}
            />
            {question.config?.showLabels && question.config?.labels && (
              <div className={styles.ratingLabels}>
                {question.config.labels.map((label, index) => (
                  <Text key={index} className={styles.ratingLabel}>
                    {label}
                  </Text>
                ))}
              </div>
            )}
          </div>
        );

      case 'slider':
        return (
          <div className={styles.sliderContainer}>
            <Slider
              value={value}
              onChange={onChange}
              min={question.config?.min || 0}
              max={question.config?.max || 100}
              step={question.config?.step || 1}
              marks={question.config?.marks}
              className={styles.slider}
            />
            {question.config?.showValue && (
              <Text className={styles.sliderValue}>
                当前值: {value || question.config?.min || 0}
              </Text>
            )}
          </div>
        );

      case 'file':
        return (
          <Upload
            fileList={value || []}
            onChange={({ fileList }) => onChange(fileList)}
            beforeUpload={() => false} // 阻止自动上传
            multiple={question.config?.multiple || false}
            accept={question.config?.accept}
            className={styles.upload}
          >
            <div className={styles.uploadButton}>
              <UploadOutlined />
              <span>点击上传文件</span>
            </div>
          </Upload>
        );

      default:
        return (
          <Alert
            message="不支持的问题类型"
            description={`问题类型 "${question.type}" 暂不支持`}
            type="warning"
            showIcon
          />
        );
    }
  };



  return (
    <Card
      className={`${styles.questionCard} ${isScrolling ? styles.questionCardScrolling : ''}`}
      bordered={false}
      data-question-id={question.id}
    >
      {renderQuestionTitle()}

      <div className={styles.inputContainer}>
        {renderInput()}

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className={styles.errorAlert}
          />
        )}

        {/* 自动滚动提示 */}
        {isScrolling && autoScrollToNext && !isLastQuestion && (
          <div className={styles.scrollingHint}>
            <span className={styles.scrollingIcon}>↓</span>
            <span className={styles.scrollingText}>正在跳转到下一题...</span>
          </div>
        )}
      </div>

      {renderStatistics()}
    </Card>
  );
};
