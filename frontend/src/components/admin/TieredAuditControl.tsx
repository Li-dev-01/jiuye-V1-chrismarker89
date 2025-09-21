/**
 * 分级审核控制台
 * 提供审核级别切换、实时监控、统计展示等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Alert, Button, Switch, Statistic, Row, Col, Timeline, Badge,
  Progress, Modal, Form, Slider, Select, Space, Tag, Spin, message,
  Table, Tooltip, Input, Divider
} from 'antd';
import {
  ControlOutlined, BarChartOutlined, HistoryOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ReloadOutlined, SettingOutlined, TestTubeOutlined
} from '@ant-design/icons';
import { tieredAuditService, AuditLevel, AuditStats, AuditHistory, AuditResult } from '../../services/tieredAuditService';

const { Option } = Select;
const { TextArea } = Input;

// 使用从服务导入的类型
type AuditLevelStatus = AuditLevel;

const TieredAuditControl: React.FC = () => {
  const [status, setStatus] = useState<AuditLevelStatus | null>(null);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [history, setHistory] = useState<AuditHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const [testForm] = Form.useForm();

  const levelConfig = {
    level1: {
      name: '一级 (宽松)',
      color: '#52c41a',
      bgColor: '#f6ffed',
      borderColor: '#b7eb8f',
      description: '正常运营期，注重用户体验',
      icon: '🟢'
    },
    level2: {
      name: '二级 (标准)',
      color: '#faad14',
      bgColor: '#fffbe6',
      borderColor: '#ffe58f',
      description: '内容质量下降，平衡审核',
      icon: '🟡'
    },
    level3: {
      name: '三级 (严格)',
      color: '#ff4d4f',
      bgColor: '#fff2f0',
      borderColor: '#ffadd2',
      description: '恶意攻击期，严格把控',
      icon: '🔴'
    }
  };

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载状态、统计和历史
      const [statusData, statsData, historyData] = await Promise.all([
        tieredAuditService.getCurrentLevel(),
        tieredAuditService.getStats(),
        tieredAuditService.getHistory()
      ]);

      setStatus(statusData);
      setStats(statsData);
      setHistory(historyData);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 切换审核级别
  const switchLevel = async (newLevel: string) => {
    setSwitching(true);
    try {
      await tieredAuditService.switchLevel(newLevel as 'level1' | 'level2' | 'level3', 'admin');
      message.success(`成功切换到${tieredAuditService.getLevelInfo(newLevel as any).name}`);
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('切换级别失败:', error);
      message.error('切换级别失败，请检查网络连接');
    } finally {
      setSwitching(false);
    }
  };

  // 测试审核
  const testAudit = async (values: any) => {
    setTestLoading(true);
    try {
      const result = await tieredAuditService.testContent(
        values.content,
        values.content_type || 'story'
      );
      setTestResult(result);
      message.success('测试完成');
    } catch (error) {
      console.error('测试失败:', error);
      message.error('测试失败，请检查网络连接');
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // 每30秒自动刷新统计数据
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载分级审核控制台...</div>
      </div>
    );
  }

  const currentConfig = status ? levelConfig[status.current_level] : levelConfig.level1;
  const currentStats = stats?.current_hour_stats;

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <h2>
          <ControlOutlined style={{ marginRight: 8 }} />
          分级审核控制台
        </h2>
        <p style={{ color: '#666', margin: 0 }}>
          根据平台状态动态调整审核严格程度，平衡内容质量与用户体验
        </p>
      </div>

      {/* 当前状态概览 */}
      <Card
        title="当前状态"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            刷新
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              message={
                <Space>
                  <span style={{ fontSize: '16px' }}>
                    {currentConfig.icon} 当前级别: {currentConfig.name}
                  </span>
                  <Tag color={currentConfig.color}>
                    {status?.config.config_name}
                  </Tag>
                </Space>
              }
              description={currentConfig.description}
              type={status?.current_level === 'level1' ? 'success' :
                    status?.current_level === 'level2' ? 'warning' : 'error'}
              showIcon
              style={{
                backgroundColor: currentConfig.bgColor,
                borderColor: currentConfig.borderColor
              }}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="1小时提交量"
              value={currentStats?.total_submissions || 0}
              suffix="条"
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="违规率"
              value={currentStats?.violation_rate || 0}
              precision={1}
              suffix="%"
              valueStyle={{
                color: (currentStats?.violation_rate || 0) > 15 ? '#cf1322' : '#3f8600'
              }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="待审核队列"
              value={currentStats?.manual_review_count || 0}
              suffix="条"
              prefix={<CloseCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="独立IP数"
              value={currentStats?.unique_ips || 0}
              suffix="个"
              prefix={<CheckCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* 级别控制 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="级别切换控制">
            <Row gutter={[16, 16]}>
              {Object.entries(levelConfig).map(([level, config]) => (
                <Col xs={24} sm={8} key={level}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: status?.current_level === level ? config.bgColor : '#fafafa',
                      borderColor: status?.current_level === level ? config.borderColor : '#d9d9d9',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (status?.current_level !== level) {
                        Modal.confirm({
                          title: '确认切换审核级别',
                          content: `确定要切换到${config.name}吗？`,
                          onOk: () => switchLevel(level)
                        });
                      }
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', marginBottom: 8 }}>
                        {config.icon}
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                        {config.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {config.description}
                      </div>
                      {status?.current_level === level && (
                        <Badge
                          status="processing"
                          text="当前级别"
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <Divider />

            <Space>
              <Button
                type="primary"
                icon={<TestTubeOutlined />}
                onClick={() => setTestModalVisible(true)}
              >
                测试审核
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => message.info('配置功能开发中...')}
              >
                高级配置
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="级别配置信息">
            {status?.config && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>规则严格度:</strong>
                  <Progress
                    percent={status.config.rule_strictness * 100}
                    size="small"
                    strokeColor={currentConfig.color}
                  />
                </div>
                <div>
                  <strong>AI审核阈值:</strong>
                  <Progress
                    percent={status.config.ai_threshold * 100}
                    size="small"
                    strokeColor={currentConfig.color}
                  />
                </div>
                <div>
                  <strong>人工审核比例:</strong>
                  <Progress
                    percent={status.config.manual_review_ratio * 100}
                    size="small"
                    strokeColor={currentConfig.color}
                  />
                </div>
                <div>
                  <strong>启用规则类别:</strong>
                  <div style={{ marginTop: 4 }}>
                    {status.config.enabled_categories.map(category => (
                      <Tag key={category} color="blue" size="small">
                        {category}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* 切换历史 */}
      <Card title="切换历史" style={{ marginBottom: 24 }}>
        <Timeline>
          {history.slice(0, 10).map((record, index) => {
            const fromConfig = record.from_level ? levelConfig[record.from_level as keyof typeof levelConfig] : null;
            const toConfig = levelConfig[record.to_level as keyof typeof levelConfig];
            
            return (
              <Timeline.Item
                key={index}
                color={toConfig.color}
                dot={<span style={{ fontSize: '12px' }}>{toConfig.icon}</span>}
              >
                <div>
                  <strong>
                    {fromConfig ? `${fromConfig.name} → ` : ''}
                    {toConfig.name}
                  </strong>
                  <Tag color={record.switched_by === 'auto' ? 'green' : 'blue'} size="small" style={{ marginLeft: 8 }}>
                    {record.switched_by === 'auto' ? '自动' : '手动'}
                  </Tag>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  {record.trigger_reason}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(record.switched_at).toLocaleString()}
                </div>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </Card>

      {/* 测试模态框 */}
      <Modal
        title="审核测试"
        open={testModalVisible}
        onCancel={() => {
          setTestModalVisible(false);
          setTestResult(null);
          testForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={testForm}
          layout="vertical"
          onFinish={testAudit}
        >
          <Form.Item
            name="content_type"
            label="内容类型"
            initialValue="story"
          >
            <Select>
              <Option value="story">故事墙</Option>
              <Option value="heart_voice">心声</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="测试内容"
            rules={[{ required: true, message: '请输入测试内容' }]}
          >
            <TextArea
              rows={6}
              placeholder="输入要测试的内容..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={testLoading}>
                开始测试
              </Button>
              <Button onClick={() => testForm.resetFields()}>
                清空
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {testResult && (
          <Card title="测试结果" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="审核结果"
                  value={testResult.passed ? '通过' : '拒绝'}
                  valueStyle={{
                    color: testResult.passed ? '#3f8600' : '#cf1322'
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="风险分数"
                  value={testResult.risk_score}
                  precision={2}
                  valueStyle={{
                    color: testResult.risk_score > 0.7 ? '#cf1322' : '#3f8600'
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="处理动作"
                  value={testResult.action}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="置信度"
                  value={testResult.confidence}
                  precision={2}
                />
              </Col>
            </Row>

            {testResult.violations && testResult.violations.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>违规检测:</h4>
                <Space wrap>
                  {testResult.violations.map((violation: any, index: number) => (
                    <Tooltip
                      key={index}
                      title={`规则: ${violation.rule_id}, 置信度: ${violation.confidence}`}
                    >
                      <Tag color="red">
                        {violation.category}: {violation.matched_text}
                      </Tag>
                    </Tooltip>
                  ))}
                </Space>
              </div>
            )}
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default TieredAuditControl;
