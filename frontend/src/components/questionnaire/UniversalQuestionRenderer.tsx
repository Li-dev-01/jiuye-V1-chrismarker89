/**
 * UniversalQuestionRenderer - 通用问题渲染器
 * 支持多种问题类型的渲染和交互
 */

import React, { useState, useEffect } from 'react';
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

}) => {
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
                onClick={() => onChange(option.value)}
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
                    onChange(newValues);
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
                onClick={() => onChange(option.value)}
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
    <Card className={styles.questionCard} bordered={false}>
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


      </div>

      {renderStatistics()}
    </Card>
  );
};
