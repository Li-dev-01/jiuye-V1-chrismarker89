/**
 * 违规内容管理页面
 * 展示被审核拒绝的违规内容，用于管理和分析
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Typography, 
  Input, Select, message, Tooltip, Statistic, Row, Col,
  Alert, Descriptions, Divider, Badge, Timeline, List
} from 'antd';
import {
  EyeOutlined, DeleteOutlined, ReloadOutlined, FilterOutlined,
  ExclamationCircleOutlined, WarningOutlined, InfoCircleOutlined,
  ClockCircleOutlined, UserOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useAuth } from '../../stores/universalAuthStore';
import { violationContentService } from '../../services/violationContentService';
import type { ViolationRecord } from '../../services/violationContentService';
import styles from './ViolationContentPage.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

// ViolationRecord 类型已从 violationContentService 导入

const ViolationContentPage: React.FC = () => {
  const { user } = useAuth();
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [selectedViolation, setSelectedViolation] = useState<ViolationRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadViolationContent();
    loadViolationStats();
  }, [currentPage, pageSize, contentTypeFilter, severityFilter]);

  // 加载违规内容列表
  const loadViolationContent = async () => {
    setLoading(true);
    try {
      const result = await violationContentService.getViolationContent({
        page: currentPage,
        pageSize: pageSize,
        contentType: contentTypeFilter as any,
        severity: severityFilter as any
      });

      if (result.success && result.data) {
        setViolations(result.data.violations);
        setTotal(result.data.total);
      } else {
        message.error('加载违规内容失败: ' + result.error);
      }
    } catch (error) {
      message.error('加载违规内容失败');
      console.error('Load violation content error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载违规统计
  const loadViolationStats = async () => {
    try {
      const result = await violationContentService.getViolationStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Load violation stats error:', error);
    }
  };

  // 查看详情
  const handleViewDetail = (violation: ViolationRecord) => {
    setSelectedViolation(violation);
    setDetailVisible(true);
  };

  // 删除违规记录
  const handleDeleteViolation = (violationId: number) => {
    confirm({
      title: '删除违规记录',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这条违规记录吗？删除后无法恢复。',
      onOk: async () => {
        try {
          const result = await violationContentService.deleteViolationRecord(violationId);
          if (result.success) {
            setViolations(prev => prev.filter(v => v.id !== violationId));
            message.success('违规记录已删除');
          } else {
            message.error('删除失败: ' + result.error);
          }
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // 获取严重程度颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'default';
    }
  };

  // 获取严重程度文本
  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '内容类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'heart_voice' ? 'red' : 'blue'}>
          {type === 'heart_voice' ? '问卷心声' : '就业故事'}
        </Tag>
      )
    },
    {
      title: '内容预览',
      key: 'content',
      width: 300,
      render: (record: ViolationRecord) => (
        <div>
          {record.contentTitle && (
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              {record.contentTitle}
            </Text>
          )}
          <Text type="secondary" ellipsis>
            {record.contentPreview}
          </Text>
        </div>
      )
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      key: 'authorName',
      width: 120
    },
    {
      title: '违规类型',
      dataIndex: 'violationType',
      key: 'violationType',
      width: 120,
      render: (type: string) => (
        <Tag color="volcano">{type}</Tag>
      )
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>
          {getSeverityText(severity)}
        </Tag>
      )
    },
    {
      title: '审核员',
      dataIndex: 'reviewerName',
      key: 'reviewerName',
      width: 120
    },
    {
      title: '拒绝时间',
      dataIndex: 'rejectedAt',
      key: 'rejectedAt',
      width: 150,
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (record: ViolationRecord) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          
          <Tooltip title="删除记录">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              danger
              onClick={() => handleDeleteViolation(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className={styles.violationContent}>
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <Title level={2} className={styles.pageTitle}>
          <WarningOutlined className={styles.warningIcon} />
          违规内容管理
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadViolationContent}
          className={styles.refreshButton}
        >
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} className={styles.statsRow}>
          <Col span={6}>
            <Card className={styles.statCard}>
              <Statistic
                title="总违规数"
                value={stats.total_violations}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className={styles.statCard}>
              <Statistic
                title="今日新增"
                value={stats.today_violations}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className={styles.statCard}>
              <Statistic
                title="高危内容"
                value={stats.high_severity}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className={styles.statCard}>
              <Statistic
                title="常见类型"
                value={stats.most_common_type}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 提示信息 */}
      <Alert
        message="违规内容管理说明"
        description="此页面展示所有被审核拒绝的违规内容，用于分析违规模式和优化审核规则。请谨慎处理用户隐私信息。"
        type="warning"
        showIcon
        className={styles.alertInfo}
      />

      {/* 筛选器 */}
      <Card className={styles.filterCard}>
        <div className={styles.filterSpace}>
          <Select
            placeholder="内容类型"
            className={styles.filterSelect}
            value={contentTypeFilter}
            onChange={setContentTypeFilter}
            allowClear
          >
            <Option value="heart_voice">问卷心声</Option>
            <Option value="story">就业故事</Option>
          </Select>

          <Select
            placeholder="严重程度"
            className={styles.filterSelect}
            value={severityFilter}
            onChange={setSeverityFilter}
            allowClear
          >
            <Option value="high">高</Option>
            <Option value="medium">中</Option>
            <Option value="low">低</Option>
          </Select>

          <Button
            icon={<FilterOutlined />}
            onClick={loadViolationContent}
            className={styles.filterButton}
          >
            筛选
          </Button>
        </div>
      </Card>

      {/* 违规内容列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={violations}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条违规记录`,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
              }
            }
          }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="违规内容详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedViolation && (
          <div>
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="内容类型">
                <Tag color={selectedViolation.contentType === 'heart_voice' ? 'red' : 'blue'}>
                  {selectedViolation.contentType === 'heart_voice' ? '问卷心声' : '就业故事'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="作者">
                {selectedViolation.authorName}
              </Descriptions.Item>
              <Descriptions.Item label="违规类型">
                <Tag color="volcano">{selectedViolation.violationType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag color={getSeverityColor(selectedViolation.severity)}>
                  {getSeverityText(selectedViolation.severity)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="审核员">
                {selectedViolation.reviewerName}
              </Descriptions.Item>
              <Descriptions.Item label="拒绝时间">
                {selectedViolation.rejectedAt}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <div className={styles.detailSection}>
              <Text strong>内容预览：</Text>
              <div className={styles.contentPreviewBox}>
                {selectedViolation.contentTitle && (
                  <div className={styles.contentTitleInBox}>
                    {selectedViolation.contentTitle}
                  </div>
                )}
                <div>{selectedViolation.contentPreview}</div>
              </div>
            </div>

            <div className={styles.detailSection}>
              <Text strong>拒绝原因：</Text>
              <div className={styles.rejectionReason}>
                {selectedViolation.rejectionReason}
              </div>
            </div>

            <div>
              <Text strong>审核备注：</Text>
              <div className={styles.reviewNotes}>
                {selectedViolation.reviewNotes}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViolationContentPage;
