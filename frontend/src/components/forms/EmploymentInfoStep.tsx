import React from 'react';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { BankOutlined, DollarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { EmploymentInfo } from '../../types/questionnaire';
import { INDUSTRY_OPTIONS, LOCATION_OPTIONS, FORM_RULES } from '../../types/questionnaire';
import styles from './FormSteps.module.css';

const { Option } = Select;
const { TextArea } = Input;

interface EmploymentInfoStepProps {
  value?: EmploymentInfo;
  onChange?: (value: EmploymentInfo) => void;
}

export const EmploymentInfoStep: React.FC<EmploymentInfoStepProps> = ({ value, onChange }) => {
  const handleFieldChange = (field: keyof EmploymentInfo, fieldValue: any) => {
    if (onChange) {
      onChange({
        ...value,
        [field]: fieldValue
      } as EmploymentInfo);
    }
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>就业意向信息</h2>
        <p className={styles.stepDescription}>请填写您的就业期望，包括行业、职位、薪资等信息</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item
            label="期望行业"
            name={['employmentInfo', 'preferredIndustry']}
            rules={FORM_RULES.preferredIndustry}
            help="可多选，请选择您感兴趣的行业"
          >
            <Select
              mode="multiple"
              placeholder="请选择期望的行业（可多选）"
              size="large"
              maxTagCount={3}
              value={value?.preferredIndustry}
              onChange={(val) => handleFieldChange('preferredIndustry', val)}
            >
              {INDUSTRY_OPTIONS.map(industry => (
                <Option key={industry} value={industry}>
                  {industry}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="期望职位"
            name={['employmentInfo', 'preferredPosition']}
            rules={FORM_RULES.preferredPosition}
          >
            <Input
              prefix={<BankOutlined className="text-gray-400" />}
              placeholder="如：软件工程师、产品经理等"
              size="large"
              value={value?.preferredPosition}
              onChange={(e) => handleFieldChange('preferredPosition', e.target.value)}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label="期望薪资"
            name={['employmentInfo', 'expectedSalary']}
            rules={FORM_RULES.expectedSalary}
            help="单位：元/月"
          >
            <InputNumber
              prefix={<DollarOutlined className="text-gray-400" />}
              placeholder="请输入期望月薪"
              size="large"
              min={1000}
              max={100000}
              step={1000}
              className="w-full"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              value={value?.expectedSalary}
              onChange={(val) => handleFieldChange('expectedSalary', val)}
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="期望工作地点"
            name={['employmentInfo', 'preferredLocation']}
            rules={FORM_RULES.preferredLocation}
            help="可多选，请选择您愿意工作的城市"
          >
            <Select
              mode="multiple"
              placeholder="请选择期望的工作地点（可多选）"
              size="large"
              maxTagCount={3}
              value={value?.preferredLocation}
              onChange={(val) => handleFieldChange('preferredLocation', val)}
            >
              {LOCATION_OPTIONS.map(location => (
                <Option key={location} value={location}>
                  {location}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="工作经验描述"
            name={['employmentInfo', 'workExperience']}
            rules={FORM_RULES.workExperience}
            help="请描述您的实习、项目或工作经验"
          >
            <TextArea
              placeholder="请详细描述您的相关工作经验、实习经历、项目经验等..."
              rows={4}
              maxLength={500}
              showCount
              value={value?.workExperience}
              onChange={(e) => handleFieldChange('workExperience', e.target.value)}
            />
          </Form.Item>
        </Col>
      </Row>

      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-800">填写建议</h3>
            <div className="mt-2 text-sm text-purple-700">
              <ul className="list-disc list-inside space-y-1">
                <li>期望薪资请根据市场行情和自身能力合理填写</li>
                <li>可以选择多个感兴趣的行业和工作地点</li>
                <li>工作经验描述要具体，突出相关技能和成果</li>
                <li>如果是应届生，可以重点描述实习和项目经验</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
