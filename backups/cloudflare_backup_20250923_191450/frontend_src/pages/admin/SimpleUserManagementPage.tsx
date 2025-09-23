/**
 * 简化版用户管理页面 - 用于调试
 */

import React, { useState, useEffect } from 'react';
import { Typography, Button, Card, Table, message, Spin } from 'antd';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import { ManagementAdminService } from '../../services/ManagementAdminService';
import { useManagementAuthStore } from '../../stores/managementAuthStore';

const { Title, Text } = Typography;

interface SimpleUser {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export const SimpleUserManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);

  // 使用管理系统认证状态
  const { currentUser, isAuthenticated } = useManagementAuthStore();

  // 简化的加载用户数据
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 开始加载用户数据...');
      console.log('🔍 认证状态:', { isAuthenticated, currentUser: currentUser?.userType });
      
      // 验证认证状态
      const isAuthValid = await ManagementAdminService.validateAuth();
      console.log('🔍 认证验证结果:', isAuthValid);
      
      if (!isAuthValid) {
        throw new Error('管理系统认证失效，请重新登录');
      }
      
      const response = await ManagementAdminService.getUsers(1, 10);
      console.log('🔍 API响应:', response);

      setRawData(response);

      // 更安全的数据处理
      try {
        let userData = [];

        if (response && typeof response === 'object') {
          // 尝试不同的数据结构
          if (response.items && Array.isArray(response.items)) {
            userData = response.items;
          } else if (response.data && Array.isArray(response.data)) {
            userData = response.data;
          } else if (Array.isArray(response)) {
            userData = response;
          } else {
            console.warn('🔍 无法识别的响应数据格式:', response);
            setUsers([]);
            return;
          }

          // 确保userData是数组
          if (!Array.isArray(userData)) {
            console.warn('🔍 用户数据不是数组:', userData);
            setUsers([]);
            return;
          }

          const simpleUsers = userData.map((user: any, index: number) => {
            // 更安全地提取用户数据
            try {
              const safeUser = user && typeof user === 'object' ? user : {};
              return {
                id: String(safeUser.id || safeUser.uuid || `user_${index}`),
                username: String(safeUser.username || safeUser.name || `用户${index + 1}`),
                email: String(safeUser.email || '未设置'),
                role: String(safeUser.role || safeUser.userType || safeUser.user_type || '未知'),
                status: String(safeUser.status || '未知'),
                createdAt: String(safeUser.createdAt || safeUser.created_at || safeUser.createTime || '未知')
              };
            } catch (userError) {
              console.error('🔍 处理用户数据时出错:', userError, user);
              return {
                id: `error_user_${index}`,
                username: `错误用户${index + 1}`,
                email: '数据错误',
                role: '未知',
                status: '错误',
                createdAt: '未知'
              };
            }
          });

          console.log('🔍 处理后的用户数据:', simpleUsers);
          setUsers(simpleUsers);
        } else {
          console.warn('🔍 响应不是有效对象:', response);
          setUsers([]);
        }
      } catch (dataError) {
        console.error('🔍 数据处理时出错:', dataError);
        setUsers([]);
        setError('数据处理失败: ' + (dataError as Error).message);
      }
      
    } catch (error: any) {
      console.error('🔍 加载用户失败:', error);
      setError(error.message || '加载用户失败');
      message.error('加载用户失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔍 组件挂载，开始加载数据...');
    loadUsers();
  }, []);

  // 简化的表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <AdminLayout>
        <div style={{ padding: '24px' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Title level={3} type="danger">用户管理页面加载失败</Title>
              <Text type="secondary">{error}</Text>
              <br />
              <Button 
                type="primary" 
                onClick={() => {
                  setError(null);
                  loadUsers();
                }}
                style={{ marginTop: '16px' }}
              >
                重新加载
              </Button>
            </div>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Title level={2}>
              简化版用户管理
              <Button 
                type="primary" 
                onClick={loadUsers}
                loading={loading}
                style={{ marginLeft: '16px' }}
              >
                刷新
              </Button>
            </Title>
            <Text type="secondary">
              调试版本 - 认证状态: {isAuthenticated ? '已认证' : '未认证'} | 
              用户类型: {currentUser?.userType || '未知'}
            </Text>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>正在加载用户数据...</div>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                }}
              />
              
              {/* 调试信息 */}
              <Card title="调试信息" style={{ marginTop: '16px' }}>
                <div>
                  <Text strong>用户数量:</Text> {users.length}
                </div>
                <div>
                  <Text strong>原始数据:</Text>
                  <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                </div>
              </Card>
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SimpleUserManagementPage;
