import React from 'react';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import type { PersonalInfo } from '../../types/questionnaire';
import { GENDER_OPTIONS, FORM_RULES } from '../../types/questionnaire';
import styles from './FormSteps.module.css';

const { Option } = Select;

interface PersonalInfoStepProps {
  value?: PersonalInfo;
  onChange?: (value: PersonalInfo) => void;
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ value, onChange }) => {
  const handleFieldChange = (field: keyof PersonalInfo, fieldValue: any) => {
    if (onChange) {
      onChange({
        ...value,
        [field]: fieldValue
      } as PersonalInfo);
    }
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>个人基本信息</h2>
        <p className={styles.stepDescription}>请填写您的基本个人信息，我们将严格保护您的隐私</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="姓名"
            name={['personalInfo', 'name']}
            rules={FORM_RULES.name}
          >
            <Input
              prefix={<UserOutlined className={styles.inputIcon} />}
              placeholder="请输入您的姓名"
              size="large"
              value={value?.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="性别"
            name={['personalInfo', 'gender']}
            rules={FORM_RULES.gender}
          >
            <Select
              placeholder="请选择性别"
              size="large"
              value={value?.gender}
              onChange={(val) => handleFieldChange('gender', val)}
            >
              {GENDER_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="年龄"
            name={['personalInfo', 'age']}
            rules={FORM_RULES.age}
          >
            <InputNumber
              placeholder="请输入年龄"
              size="large"
              min={16}
              max={60}
              className="w-full"
              value={value?.age}
              onChange={(val) => handleFieldChange('age', val)}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="手机号"
            name={['personalInfo', 'phone']}
            rules={FORM_RULES.phone}
          >
            <Input
              prefix={<PhoneOutlined className={styles.inputIcon} />}
              placeholder="请输入手机号"
              size="large"
              value={value?.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="邮箱"
            name={['personalInfo', 'email']}
            rules={FORM_RULES.email}
          >
            <Input
              prefix={<MailOutlined className={styles.inputIcon} />}
              placeholder="请输入邮箱地址"
              size="large"
              value={value?.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
            />
          </Form.Item>
        </Col>
      </Row>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">隐私保护说明</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                您的个人信息将仅用于学术研究目的，我们承诺：
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>严格保护您的个人隐私</li>
                <li>数据仅用于统计分析，不会泄露个人信息</li>
                <li>您可以随时要求删除您的数据</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
