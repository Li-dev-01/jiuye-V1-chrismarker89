/**
 * API版本管理组件
 * 提供版本选择、切换和配置功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Switch,
  Button,
  Alert,
  Descriptions,
  Tag,
  Space,
  Modal,
  Form,
  message,
  Tooltip,
  Badge,
  Divider,
  Typography,
  List,
  Spin
} from 'antd';
import {
  ApiOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import {
  apiVersionManager,
  versionUtils,
  type ApiVersion,
  type VersionInfo,
  type VersionPreferences,
  SUPPORTED_API_VERSIONS,
  VERSION_CONFIG
} from '../../config/versionConfig';
import styles from './ApiVersionManager.module.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ApiVersionManagerProps {
  onVersionChange?: (version: ApiVersion) => void;
  showAdvancedSettings?: boolean;
  compact?: boolean;
}

const ApiVersionManager: React.FC<ApiVersionManagerProps> = ({
  onVersionChange,
  showAdvancedSettings = true,
  compact = false
}) => {
  const [currentVersion, setCurrentVersion] = useState<ApiVersion>(apiVersionManager.getCurrentVersion());
  const [preferences, setPreferences] = useState<VersionPreferences>(apiVersionManager.getPreferences());
  const [serverVersionInfo, setServerVersionInfo] = useState<Record<ApiVersion, VersionInfo> | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 加载服务器版本信息
  useEffect(() => {
    loadServerVersionInfo();
  }, []);

  /**
   * 加载服务器版本信息
   */
  const loadServerVersionInfo = async () => {
    setLoading(true);
    try {
      const versionInfo = await apiVersionManager.fetchVersionInfo();
      setServerVersionInfo(versionInfo);
      
      if (versionInfo) {
        message.success('版本信息已更新');
      }
    } catch (error) {
      console.error('加载版本信息失败:', error);
      message.error('加载版本信息失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理版本切换
   */
  const handleVersionChange = (version: ApiVersion) => {
    const success = apiVersionManager.setCurrentVersion(version);
    
    if (success) {
      setCurrentVersion(version);
      message.success(`已切换到API ${versionUtils.formatVersion(version)}`);
      
      // 通知父组件
      if (onVersionChange) {
        onVersionChange(version);
      }
    } else {
      message.error('版本切换失败');
    }
  };

  /**
   * 处理偏好设置更新
   */
  const handlePreferencesUpdate = (values: any) => {
    const newPreferences: Partial<VersionPreferences> = {
      autoUpgrade: values.autoUpgrade,
      fallbackToV1: values.fallbackToV1,
      showVersionWarnings: values.showVersionWarnings
    };

    apiVersionManager.updatePreferences(newPreferences);
    setPreferences(apiVersionManager.getPreferences());
    setSettingsModalVisible(false);
    message.success('偏好设置已保存');
  };

  /**
   * 重置为默认设置
   */
  const handleResetToDefaults = () => {
    Modal.confirm({
      title: '重置版本设置',
      content: '确定要重置所有版本设置为默认值吗？',
      onOk: () => {
        apiVersionManager.resetToDefaults();
        setCurrentVersion(apiVersionManager.getCurrentVersion());
        setPreferences(apiVersionManager.getPreferences());
        message.success('已重置为默认设置');
      }
    });
  };

  /**
   * 获取版本状态图标
   */
  const getVersionStatusIcon = (version: ApiVersion) => {
    const info = VERSION_CONFIG[version];
    if (info.isDeprecated) {
      return <WarningOutlined style={{ color: '#ff4d4f' }} />;
    }
    if (version === apiVersionManager.getRecommendedVersion()) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
  };

  /**
   * 获取版本描述
   */
  const getVersionDescription = (version: ApiVersion): VersionInfo => {
    return serverVersionInfo?.[version] || VERSION_CONFIG[version];
  };

  // 紧凑模式渲染
  if (compact) {
    return (
      <Space>
        <Text>API版本:</Text>
        <Select
          value={currentVersion}
          onChange={handleVersionChange}
          style={{ width: 80 }}
          size="small"
        >
          {SUPPORTED_API_VERSIONS.map(version => (
            <Option key={version} value={version}>
              <Space>
                {getVersionStatusIcon(version)}
                {version.toUpperCase()}
              </Space>
            </Option>
          ))}
        </Select>
        
        {showAdvancedSettings && (
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => setSettingsModalVisible(true)}
          />
        )}
      </Space>
    );
  }

  return (
    <div className={styles.container}>
      <Card
        title={
          <Space>
            <ApiOutlined />
            <span>API版本管理</span>
            <Badge count={SUPPORTED_API_VERSIONS.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadServerVersionInfo}
              loading={loading}
              size="small"
            >
              刷新
            </Button>
            {showAdvancedSettings && (
              <Button
                icon={<SettingOutlined />}
                onClick={() => setSettingsModalVisible(true)}
                size="small"
              >
                设置
              </Button>
            )}
          </Space>
        }
      >
        {/* 当前版本信息 */}
        <div className={styles.currentVersion}>
          <Title level={4}>当前版本</Title>
          <Space size="large">
            <Select
              value={currentVersion}
              onChange={handleVersionChange}
              style={{ width: 120 }}
            >
              {SUPPORTED_API_VERSIONS.map(version => (
                <Option key={version} value={version}>
                  <Space>
                    {getVersionStatusIcon(version)}
                    {version.toUpperCase()}
                  </Space>
                </Option>
              ))}
            </Select>
            
            <Tag color={versionUtils.getVersionColor(currentVersion)}>
              {versionUtils.getVersionStatus(currentVersion)}
            </Tag>
          </Space>
        </div>

        <Divider />

        {/* 版本详情 */}
        <div className={styles.versionDetails}>
          <Title level={4}>版本详情</Title>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="版本号">
              {currentVersion.toUpperCase()}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Space>
                {getVersionStatusIcon(currentVersion)}
                <span>{versionUtils.getVersionStatus(currentVersion)}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="兼容版本">
              <Space>
                {getVersionDescription(currentVersion).compatibleVersions.map(v => (
                  <Tag key={v}>{v.toUpperCase()}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="描述">
              {getVersionDescription(currentVersion).description}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider />

        {/* 功能特性 */}
        <div className={styles.features}>
          <Title level={4}>功能特性</Title>
          <List
            size="small"
            dataSource={getVersionDescription(currentVersion).features}
            renderItem={feature => (
              <List.Item>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                {feature}
              </List.Item>
            )}
          />
        </div>

        {/* 版本警告 */}
        {apiVersionManager.isVersionDeprecated(currentVersion) && (
          <Alert
            message="版本已弃用"
            description={`当前使用的版本 ${currentVersion.toUpperCase()} 已被弃用，建议升级到 ${apiVersionManager.getRecommendedVersion().toUpperCase()}`}
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => handleVersionChange(apiVersionManager.getRecommendedVersion())}
              >
                立即升级
              </Button>
            }
          />
        )}

        {/* 服务器连接状态 */}
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Spin size="small" />
            <Text style={{ marginLeft: 8 }}>正在获取版本信息...</Text>
          </div>
        ) : serverVersionInfo ? (
          <Alert
            message="服务器连接正常"
            description="版本信息已从服务器同步"
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        ) : (
          <Alert
            message="无法连接服务器"
            description="使用本地版本信息，某些功能可能不可用"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* 设置模态框 */}
      <Modal
        title="版本管理设置"
        open={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={preferences}
          onFinish={handlePreferencesUpdate}
        >
          <Form.Item
            name="autoUpgrade"
            label="自动升级"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Text type="secondary">
            启用后，系统将自动使用最新的推荐版本
          </Text>

          <Form.Item
            name="fallbackToV1"
            label="回退到V1"
            valuePropName="checked"
            style={{ marginTop: 16 }}
          >
            <Switch />
          </Form.Item>
          <Text type="secondary">
            当新版本出现问题时，自动回退到稳定的V1版本
          </Text>

          <Form.Item
            name="showVersionWarnings"
            label="显示版本警告"
            valuePropName="checked"
            style={{ marginTop: 16 }}
          >
            <Switch />
          </Form.Item>
          <Text type="secondary">
            显示版本弃用、兼容性等相关警告信息
          </Text>

          <Divider />

          <Space>
            <Button type="primary" htmlType="submit">
              保存设置
            </Button>
            <Button onClick={() => setSettingsModalVisible(false)}>
              取消
            </Button>
            <Button danger onClick={handleResetToDefaults}>
              重置默认
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default ApiVersionManager;
