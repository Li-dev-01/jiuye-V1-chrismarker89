/**
 * 认证系统测试页面
 * 用于测试两套独立认证系统的功能
 */

import React, { useState } from 'react';
import { Card, Typography, Space, Tag, Button, Divider, Row, Col, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';

// 问卷系统
import { useQuestionnaireAuthStore } from '../../stores/questionnaireAuthStore';
import { SemiAnonymousLoginModal } from '../../components/auth/SemiAnonymousLoginModal';
import { TEST_AB_COMBINATIONS } from '../../types/questionnaire-auth';
import { getQuestionnaireUserPermissionSummary } from '../../utils/questionnairePermissions';

// 管理系统
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { PRESET_MANAGEMENT_ACCOUNTS } from '../../types/management-auth';
import { getManagementUserPermissionSummary } from '../../utils/managementPermissions';

const { Text, Title } = Typography;

export const AuthSystemTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSemiAnonymousLogin, setShowSemiAnonymousLogin] = useState(false);

  // 问卷系统状态
  const questionnaireAuth = useQuestionnaireAuthStore();
  const questionnairePermissions = getQuestionnaireUserPermissionSummary(questionnaireAuth.currentUser);

  // 管理系统状态
  const managementAuth = useManagementAuthStore();
  const managementPermissions = getManagementUserPermissionSummary(managementAuth.currentUser);

  // 快速登录管理系统
  const handleQuickManagementLogin = async (account: typeof PRESET_MANAGEMENT_ACCOUNTS[0]) => {
    const success = await managementAuth.login({
      username: account.username,
      password: account.password,
      userType: account.userType
    });
    
    if (success) {
      console.log(`管理系统登录成功: ${account.name}`);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>双重认证系统测试页面</Title>
      
      <Alert
        message="系统架构说明"
        description="本系统现在使用两套完全独立的认证体系：问卷系统（半匿名用户）和管理系统（管理员/审核员）"
        type="info"
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 24]}>
        {/* 问卷系统 */}
        <Col xs={24} lg={12}>
          <Card title="问卷系统（半匿名用户）" size="small">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* 认证状态 */}
              <div>
                <Text strong>认证状态: </Text>
                <Tag color={questionnaireAuth.isAuthenticated ? 'green' : 'red'}>
                  {questionnaireAuth.isAuthenticated ? '已认证' : '未认证'}
                </Tag>
              </div>

              {/* 用户信息 */}
              {questionnaireAuth.currentUser && (
                <>
                  <div>
                    <Text strong>用户类型: </Text>
                    <Tag color="blue">{questionnaireAuth.currentUser.userType}</Tag>
                  </div>
                  
                  <div>
                    <Text strong>显示名称: </Text>
                    <Text>{questionnaireAuth.currentUser.display_name}</Text>
                  </div>
                  
                  <div>
                    <Text strong>UUID: </Text>
                    <Text code style={{ fontSize: '11px' }}>
                      {questionnaireAuth.currentUser.uuid}
                    </Text>
                  </div>
                </>
              )}

              {/* 权限摘要 */}
              <div>
                <Text strong>权限摘要:</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={questionnairePermissions.canSubmitQuestionnaire ? 'green' : 'red'} size="small">
                    提交问卷: {questionnairePermissions.canSubmitQuestionnaire ? '✓' : '✗'}
                  </Tag>
                  <Tag color={questionnairePermissions.canViewOwnSubmissions ? 'green' : 'red'} size="small">
                    查看提交: {questionnairePermissions.canViewOwnSubmissions ? '✓' : '✗'}
                  </Tag>
                  <Tag color={questionnairePermissions.canCreateContent ? 'green' : 'red'} size="small">
                    创建内容: {questionnairePermissions.canCreateContent ? '✓' : '✗'}
                  </Tag>
                  <Tag color={questionnairePermissions.canDownloadReports ? 'green' : 'red'} size="small">
                    下载报告: {questionnairePermissions.canDownloadReports ? '✓' : '✗'}
                  </Tag>
                </div>
              </div>

              {/* 操作按钮 */}
              <Space wrap>
                {!questionnaireAuth.isAuthenticated ? (
                  <Button 
                    type="primary" 
                    onClick={() => setShowSemiAnonymousLogin(true)}
                  >
                    A+B身份验证
                  </Button>
                ) : (
                  <Button onClick={questionnaireAuth.logout}>
                    登出问卷系统
                  </Button>
                )}
                
                <Button 
                  onClick={() => navigate('/questionnaire')}
                  disabled={!questionnairePermissions.canSubmitQuestionnaire}
                >
                  前往问卷页面
                </Button>
                
                <Button 
                  onClick={() => navigate('/my-submissions')}
                  disabled={!questionnairePermissions.canViewOwnSubmissions}
                >
                  查看我的提交
                </Button>
              </Space>

              {/* 测试组合 */}
              <div>
                <Text strong style={{ fontSize: '12px' }}>测试A+B组合:</Text>
                <div style={{ marginTop: 4 }}>
                  {TEST_AB_COMBINATIONS.slice(0, 3).map((combo, index) => (
                    <Tag key={index} style={{ fontSize: '10px' }}>
                      {combo.name}: {combo.a.substring(0, 3)}***{combo.a.substring(7)} / {combo.b}
                    </Tag>
                  ))}
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 管理系统 */}
        <Col xs={24} lg={12}>
          <Card title="管理系统（管理员/审核员）" size="small">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* 认证状态 */}
              <div>
                <Text strong>认证状态: </Text>
                <Tag color={managementAuth.isAuthenticated ? 'green' : 'red'}>
                  {managementAuth.isAuthenticated ? '已认证' : '未认证'}
                </Tag>
              </div>

              {/* 用户信息 */}
              {managementAuth.currentUser && (
                <>
                  <div>
                    <Text strong>用户类型: </Text>
                    <Tag color="orange">{managementAuth.currentUser.userType}</Tag>
                  </div>
                  
                  <div>
                    <Text strong>用户名: </Text>
                    <Text>{managementAuth.currentUser.username}</Text>
                  </div>
                  
                  <div>
                    <Text strong>显示名称: </Text>
                    <Text>{managementAuth.currentUser.display_name}</Text>
                  </div>
                </>
              )}

              {/* 权限摘要 */}
              <div>
                <Text strong>权限摘要:</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={managementPermissions.isAdmin ? 'green' : 'red'} size="small">
                    管理员: {managementPermissions.isAdmin ? '✓' : '✗'}
                  </Tag>
                  <Tag color={managementPermissions.isReviewer ? 'green' : 'red'} size="small">
                    审核员: {managementPermissions.isReviewer ? '✓' : '✗'}
                  </Tag>
                  <Tag color={managementPermissions.canManageUsers ? 'green' : 'red'} size="small">
                    用户管理: {managementPermissions.canManageUsers ? '✓' : '✗'}
                  </Tag>
                  <Tag color={managementPermissions.canReviewContent ? 'green' : 'red'} size="small">
                    内容审核: {managementPermissions.canReviewContent ? '✓' : '✗'}
                  </Tag>
                </div>
              </div>

              {/* 操作按钮 */}
              <Space wrap>
                {!managementAuth.isAuthenticated ? (
                  <Button 
                    type="primary" 
                    onClick={() => navigate('/admin/login')}
                  >
                    前往登录页面
                  </Button>
                ) : (
                  <Button onClick={managementAuth.logout}>
                    登出管理系统
                  </Button>
                )}
                
                <Button 
                  onClick={() => navigate('/admin')}
                  disabled={!managementPermissions.isAdmin}
                >
                  前往管理页面
                </Button>
                
                <Button 
                  onClick={() => navigate('/reviewer/dashboard')}
                  disabled={!managementPermissions.isReviewer}
                >
                  前往审核页面
                </Button>
              </Space>

              {/* 快速登录 */}
              <div>
                <Text strong style={{ fontSize: '12px' }}>快速登录:</Text>
                <div style={{ marginTop: 4 }}>
                  <Space wrap size="small">
                    {PRESET_MANAGEMENT_ACCOUNTS.map((account, index) => (
                      <Button
                        key={index}
                        size="small"
                        onClick={() => handleQuickManagementLogin(account)}
                        style={{ fontSize: '10px' }}
                      >
                        {account.name}
                      </Button>
                    ))}
                  </Space>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 系统状态对比 */}
      <Card title="系统状态对比" size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Text strong>问卷系统存储键:</Text>
            <div style={{ fontSize: '11px', color: '#666', marginTop: 4 }}>
              <div>questionnaire_current_user</div>
              <div>questionnaire_current_session</div>
              <div>questionnaire-auth-storage</div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Text strong>管理系统存储键:</Text>
            <div style={{ fontSize: '11px', color: '#666', marginTop: 4 }}>
              <div>management_current_user</div>
              <div>management_current_session</div>
              <div>management-auth-storage</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 半匿名登录模态框 */}
      <SemiAnonymousLoginModal
        visible={showSemiAnonymousLogin}
        onClose={() => setShowSemiAnonymousLogin(false)}
        onSuccess={() => {
          console.log('半匿名用户登录成功');
        }}
      />
    </div>
  );
};
