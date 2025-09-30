# 安全防护开关系统设计方案

## 🎯 **设计理念**

设计一个灵活的开关系统，允许超级管理员在不重新部署的情况下动态控制各种安全防护功能，方便调试、问题排错和紧急响应。

## 🔧 **开关系统架构**

### **1. 开关配置结构**

```typescript
interface SecuritySwitchConfig {
  // Turnstile开关
  turnstile: {
    enabled: boolean;
    questionnaire: boolean;    // 问卷提交
    story: boolean;           // 故事发布
    registration: boolean;    // 用户注册
    login: boolean;          // 登录验证
    bypassInDev: boolean;    // 开发环境绕过
  };
  
  // IP频率限制开关
  rateLimit: {
    enabled: boolean;
    shortTerm: boolean;      // 短期限制
    mediumTerm: boolean;     // 中期限制
    longTerm: boolean;       // 长期限制
    ipReputation: boolean;   // IP信誉系统
    suspiciousDetection: boolean; // 可疑行为检测
  };
  
  // 内容质量检测开关
  contentQuality: {
    enabled: boolean;
    duplicateCheck: boolean;  // 重复内容检测
    spamDetection: boolean;   // 垃圾内容检测
    qualityScore: boolean;    // 质量评分
  };
  
  // 行为分析开关
  behaviorAnalysis: {
    enabled: boolean;
    mouseTracking: boolean;   // 鼠标行为追踪
    scrollTracking: boolean;  // 滚动行为追踪
    timingAnalysis: boolean;  // 时间模式分析
  };
  
  // 紧急模式
  emergency: {
    enabled: boolean;
    blockAllSubmissions: boolean;  // 阻止所有提交
    strictMode: boolean;           // 严格模式
    maintenanceMode: boolean;      // 维护模式
  };
  
  // 开发调试
  debug: {
    enabled: boolean;
    logAllRequests: boolean;   // 记录所有请求
    bypassAllChecks: boolean;  // 绕过所有检查
    verboseLogging: boolean;   // 详细日志
  };
}
```

### **2. 环境感知配置**

```typescript
// 默认配置 - 根据环境自动调整
const getDefaultSecurityConfig = (env: 'development' | 'staging' | 'production'): SecuritySwitchConfig => {
  const baseConfig: SecuritySwitchConfig = {
    turnstile: {
      enabled: true,
      questionnaire: true,
      story: true,
      registration: true,
      login: false, // 登录可能影响开发体验
      bypassInDev: env === 'development'
    },
    rateLimit: {
      enabled: true,
      shortTerm: true,
      mediumTerm: true,
      longTerm: true,
      ipReputation: env === 'production',
      suspiciousDetection: env !== 'development'
    },
    contentQuality: {
      enabled: env !== 'development',
      duplicateCheck: true,
      spamDetection: env === 'production',
      qualityScore: env === 'production'
    },
    behaviorAnalysis: {
      enabled: env !== 'development',
      mouseTracking: env === 'production',
      scrollTracking: env === 'production',
      timingAnalysis: env === 'production'
    },
    emergency: {
      enabled: false,
      blockAllSubmissions: false,
      strictMode: false,
      maintenanceMode: false
    },
    debug: {
      enabled: env === 'development',
      logAllRequests: env === 'development',
      bypassAllChecks: false,
      verboseLogging: env === 'development'
    }
  };

  return baseConfig;
};
```

## 🎛️ **超级管理员控制面板**

### **1. 前端控制界面**

