/**
 * 登录分离测试页面
 * 用于验证新的登录入口分离功能
 */

import React from 'react';
import { Card, Button, Space, Typography, Divider, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { 
  UserOutlined, 
  SecurityScanOutlined,
  GoogleOutlined,
  HomeOutlined,
  ExperimentOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export const LoginSeparationTest: React.FC = () => {
  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <Card style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '8px' }}>
          <ExperimentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
          登录入口分离测试
        </Title>
        <Paragraph style={{ textAlign: 'center', color: '#666' }}>
          验证新的登录系统架构和Google OAuth集成
        </Paragraph>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        {/* 问卷用户登录 */}
        <Card 
          title={
            <Space>
              <UserOutlined style={{ color: '#52c41a' }} />
              <span>问卷用户登录</span>
            </Space>
          }
          style={{ height: 'fit-content' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              message="普通用户登录入口"
              description="支持A+B半匿名登录和Google一键注册"
              type="success"
              showIcon
            />
            
            <div>
              <Text strong>功能特点：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>A+B数字组合登录</li>
                <li>Google一键注册</li>
                <li>自动生成半匿名身份</li>
                <li>无需记忆复杂密码</li>
              </ul>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/auth/login">
                <Button type="primary" block size="large" icon={<UserOutlined />}>
                  A+B 登录入口
                </Button>
              </Link>
              
              <Button 
                block 
                size="large" 
                icon={<GoogleOutlined />}
                style={{ borderColor: '#4285f4', color: '#4285f4' }}
                onClick={() => {
                  // 这里可以直接触发Google登录
                  alert('Google登录功能演示（需要配置OAuth）');
                }}
              >
                Google 一键注册
              </Button>
            </Space>
          </Space>
        </Card>

        {/* 管理系统登录 */}
        <Card 
          title={
            <Space>
              <SecurityScanOutlined style={{ color: '#fa8c16' }} />
              <span>管理系统登录</span>
            </Space>
          }
          style={{ height: 'fit-content' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              message="管理员专用入口"
              description="独立登录页面，提高安全性"
              type="warning"
              showIcon
            />
            
            <div>
              <Text strong>安全特性：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>隐藏登录入口</li>
                <li>独立认证系统</li>
                <li>Google白名单验证</li>
                <li>访问日志记录</li>
              </ul>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/management-portal">
                <Button type="primary" block size="large" icon={<SecurityScanOutlined />}>
                  管理员登录入口
                </Button>
              </Link>
              
              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
                仅限授权管理员访问
              </Text>
            </Space>
          </Space>
        </Card>

        {/* 登录记录和安全监控 */}
        <Card
          title={
            <Space>
              <ExperimentOutlined style={{ color: '#722ed1' }} />
              <span>登录记录监控</span>
            </Space>
          }
          style={{ height: 'fit-content' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              message="安全监控功能"
              description="追踪登录历史，检测异常行为"
              type="info"
              showIcon
            />

            <div>
              <Text strong>功能特点：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>详细登录记录</li>
                <li>IP地址追踪</li>
                <li>设备信息识别</li>
                <li>异常登录检测</li>
                <li>风险评分系统</li>
              </ul>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/user/login-history">
                <Button type="primary" block size="large" icon={<ExperimentOutlined />}>
                  我的登录记录
                </Button>
              </Link>

              <Link to="/admin/login-monitor">
                <Button block size="large" icon={<ExperimentOutlined />}>
                  管理员监控台
                </Button>
              </Link>

              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
                帮助识别异常登录
              </Text>
            </Space>
          </Space>
        </Card>

        {/* IP访问控制管理 */}
        <Card
          title={
            <Space>
              <ExperimentOutlined style={{ color: '#fa541c' }} />
              <span>IP访问控制</span>
            </Space>
          }
          style={{ height: 'fit-content' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              message="高级安全功能"
              description="IP白名单/黑名单和访问时间限制"
              type="warning"
              showIcon
            />

            <div>
              <Text strong>功能特点：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>IP白名单/黑名单管理</li>
                <li>地理位置访问控制</li>
                <li>访问时间策略</li>
                <li>违规行为记录</li>
                <li>实时访问监控</li>
              </ul>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/admin/ip-access-control">
                <Button type="primary" block size="large" icon={<ExperimentOutlined />}>
                  IP访问控制
                </Button>
              </Link>

              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
                仅超级管理员可访问
              </Text>
            </Space>
          </Space>
        </Card>

        {/* 智能安全防护 */}
        <Card
          title={
            <Space>
              <ExperimentOutlined style={{ color: '#722ed1' }} />
              <span>智能安全防护</span>
            </Space>
          }
          style={{ height: 'fit-content' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              message="AI驱动的智能安全"
              description="机器学习异常检测和自动化安全响应"
              type="info"
              showIcon
            />

            <div>
              <Text strong>功能特点：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>机器学习异常检测</li>
                <li>实时威胁情报集成</li>
                <li>高级设备指纹识别</li>
                <li>自动化安全响应</li>
                <li>安全合规报告生成</li>
              </ul>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/admin/intelligent-security">
                <Button type="primary" block size="large" icon={<ExperimentOutlined />}>
                  智能安全管理
                </Button>
              </Link>

              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
                仅超级管理员可访问
              </Text>
            </Space>
          </Space>
        </Card>

        {/* 双因素认证 */}
        <Card
          title={
            <Space>
              <ExperimentOutlined style={{ color: '#52c41a' }} />
              <span>双因素认证</span>
            </Space>
          }
          style={{ height: 'fit-content' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              message="账号安全保护"
              description="TOTP、短信、邮箱多种2FA方式"
              type="success"
              showIcon
            />

            <div>
              <Text strong>功能特点：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>TOTP应用程序认证</li>
                <li>短信验证码</li>
                <li>邮箱验证码</li>
                <li>备用代码系统</li>
                <li>信任设备管理</li>
              </ul>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/user/two-factor">
                <Button type="primary" block size="large" icon={<ExperimentOutlined />}>
                  2FA设置
                </Button>
              </Link>

              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
                保护您的账号安全
              </Text>
            </Space>
          </Space>
        </Card>

        {/* Google OAuth白名单管理 */}
        <Card
          title={
            <Space>
              <GoogleOutlined style={{ color: '#4285f4' }} />
              <span>Google OAuth白名单</span>
            </Space>
          }
          style={{ height: 'fit-content' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              message="超级管理员功能"
              description="管理允许Google登录的邮箱白名单"
              type="info"
              showIcon
            />

            <div>
              <Text strong>功能特点：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>邮箱白名单管理</li>
                <li>角色权限分配</li>
                <li>使用记录追踪</li>
                <li>实时状态控制</li>
              </ul>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/admin/google-whitelist">
                <Button type="primary" block size="large" icon={<GoogleOutlined />}>
                  白名单管理
                </Button>
              </Link>

              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
                仅超级管理员可访问
              </Text>
            </Space>
          </Space>
        </Card>

        {/* 功能对比 */}
        <Card
          title="功能对比"
          style={{ gridColumn: '1 / -1' }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>功能</th>
                  <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>问卷用户</th>
                  <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>管理员</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>登录入口</td>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>主页面显示</td>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>独立隐藏页面</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>认证方式</td>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>A+B / Google</td>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>密码 / Google白名单</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>安全级别</td>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>标准</td>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>高级</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>注册门槛</td>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>无门槛</td>
                  <td style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'center' }}>需要授权</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* 测试说明 */}
        <Card 
          title="测试说明"
          style={{ gridColumn: '1 / -1' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Phase 1 完成项目：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>✅ 创建独立管理登录页面 (/management-portal)</li>
                <li>✅ 移除主页面的管理登录入口</li>
                <li>✅ 更新路由配置</li>
                <li>✅ 添加Google登录组件框架</li>
                <li>✅ 创建后端Google OAuth API</li>
              </ul>
            </div>

            <div>
              <Text strong>Phase 2 完成项目：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>✅ 配置Google OAuth客户端服务</li>
                <li>✅ 实现真实的Google登录流程</li>
                <li>✅ 创建管理员邮箱白名单管理页面</li>
                <li>✅ 实现数据库白名单存储</li>
                <li>✅ 添加白名单CRUD API</li>
                <li>✅ 集成环境变量配置</li>
              </ul>
            </div>

            <div>
              <Text strong>Phase 3 完成项目：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>✅ 创建登录记录数据库表</li>
                <li>✅ 实现登录记录服务</li>
                <li>✅ 集成IP地址和设备信息追踪</li>
                <li>✅ 创建用户登录历史页面</li>
                <li>✅ 实现管理员登录监控</li>
                <li>✅ 添加异常登录检测</li>
                <li>✅ 风险评分和安全警报</li>
              </ul>
            </div>

            <div>
              <Text strong>Phase 4 完成项目：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>✅ IP白名单/黑名单管理系统</li>
                <li>✅ 双因素认证(2FA)完整实现</li>
                <li>✅ 访问时间限制策略</li>
                <li>✅ 高级访问控制中间件</li>
                <li>✅ 速率限制和防护机制</li>
                <li>✅ 完整的安全事件记录</li>
              </ul>
            </div>

            <div>
              <Text strong>Phase 5 完成项目：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>✅ 机器学习异常检测引擎</li>
                <li>✅ 实时威胁情报集成系统</li>
                <li>✅ 高级设备指纹识别技术</li>
                <li>✅ 自动化安全响应机制</li>
                <li>✅ 安全合规报告生成器</li>
                <li>✅ 智能安全管理平台</li>
              </ul>
            </div>

            <div>
              <Text strong>下一步计划 (Phase 6)：</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>🔄 深度学习行为分析</li>
                <li>🔄 零信任架构实现</li>
                <li>🔄 区块链安全审计</li>
                <li>🔄 量子加密技术集成</li>
                <li>🔄 全球威胁情报网络</li>
              </ul>
            </div>

            <Divider />

            <div style={{ textAlign: 'center' }}>
              <Link to="/">
                <Button type="default" icon={<HomeOutlined />}>
                  返回首页
                </Button>
              </Link>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default LoginSeparationTest;
