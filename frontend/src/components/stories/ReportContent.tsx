/**
 * 内容举报组件 - 轻量级举报功能
 * 作为审核疏漏的补救措施
 */

import React, { useState } from 'react';
import { Modal, Form, Select, Input, Button, message, Space, Typography } from 'antd';
import { ExclamationCircleOutlined, FlagOutlined } from '@ant-design/icons';
import './ReportContent.css';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

// 举报类型
const reportTypes = [
  { value: 'inappropriate_content', label: '不当内容', description: '包含不适宜的文字、图片等' },
  { value: 'false_information', label: '虚假信息', description: '故意传播不实信息' },
  { value: 'spam', label: '垃圾信息', description: '重复发布、无意义内容' },
  { value: 'harassment', label: '骚扰他人', description: '恶意攻击、骚扰其他用户' },
  { value: 'copyright_violation', label: '版权侵犯', description: '未经授权使用他人作品' },
  { value: 'privacy_violation', label: '隐私侵犯', description: '泄露他人隐私信息' },
  { value: 'other', label: '其他', description: '其他违规行为' }
];

interface ReportContentProps {
  contentId: string;
  contentType: 'story' | 'comment' | 'voice';
  contentTitle?: string;
  onReport?: (reportData: ReportData) => void;
  trigger?: React.ReactNode;
}

export interface ReportData {
  contentId: string;
  contentType: string;
  reportType: string;
  description: string;
  reporterInfo?: {
    userAgent: string;
    timestamp: number;
    ip?: string;
  };
}

export const ReportContent: React.FC<ReportContentProps> = ({
  contentId,
  contentType,
  contentTitle,
  onReport,
  trigger
}) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleReport = async (values: any) => {
    setLoading(true);

    try {
      // 获取当前用户ID (从localStorage或其他地方)
      const userId = localStorage.getItem('user_id') || 'anonymous';

      const reportPayload = {
        content_type: contentType,
        content_id: parseInt(contentId),
        report_type: values.reportType,
        report_reason: values.description || '',
        user_id: userId
      };

      // 提交到后端API
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportPayload)
      });

      const result = await response.json();

      if (result.success) {
        message.success('举报已提交，感谢您的反馈');
        setVisible(false);
        form.resetFields();

        // 调用父组件的回调 (如果有)
        if (onReport) {
          const reportData: ReportData = {
            contentId,
            contentType,
            reportType: values.reportType,
            description: values.description || '',
            reporterInfo: {
              userAgent: navigator.userAgent,
              timestamp: Date.now()
            }
          };
          onReport(reportData);
        }
      } else {
        message.error('举报提交失败，请稍后重试');
      }

    } catch (error) {
      console.error('举报提交失败:', error);
      message.error('举报提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
  };

  const defaultTrigger = (
    <Button
      type="text"
      size="small"
      icon={<FlagOutlined />}
      onClick={() => setVisible(true)}
      className="report-trigger"
    >
      举报
    </Button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setVisible(true)}>
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}
      
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            举报内容
          </Space>
        }
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={500}
        className="report-modal"
      >
        <div className="report-content">
          {contentTitle && (
            <div className="content-info">
              <Text type="secondary">举报内容：</Text>
              <Text strong>{contentTitle}</Text>
            </div>
          )}
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleReport}
            className="report-form"
          >
            <Form.Item
              name="reportType"
              label="举报类型"
              rules={[{ required: true, message: '请选择举报类型' }]}
            >
              <Select placeholder="请选择举报类型" size="large">
                {reportTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    <div className="report-type-option">
                      <div className="type-label">{type.label}</div>
                      <div className="type-description">{type.description}</div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="description"
              label="详细说明"
              extra="请详细描述违规行为，帮助我们更好地处理"
            >
              <TextArea
                rows={4}
                placeholder="请详细描述违规行为..."
                maxLength={500}
                showCount
              />
            </Form.Item>
            
            <div className="report-notice">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                • 我们会认真对待每一个举报，并在24小时内处理
                <br />
                • 恶意举报可能导致账号受限
                <br />
                • 举报信息将被保密处理
              </Text>
            </div>
            
            <Form.Item className="form-actions">
              <Space>
                <Button onClick={handleCancel}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  danger
                >
                  提交举报
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  );
};

// 快速举报按钮组件
export const QuickReportButton: React.FC<{
  contentId: string;
  contentType: 'story' | 'comment' | 'voice';
  contentTitle?: string;
  size?: 'small' | 'middle' | 'large';
}> = ({ contentId, contentType, contentTitle, size = 'small' }) => {
  return (
    <ReportContent
      contentId={contentId}
      contentType={contentType}
      contentTitle={contentTitle}
      trigger={
        <Button
          type="text"
          size={size}
          icon={<FlagOutlined />}
          className="quick-report-btn"
        >
          举报
        </Button>
      }
    />
  );
};

// 获取举报统计
export const getReportStats = () => {
  const reports = JSON.parse(localStorage.getItem('content_reports') || '[]');
  const stats = {
    total: reports.length,
    byType: {} as Record<string, number>,
    byContentType: {} as Record<string, number>,
    recent: reports.filter((report: ReportData) => 
      Date.now() - report.reporterInfo!.timestamp < 7 * 24 * 60 * 60 * 1000
    ).length
  };
  
  reports.forEach((report: ReportData) => {
    stats.byType[report.reportType] = (stats.byType[report.reportType] || 0) + 1;
    stats.byContentType[report.contentType] = (stats.byContentType[report.contentType] || 0) + 1;
  });
  
  return stats;
};

export default ReportContent;
