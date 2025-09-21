import React from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Rate } from 'antd';
import { BankOutlined, DollarOutlined, StarOutlined } from '@ant-design/icons';
import type { EmploymentStatus } from '../../types/questionnaire';
import { EMPLOYMENT_STATUS_OPTIONS } from '../../types/questionnaire';
import styles from './FormSteps.module.css';

const { Option } = Select;

interface EmploymentStatusStepProps {
  value?: EmploymentStatus;
  onChange?: (value: EmploymentStatus) => void;
}

export const EmploymentStatusStep: React.FC<EmploymentStatusStepProps> = ({ value, onChange }) => {
  const handleFieldChange = (field: keyof EmploymentStatus, fieldValue: any) => {
    if (onChange) {
      onChange({
        ...value,
        [field]: fieldValue
      } as EmploymentStatus);
    }
  };

  const isEmployed = value?.currentStatus === 'employed';
  const showEmploymentDetails = isEmployed;

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>当前就业状态</h2>
        <p className={styles.stepDescription}>请填写您当前的就业状况和工作情况</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item
            label="当前状态"
            name={['employmentStatus', 'currentStatus']}
            rules={[{ required: true, message: '请选择当前就业状态' }]}
          >
            <Select
              placeholder="请选择您当前的状态"
              size="large"
              value={value?.currentStatus}
              onChange={(val) => handleFieldChange('currentStatus', val)}
            >
              {EMPLOYMENT_STATUS_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {showEmploymentDetails && (
          <>
            <Col xs={24} sm={12}>
              <Form.Item
                label="当前公司"
                name={['employmentStatus', 'currentCompany']}
                rules={[{ required: isEmployed, message: '请输入当前公司名称' }]}
              >
                <Input
                  prefix={<BankOutlined className="text-gray-400" />}
                  placeholder="请输入公司名称"
                  size="large"
                  value={value?.currentCompany}
                  onChange={(e) => handleFieldChange('currentCompany', e.target.value)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="当前职位"
                name={['employmentStatus', 'currentPosition']}
                rules={[{ required: isEmployed, message: '请输入当前职位' }]}
              >
                <Input
                  placeholder="请输入职位名称"
                  size="large"
                  value={value?.currentPosition}
                  onChange={(e) => handleFieldChange('currentPosition', e.target.value)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="当前薪资"
                name={['employmentStatus', 'currentSalary']}
                help="单位：元/月，选填"
              >
                <InputNumber
                  prefix={<DollarOutlined className="text-gray-400" />}
                  placeholder="请输入月薪"
                  size="large"
                  min={1000}
                  max={100000}
                  step={1000}
                  className="w-full"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  value={value?.currentSalary}
                  onChange={(val) => handleFieldChange('currentSalary', val)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="工作满意度"
                name={['employmentStatus', 'satisfactionLevel']}
                help="请为您当前的工作满意度打分"
              >
                <div className="flex items-center space-x-2">
                  <Rate
                    value={value?.satisfactionLevel}
                    onChange={(val) => handleFieldChange('satisfactionLevel', val)}
                    character={<StarOutlined />}
                    className="text-lg"
                  />
                  <span className="text-gray-500">
                    {value?.satisfactionLevel ? `${value.satisfactionLevel}分` : '未评分'}
                  </span>
                </div>
              </Form.Item>
            </Col>
          </>
        )}

        {value?.currentStatus === 'continuing_education' && (
          <Col xs={24}>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-blue-800 font-medium mb-2">继续深造信息</h4>
              <p className="text-blue-700 text-sm">
                感谢您选择继续深造！您的学习经历对我们的研究很有价值。
                如果您在深造期间有实习或工作计划，也欢迎您再次参与我们的调研。
              </p>
            </div>
          </Col>
        )}

        {value?.currentStatus === 'unemployed' && (
          <Col xs={24}>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-yellow-800 font-medium mb-2">求职支持</h4>
              <p className="text-yellow-700 text-sm">
                我们理解求职过程可能面临的挑战。您的经历对帮助其他求职者很有价值。
                如果需要，我们可以为您提供一些求职建议和资源。
              </p>
            </div>
          </Col>
        )}

        {value?.currentStatus === 'other' && (
          <Col xs={24}>
            <Form.Item
              label="其他状态说明"
              name={['employmentStatus', 'otherDescription']}
              help="请简要说明您的当前状态"
            >
              <Input.TextArea
                placeholder="请描述您的当前状态..."
                rows={3}
                maxLength={200}
                showCount
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {/* 状态总结卡片 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">状态总结</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">当前状态：</span>
            <span className="ml-2 font-medium">
              {EMPLOYMENT_STATUS_OPTIONS.find(opt => opt.value === value?.currentStatus)?.label || '未选择'}
            </span>
          </div>
          {showEmploymentDetails && (
            <>
              <div>
                <span className="text-sm text-gray-600">工作单位：</span>
                <span className="ml-2 font-medium">{value?.currentCompany || '未填写'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">职位：</span>
                <span className="ml-2 font-medium">{value?.currentPosition || '未填写'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">满意度：</span>
                <span className="ml-2 font-medium">
                  {value?.satisfactionLevel ? `${value.satisfactionLevel}/5分` : '未评分'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">即将完成</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                您已经完成了问卷的最后一部分！感谢您提供详细的信息。
                您的数据将帮助我们更好地了解大学生就业状况，为改善就业环境提供支持。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
