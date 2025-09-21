/**
 * AI成本控制页面
 * 
 * 管理AI服务的成本预算、监控和优化
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Form,
  InputNumber,
  Switch,
  Button,
  Space,
  Typography,
  Alert,
  Table,
  Tag,
  Select,
  message
} from 'antd';
import {
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  LineChartOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../../components/layout/RoleBasedLayout';
// import { realAIService } from '../../../services/realAIService'; // 已移动到归档目录
import type { CostControlConfig } from '../../../types/ai-water-management';

const { Title, Text } = Typography;
const { Option } = Select;

export const AICostControlPage: React.FC = () => {
  const [config, setConfig] = useState<CostControlConfig | null>(null);
  const [costAnalysis, setCostAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // 加载成本控制配置
  const loadConfig = async () => {
    setLoading(true);
    try {
      // const configData = await realAIService.getCostControlConfig(); // 服务已移动到归档目录
      const configData = { // 使用模拟数据
        dailyBudget: 10.0,
        monthlyBudget: 300.0,
        alertThreshold: 80,
        autoStop: false
      };
      const analysisData = {
        dailyCost: 5.11,
        monthlyCost: 148.50,
        averageDailyCost: 4.95,
        projectedMonthlyCost: 148.50,
        costSavings: 23.40
      };

      setConfig(configData);
      setCostAnalysis(analysisData);

      // 设置表单值
      form.setFieldsValue({
        dailyBudget: configData.dailyBudget,
        monthlyBudget: configData.monthlyBudget,
        dailyAlert: configData.alertThresholds.daily,
        monthlyAlert: configData.alertThresholds.monthly,
        autoSwitchToLowerCost: configData.costOptimization.autoSwitchToLowerCost,
        costThresholdMultiplier: configData.costOptimization.costThresholdMultiplier,
        qualityMinimumThreshold: configData.costOptimization.qualityMinimumThreshold
      });
    } catch (error) {
      message.error('加载配置失败');
      console.error('加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const newConfig: Partial<CostControlConfig> = {
        dailyBudget: values.dailyBudget,
        monthlyBudget: values.monthlyBudget,
        alertThresholds: {
          daily: values.dailyAlert,
          monthly: values.monthlyAlert
        },
        costOptimization: {
          enabled: true,
          autoSwitchToLowerCost: values.autoSwitchToLowerCost,
          costThresholdMultiplier: values.costThresholdMultiplier,
          qualityMinimumThreshold: values.qualityMinimumThreshold
        }
      };

      await aiWaterManagementService.updateCostControlConfig(newConfig);
      message.success('配置保存成功');
      loadConfig(); // 重新加载配置
    } catch (error) {
      message.error('保存配置失败');
      console.error('保存配置失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadConfig();
  }, []);

  // 获取预算使用率颜色
  const getBudgetColor = (utilization: number) => {
    if (utilization >= 0.9) return '#ff4d4f';
    if (utilization >= 0.8) return '#faad14';
    if (utilization >= 0.6) return '#1890ff';
    return '#52c41a';
  };

  // 获取预算状态
  const getBudgetStatus = (utilization: number) => {
    if (utilization >= 0.9) return { status: 'exception', text: '预算紧张' };
    if (utilization >= 0.8) return { status: 'active', text: '预算预警' };
    if (utilization >= 0.6) return { status: 'normal', text: '使用正常' };
    return { status: 'success', text: '使用良好' };
  };

  if (!config || !costAnalysis) {
    return (
      <AdminLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <DollarOutlined spin style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3}>正在加载成本控制数据...</Title>
        </div>
      </AdminLayout>
    );
  }

  const dailyUtilization = costAnalysis.dailyCost / config.dailyBudget;
  const monthlyUtilization = costAnalysis.monthlyCost / config.monthlyBudget;
  const dailyStatus = getBudgetStatus(dailyUtilization);
  const monthlyStatus = getBudgetStatus(monthlyUtilization);

  return (
    <AdminLayout>
      <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: 24, padding: 24, background: 'white', borderRadius: 8 }}>
          <Title level={2}>
            <DollarOutlined /> AI成本控制
          </Title>
          <Text type="secondary">
            管理AI服务的成本预算、监控和优化策略
          </Text>
        </div>

        {/* 预算概览 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日预算"
                value={config.dailyBudget}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日使用"
                value={costAnalysis.dailyCost}
                precision={2}
                prefix="$"
                valueStyle={{ color: getBudgetColor(dailyUtilization) }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="月度预算"
                value={config.monthlyBudget}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="月度使用"
                value={costAnalysis.monthlyCost}
                precision={2}
                prefix="$"
                valueStyle={{ color: getBudgetColor(monthlyUtilization) }}
              />
            </Card>
          </Col>
        </Row>

        {/* 预算使用情况 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="今日预算使用" extra={<Tag color={getBudgetColor(dailyUtilization)}>{dailyStatus.text}</Tag>}>
              <Progress
                type="circle"
                percent={dailyUtilization * 100}
                strokeColor={getBudgetColor(dailyUtilization)}
                format={(percent) => `${percent?.toFixed(1)}%`}
                size={120}
              />
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary">
                  剩余预算: ${(config.dailyBudget - costAnalysis.dailyCost).toFixed(2)}
                </Text>
              </div>
              
              {dailyUtilization >= 0.8 && (
                <Alert
                  message="预算预警"
                  description={`今日预算使用已达${(dailyUtilization * 100).toFixed(1)}%，请注意控制使用量`}
                  type={dailyUtilization >= 0.9 ? 'error' : 'warning'}
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="月度预算使用" extra={<Tag color={getBudgetColor(monthlyUtilization)}>{monthlyStatus.text}</Tag>}>
              <Progress
                type="circle"
                percent={monthlyUtilization * 100}
                strokeColor={getBudgetColor(monthlyUtilization)}
                format={(percent) => `${percent?.toFixed(1)}%`}
                size={120}
              />
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary">
                  剩余预算: ${(config.monthlyBudget - costAnalysis.monthlyCost).toFixed(2)}
                </Text>
              </div>
              
              {monthlyUtilization >= 0.8 && (
                <Alert
                  message="预算预警"
                  description={`月度预算使用已达${(monthlyUtilization * 100).toFixed(1)}%，请注意控制使用量`}
                  type={monthlyUtilization >= 0.9 ? 'error' : 'warning'}
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* 成本配置 */}
        <Card title="成本控制配置" extra={<SettingOutlined />} style={{ marginBottom: 24 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Title level={4}>预算设置</Title>
                <Form.Item
                  name="dailyBudget"
                  label="每日预算 ($)"
                  rules={[{ required: true, message: '请输入每日预算' }]}
                >
                  <InputNumber
                    min={0}
                    max={1000}
                    step={1}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="50.00"
                  />
                </Form.Item>
                
                <Form.Item
                  name="monthlyBudget"
                  label="每月预算 ($)"
                  rules={[{ required: true, message: '请输入每月预算' }]}
                >
                  <InputNumber
                    min={0}
                    max={10000}
                    step={10}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="1500.00"
                  />
                </Form.Item>
                
                <Form.Item
                  name="dailyAlert"
                  label="每日预警阈值 ($)"
                  rules={[{ required: true, message: '请输入每日预警阈值' }]}
                >
                  <InputNumber
                    min={0}
                    max={1000}
                    step={1}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="40.00"
                  />
                </Form.Item>
                
                <Form.Item
                  name="monthlyAlert"
                  label="每月预警阈值 ($)"
                  rules={[{ required: true, message: '请输入每月预警阈值' }]}
                >
                  <InputNumber
                    min={0}
                    max={10000}
                    step={10}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="1200.00"
                  />
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Title level={4}>优化策略</Title>
                <Form.Item
                  name="autoSwitchToLowerCost"
                  label="自动切换到低成本服务"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name="costThresholdMultiplier"
                  label="成本阈值倍数"
                  tooltip="当成本超过此倍数时触发优化"
                >
                  <InputNumber
                    min={1}
                    max={5}
                    step={0.1}
                    precision={1}
                    style={{ width: '100%' }}
                    placeholder="1.5"
                  />
                </Form.Item>
                
                <Form.Item
                  name="qualityMinimumThreshold"
                  label="最低质量阈值"
                  tooltip="优化时保持的最低质量标准"
                >
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.1}
                    precision={1}
                    style={{ width: '100%' }}
                    placeholder="0.8"
                  />
                </Form.Item>
                
                <Form.Item style={{ marginTop: 32 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                    size="large"
                  >
                    保存配置
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 成本趋势分析 */}
        <Card title="成本趋势分析" extra={<LineChartOutlined />}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="平均每日成本"
                value={costAnalysis.averageDailyCost || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="预计月度成本"
                value={costAnalysis.projectedMonthlyCost || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="成本节省"
                value={costAnalysis.costSavings || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
          
          {costAnalysis.projectedMonthlyCost > config.monthlyBudget && (
            <Alert
              message="预算超支预警"
              description={`按当前使用趋势，本月预计成本将达到 $${costAnalysis.projectedMonthlyCost.toFixed(2)}，超出预算 $${(costAnalysis.projectedMonthlyCost - config.monthlyBudget).toFixed(2)}`}
              type="error"
              showIcon
              style={{ marginTop: 16 }}
              action={
                <Button size="small" type="primary" ghost>
                  查看优化建议
                </Button>
              }
            />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};