```typescript
// frontend/src/components/admin/SecuritySwitchPanel.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Switch, Row, Col, Button, message, 
  Divider, Alert, Modal, Descriptions, Tag 
} from 'antd';
import { 
  SafetyOutlined, WarningOutlined, BugOutlined,
  ShieldOutlined, EyeOutlined, SettingOutlined
} from '@ant-design/icons';

export const SecuritySwitchPanel: React.FC = () => {
  const [config, setConfig] = useState<SecuritySwitchConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [environment, setEnvironment] = useState<string>('production');

  // 加载当前配置
  useEffect(() => {
    loadSecurityConfig();
  }, []);

  const loadSecurityConfig = async () => {
    try {
      const response = await fetch('/api/admin/security/config');
      const result = await response.json();
      setConfig(result.data.config);
      setEnvironment(result.data.environment);
    } catch (error) {
      message.error('加载安全配置失败');
    }
  };

  // 更新配置
  const updateConfig = async (newConfig: SecuritySwitchConfig) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/security/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig })
      });

      if (response.ok) {
        setConfig(newConfig);
        message.success('安全配置已更新');
      } else {
        throw new Error('更新失败');
      }
    } catch (error) {
      message.error('更新安全配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 紧急停止所有防护
  const emergencyStop = () => {
    Modal.confirm({
      title: '紧急停止确认',
      content: '这将关闭所有安全防护功能，仅在紧急情况下使用！',
      okText: '确认停止',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const emergencyConfig = { ...config };
        emergencyConfig.turnstile.enabled = false;
        emergencyConfig.rateLimit.enabled = false;
        emergencyConfig.contentQuality.enabled = false;
        emergencyConfig.behaviorAnalysis.enabled = false;
        emergencyConfig.debug.bypassAllChecks = true;
        updateConfig(emergencyConfig);
      }
    });
  };

  // 恢复默认配置
  const resetToDefault = () => {
    Modal.confirm({
      title: '恢复默认配置',
      content: '这将恢复当前环境的默认安全配置',
      onOk: async () => {
        try {
          const response = await fetch('/api/admin/security/config/reset', {
            method: 'POST'
          });
          if (response.ok) {
            await loadSecurityConfig();
            message.success('已恢复默认配置');
          }
        } catch (error) {
          message.error('恢复默认配置失败');
        }
      }
    });
  };

  if (!config) return <div>加载中...</div>;

  return (
    <div style={{ padding: '24px' }}>
      {/* 环境信息和紧急控制 */}
      <Card title="安全防护控制中心" style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="当前环境">
                <Tag color={environment === 'production' ? 'red' : 'blue'}>
                  {environment.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="配置状态">
                <Tag color={config.emergency.enabled ? 'red' : 'green'}>
                  {config.emergency.enabled ? '紧急模式' : '正常模式'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={16} style={{ textAlign: 'right' }}>
            <Button 
              danger 
              icon={<WarningOutlined />}
              onClick={emergencyStop}
              style={{ marginRight: 8 }}
            >
              紧急停止所有防护
            </Button>
            <Button 
              icon={<SettingOutlined />}
              onClick={resetToDefault}
              style={{ marginRight: 8 }}
            >
              恢复默认配置
            </Button>
            <Button 
              type="primary"
              loading={loading}
              onClick={() => updateConfig(config)}
            >
              保存配置
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 环境警告 */}
      {environment === 'production' && (
        <Alert
          message="生产环境警告"
          description="您正在生产环境中修改安全配置，请谨慎操作！"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Turnstile控制 */}
      <Card 
        title={<><SafetyOutlined /> Cloudflare Turnstile 人机验证</>}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <div>
              <strong>总开关</strong>
              <br />
              <Switch 
                checked={config.turnstile.enabled}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.turnstile.enabled = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
          <Col span={6}>
            <div>
              <strong>问卷提交</strong>
              <br />
              <Switch 
                checked={config.turnstile.questionnaire}
                disabled={!config.turnstile.enabled}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.turnstile.questionnaire = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
          <Col span={6}>
            <div>
              <strong>故事发布</strong>
              <br />
              <Switch 
                checked={config.turnstile.story}
                disabled={!config.turnstile.enabled}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.turnstile.story = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
          <Col span={6}>
            <div>
              <strong>用户注册</strong>
              <br />
              <Switch 
                checked={config.turnstile.registration}
                disabled={!config.turnstile.enabled}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.turnstile.registration = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
        </Row>
        
        {environment === 'development' && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message="开发环境选项"
              description={
                <div>
                  <strong>开发环境绕过: </strong>
                  <Switch 
                    checked={config.turnstile.bypassInDev}
                    onChange={(checked) => {
                      const newConfig = { ...config };
                      newConfig.turnstile.bypassInDev = checked;
                      setConfig(newConfig);
                    }}
                  />
                  <span style={{ marginLeft: 8 }}>
                    开启后在开发环境中自动通过Turnstile验证
                  </span>
                </div>
              }
              type="info"
            />
          </div>
        )}
      </Card>

      {/* IP频率限制控制 */}
      <Card 
        title={<><ShieldOutlined /> IP频率限制</>}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <div>
              <strong>总开关</strong>
              <br />
              <Switch 
                checked={config.rateLimit.enabled}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.rateLimit.enabled = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
          <Col span={6}>
            <div>
              <strong>短期限制 (1分钟)</strong>
              <br />
              <Switch 
                checked={config.rateLimit.shortTerm}
                disabled={!config.rateLimit.enabled}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.rateLimit.shortTerm = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
          <Col span={6}>
            <div>
              <strong>中期限制 (1小时)</strong>
              <br />
              <Switch 
                checked={config.rateLimit.mediumTerm}
                disabled={!config.rateLimit.enabled}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.rateLimit.mediumTerm = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
          <Col span={6}>
            <div>
              <strong>长期限制 (24小时)</strong>
              <br />
              <Switch 
                checked={config.rateLimit.longTerm}
                disabled={!config.rateLimit.enabled}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.rateLimit.longTerm = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* 调试模式控制 */}
      {environment === 'development' && (
        <Card 
          title={<><BugOutlined /> 调试模式</>}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div>
                <strong>绕过所有检查</strong>
                <br />
                <Switch 
                  checked={config.debug.bypassAllChecks}
                  onChange={(checked) => {
                    const newConfig = { ...config };
                    newConfig.debug.bypassAllChecks = checked;
                    setConfig(newConfig);
                  }}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  仅开发环境可用，用于调试
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <strong>详细日志</strong>
                <br />
                <Switch 
                  checked={config.debug.verboseLogging}
                  onChange={(checked) => {
                    const newConfig = { ...config };
                    newConfig.debug.verboseLogging = checked;
                    setConfig(newConfig);
                  }}
                />
              </div>
            </Col>
            <Col span={8}>
              <div>
                <strong>记录所有请求</strong>
                <br />
                <Switch 
                  checked={config.debug.logAllRequests}
                  onChange={(checked) => {
                    const newConfig = { ...config };
                    newConfig.debug.logAllRequests = checked;
                    setConfig(newConfig);
                  }}
                />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 紧急模式控制 */}
      <Card 
        title={<><WarningOutlined /> 紧急模式</>}
        style={{ marginBottom: 16 }}
      >
        <Alert
          message="紧急模式说明"
          description="紧急模式用于应对严重安全威胁或系统故障，启用后将严格限制或阻止用户操作"
          type="warning"
          style={{ marginBottom: 16 }}
        />
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div>
              <strong>阻止所有提交</strong>
              <br />
              <Switch 
                checked={config.emergency.blockAllSubmissions}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.emergency.blockAllSubmissions = checked;
                  newConfig.emergency.enabled = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
          <Col span={8}>
            <div>
              <strong>严格模式</strong>
              <br />
              <Switch 
                checked={config.emergency.strictMode}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.emergency.strictMode = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
          <Col span={8}>
            <div>
              <strong>维护模式</strong>
              <br />
              <Switch 
                checked={config.emergency.maintenanceMode}
                onChange={(checked) => {
                  const newConfig = { ...config };
                  newConfig.emergency.maintenanceMode = checked;
                  setConfig(newConfig);
                }}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
```
