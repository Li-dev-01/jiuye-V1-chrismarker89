import React from 'react';
import { Form, Select, InputNumber, Row, Col } from 'antd';
import { SearchOutlined, CalendarOutlined, TrophyOutlined } from '@ant-design/icons';
import type { JobSearchInfo } from '../../types/questionnaire';
import { SEARCH_CHANNEL_OPTIONS, FORM_RULES } from '../../types/questionnaire';
import styles from './FormSteps.module.css';

const { Option } = Select;

interface JobSearchInfoStepProps {
  value?: JobSearchInfo;
  onChange?: (value: JobSearchInfo) => void;
}

export const JobSearchInfoStep: React.FC<JobSearchInfoStepProps> = ({ value, onChange }) => {
  const handleFieldChange = (field: keyof JobSearchInfo, fieldValue: any) => {
    if (onChange) {
      onChange({
        ...value,
        [field]: fieldValue
      } as JobSearchInfo);
    }
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>求职过程信息</h2>
        <p className={styles.stepDescription}>请填写您的求职经历，包括求职渠道、面试情况等</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item
            label="求职渠道"
            name={['jobSearchInfo', 'searchChannels']}
            rules={FORM_RULES.searchChannels}
            help="可多选，请选择您使用过的求职渠道"
          >
            <Select
              mode="multiple"
              placeholder="请选择您使用的求职渠道（可多选）"
              size="large"
              maxTagCount={3}
              value={value?.searchChannels}
              onChange={(val) => handleFieldChange('searchChannels', val)}
            >
              {SEARCH_CHANNEL_OPTIONS.map(channel => (
                <Option key={channel} value={channel}>
                  {channel}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={8}>
          <Form.Item
            label="面试次数"
            name={['jobSearchInfo', 'interviewCount']}
            rules={FORM_RULES.interviewCount}
            help="包括线上线下面试"
          >
            <InputNumber
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="面试次数"
              size="large"
              min={0}
              max={100}
              className="w-full"
              value={value?.interviewCount}
              onChange={(val) => handleFieldChange('interviewCount', val)}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={8}>
          <Form.Item
            label="收到Offer数"
            name={['jobSearchInfo', 'offerCount']}
            rules={FORM_RULES.offerCount}
            help="收到的工作邀请数量"
          >
            <InputNumber
              prefix={<TrophyOutlined className="text-gray-400" />}
              placeholder="Offer数量"
              size="large"
              min={0}
              max={50}
              className="w-full"
              value={value?.offerCount}
              onChange={(val) => handleFieldChange('offerCount', val)}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={8}>
          <Form.Item
            label="求职时长"
            name={['jobSearchInfo', 'searchDuration']}
            rules={FORM_RULES.searchDuration}
            help="单位：月"
          >
            <InputNumber
              prefix={<CalendarOutlined className="text-gray-400" />}
              placeholder="求职时长"
              size="large"
              min={0}
              max={24}
              step={0.5}
              className="w-full"
              value={value?.searchDuration}
              onChange={(val) => handleFieldChange('searchDuration', val)}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* 数据可视化提示 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {value?.interviewCount || 0}
          </div>
          <div className="text-sm text-blue-800">面试次数</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {value?.offerCount || 0}
          </div>
          <div className="text-sm text-green-800">收到Offer</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {value?.searchDuration || 0}
          </div>
          <div className="text-sm text-purple-800">求职时长(月)</div>
        </div>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">数据说明</h3>
            <div className="mt-2 text-sm text-orange-700">
              <ul className="list-disc list-inside space-y-1">
                <li>如果还在求职中，请填写到目前为止的数据</li>
                <li>面试次数包括电话面试、视频面试和现场面试</li>
                <li>求职时长从开始投递简历算起</li>
                <li>如果暂未开始求职，相关数字可填0</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
