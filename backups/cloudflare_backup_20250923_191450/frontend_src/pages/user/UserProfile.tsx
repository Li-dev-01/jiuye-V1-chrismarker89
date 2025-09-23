import React, { useState } from 'react';
import { Card, Typography, Space, Divider, Form, Input, Button, message, Tag, Alert } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../../stores/universalAuthStore';

const { Title, Text } = Typography;

export const UserProfile: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  if (!isAuthenticated || !currentUser) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <Alert message="请先登录后查看个人信息" type="warning" />
        </Card>
      </div>
    );
  }

  const isGoogleLogin = currentUser.userType === 'GOOGLE_OAUTH';
  const isABCodeUser = currentUser.userType === 'semi_anonymous' || currentUser.userType === 'SEMI_ANONYMOUS';

  const handleSave = async (values: any) => {
    try {
      // TODO: 实现保存用户信息的API调用
      console.log('保存用户信息:', values);
      message.success('个人信息保存成功');
      setEditing(false);
    } catch (error) {
      message.error('保存失败，请稍后重试');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2}>
              <UserOutlined style={{ marginRight: '8px' }} />
              个人信息
            </Title>
            {!editing && (
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => setEditing(true)}
              >
                编辑
              </Button>
            )}
          </div>
          
          <Divider />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              displayName: currentUser.displayName,
              username: currentUser.username,
              email: currentUser.email
            }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>当前登录账号：</Text>
                <Text style={{ marginLeft: '8px' }}>
                  {currentUser.username || currentUser.email || currentUser.uuid?.slice(-8)}
                </Text>
              </div>

              <div>
                <Text strong>登录方式：</Text>
                <Tag color={isGoogleLogin ? 'blue' : 'green'} style={{ marginLeft: '8px' }}>
                  {isGoogleLogin ? '一键登录 (Google)' : isABCodeUser ? 'A+B码登录' : '手动登录'}
                </Tag>
              </div>

              {currentUser.identityA && currentUser.identityB && (
                <div>
                  <Text strong>A+B码：</Text>
                  <Space style={{ marginLeft: '8px' }}>
                    <Text code>{currentUser.identityA}</Text>
                    <Text>+</Text>
                    {editing && !isGoogleLogin ? (
                      <Form.Item name="identityB" style={{ margin: 0 }}>
                        <Input 
                          placeholder="输入新的B码" 
                          style={{ width: '120px' }}
                          maxLength={6}
                        />
                      </Form.Item>
                    ) : (
                      <Text code>{currentUser.identityB}</Text>
                    )}
                  </Space>
                  {isGoogleLogin && (
                    <div style={{ marginTop: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        一键登录用户的A+B码不可修改
                      </Text>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Text strong>显示名称：</Text>
                {editing ? (
                  <Form.Item name="displayName" style={{ margin: '8px 0 0 0' }}>
                    <Input placeholder="输入显示名称" />
                  </Form.Item>
                ) : (
                  <Text style={{ marginLeft: '8px' }}>
                    {currentUser.displayName || '未设置'}
                  </Text>
                )}
              </div>

              <div>
                <Text strong>用户类型：</Text>
                <Text style={{ marginLeft: '8px' }}>
                  {currentUser.userType === 'ADMIN' ? '管理员' :
                   currentUser.userType === 'SUPER_ADMIN' ? '超级管理员' :
                   currentUser.userType === 'REVIEWER' ? '审核员' :
                   isABCodeUser ? '半匿名用户' :
                   currentUser.userType === 'anonymous' ? '匿名用户' : '普通用户'}
                </Text>
              </div>

              <div>
                <Text strong>注册时间：</Text>
                <Text style={{ marginLeft: '8px' }}>
                  {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleString() : '未知'}
                </Text>
              </div>

              <div>
                <Text strong>最后活跃：</Text>
                <Text style={{ marginLeft: '8px' }}>
                  {currentUser.lastActiveAt ? new Date(currentUser.lastActiveAt).toLocaleString() : '未知'}
                </Text>
              </div>

              {editing && (
                <div style={{ marginTop: '16px' }}>
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<SaveOutlined />}
                      htmlType="submit"
                    >
                      保存
                    </Button>
                    <Button onClick={() => setEditing(false)}>
                      取消
                    </Button>
                  </Space>
                </div>
              )}
            </Space>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default UserProfile;
