import React from 'react';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { BookOutlined, TrophyOutlined } from '@ant-design/icons';
import type { EducationInfo } from '../../types/questionnaire';
import { DEGREE_OPTIONS, FORM_RULES } from '../../types/questionnaire';
import styles from './FormSteps.module.css';

const { Option } = Select;

interface EducationInfoStepProps {
  value?: EducationInfo;
  onChange?: (value: EducationInfo) => void;
}

export const EducationInfoStep: React.FC<EducationInfoStepProps> = ({ value, onChange }) => {
  const handleFieldChange = (field: keyof EducationInfo, fieldValue: any) => {
    if (onChange) {
      onChange({
        ...value,
        [field]: fieldValue
      } as EducationInfo);
    }
  };

  // 生成毕业年份选项
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 5; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>教育背景信息</h2>
        <p className={styles.stepDescription}>请填写您的教育背景，包括学校、专业、学历等信息</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="学校名称"
            name={['educationInfo', 'university']}
            rules={FORM_RULES.university}
          >
            <Input
              prefix={<BookOutlined className={styles.inputIcon} />}
              placeholder="请输入学校名称"
              size="large"
              value={value?.university}
              onChange={(e) => handleFieldChange('university', e.target.value)}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="专业名称"
            name={['educationInfo', 'major']}
            rules={FORM_RULES.major}
          >
            <Input
              placeholder="请输入专业名称"
              size="large"
              value={value?.major}
              onChange={(e) => handleFieldChange('major', e.target.value)}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="学历层次"
            name={['educationInfo', 'degree']}
            rules={FORM_RULES.degree}
          >
            <Select
              placeholder="请选择学历层次"
              size="large"
              value={value?.degree}
              onChange={(val) => handleFieldChange('degree', val)}
            >
              {DEGREE_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="毕业年份"
            name={['educationInfo', 'graduationYear']}
            rules={FORM_RULES.graduationYear}
          >
            <Select
              placeholder="请选择毕业年份"
              size="large"
              showSearch
              value={value?.graduationYear}
              onChange={(val) => handleFieldChange('graduationYear', val)}
            >
              {generateYearOptions().map(year => (
                <Option key={year} value={year}>
                  {year}年
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="GPA/平均分"
            name={['educationInfo', 'gpa']}
            help="选填，如有请填写"
          >
            <InputNumber
              prefix={<TrophyOutlined className={styles.inputIcon} />}
              placeholder="如：3.8 或 85"
              size="large"
              min={0}
              max={5}
              step={0.1}
              className="w-full"
              value={value?.gpa}
              onChange={(val) => handleFieldChange('gpa', val)}
            />
          </Form.Item>
        </Col>
      </Row>

      <div className={styles.helpTip}>
        <div className={styles.helpTipContent}>
          <div className={styles.helpTipIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className={styles.helpTipText}>
            <h3 className={styles.helpTipTitle}>填写提示</h3>
            <div className={styles.helpTipList}>
              <ul>
                <li>请确保学校和专业名称的准确性</li>
                <li>GPA可以填写4分制或百分制成绩</li>
                <li>如果是在读学生，请填写预计毕业年份</li>
                <li>双学位或多专业可在专业名称中注明</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
