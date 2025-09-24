# 审核员功能MVP实施计划

## 🎯 验证目标

通过实现审核员功能来验证独立前端的核心可行性：
- ✅ **登录认证**: 验证Token机制和权限控制
- ✅ **API连接**: 验证后端API调用和数据获取
- ✅ **基础架构**: 验证React+TypeScript+Ant Design技术栈
- ✅ **用户体验**: 验证界面交互和业务流程

## 🚀 Day 1 实施计划

### 上午 (4小时): 项目搭建和基础架构

#### 1. 项目初始化 (30分钟)
```bash
# 创建项目
npx create-react-app reviewer-admin-dashboard --template typescript
cd reviewer-admin-dashboard

# 安装核心依赖
npm install antd axios zustand react-router-dom @types/node dayjs

# 启动开发服务器
npm start
```

#### 2. 基础配置 (90分钟)
```typescript
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'https://employment-survey-api-prod.chrismarker89.workers.dev',
  TIMEOUT: 10000,
  ENDPOINTS: {
    REVIEWER_LOGIN: '/reviewer/login',
    REVIEWER_DASHBOARD: '/reviewer/dashboard',
    REVIEWER_PENDING: '/reviewer/pending',
    REVIEWER_REVIEW: '/reviewer/review',
    REVIEWER_HISTORY: '/reviewer/history'
  }
};

// src/services/apiClient.ts
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// 请求拦截器 - 添加Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('reviewer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('reviewer_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 3. 状态管理设置 (60分钟)
```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

interface User {
  id: string;
  username: string;
  role: 'reviewer';
  permissions: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('reviewer_token'),
  isAuthenticated: !!localStorage.getItem('reviewer_token'),
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/reviewer/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('reviewer_token', token);
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('reviewer_token');
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false 
    });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;
    
    try {
      const response = await apiClient.get('/reviewer/verify');
      set({ user: response.data.user, isAuthenticated: true });
    } catch (error) {
      get().logout();
    }
  }
}));
```

#### 4. 路由和布局 (60分钟)
```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import ReviewerDashboard from './pages/ReviewerDashboard';
import PendingReviews from './pages/PendingReviews';
import ReviewHistory from './pages/ReviewHistory';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<ReviewerDashboard />} />
            <Route path="pending" element={<PendingReviews />} />
            <Route path="history" element={<ReviewHistory />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
```

### 下午 (4小时): 审核员核心功能

#### 5. 登录页面 (90分钟)
```typescript
// src/pages/LoginPage.tsx
import React from 'react';
import { Form, Input, Button, Card, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        title="审核员登录" 
        style={{ width: 400 }}
        headStyle={{ textAlign: 'center', fontSize: '20px' }}
      >
        <Spin spinning={isLoading}>
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="用户名" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="密码" 
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                style={{ width: '100%' }}
                loading={isLoading}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default LoginPage;
```

#### 6. 仪表板页面 (90分钟)
```typescript
// src/pages/ReviewerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Button, Spin } from 'antd';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';

interface DashboardData {
  stats: {
    pendingCount: number;
    completedToday: number;
    totalCompleted: number;
    averageTime: number;
  };
  recentActivities: Array<{
    id: string;
    title: string;
    action: string;
    time: string;
  }>;
}

const ReviewerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/reviewer/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <div>
      <h1>审核员仪表板</h1>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核"
              value={data?.stats.pendingCount || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日完成"
              value={data?.stats.completedToday || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总计完成"
              value={data?.stats.totalCompleted || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均用时(分钟)"
              value={data?.stats.averageTime || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title="快速操作" 
            extra={
              <Button 
                type="primary" 
                onClick={() => navigate('/pending')}
              >
                开始审核
              </Button>
            }
          >
            <p>当前有 <strong>{data?.stats.pendingCount || 0}</strong> 项内容等待审核</p>
            <Button 
              type="default" 
              onClick={() => navigate('/pending')}
              style={{ marginRight: 8 }}
            >
              查看待审核列表
            </Button>
            <Button 
              type="default" 
              onClick={() => navigate('/history')}
            >
              查看审核历史
            </Button>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="最近活动">
            <List
              dataSource={data?.recentActivities || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={`${item.action} - ${item.time}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReviewerDashboard;
```

#### 7. 待审核列表页面 (60分钟)
```typescript
// src/pages/PendingReviews.tsx
import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  message,
  Popconfirm 
} from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { apiClient } from '../services/apiClient';

interface ReviewItem {
  id: string;
  title: string;
  type: string;
  author: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  content: string;
}

const PendingReviews: React.FC = () => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/reviewer/pending');
      setItems(response.data.items || []);
    } catch (error) {
      message.error('获取待审核列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (itemId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      await apiClient.post(`/reviewer/review/${itemId}`, {
        action,
        reason: reason || '',
        notes: ''
      });
      
      message.success(`${action === 'approve' ? '批准' : '拒绝'}成功`);
      fetchPendingItems(); // 刷新列表
      setReviewModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: ReviewItem) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedItem(record);
              setReviewModalVisible(true);
            }}
          >
            查看
          </Button>
          <Popconfirm
            title="确定批准这项内容吗？"
            onConfirm={() => handleReview(record.id, 'approve')}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              size="small"
            >
              批准
            </Button>
          </Popconfirm>
          <Button 
            danger 
            icon={<CloseOutlined />}
            size="small"
            onClick={() => {
              setSelectedItem(record);
              setReviewModalVisible(true);
            }}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>待审核内容</h1>
      
      <Table
        columns={columns}
        dataSource={items}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 项`
        }}
      />

      <Modal
        title="内容审核"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setSelectedItem(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        {selectedItem && (
          <div>
            <h3>{selectedItem.title}</h3>
            <p><strong>作者:</strong> {selectedItem.author}</p>
            <p><strong>类型:</strong> {selectedItem.type}</p>
            <p><strong>提交时间:</strong> {selectedItem.submittedAt}</p>
            
            <div style={{ margin: '16px 0' }}>
              <strong>内容:</strong>
              <div style={{ 
                border: '1px solid #d9d9d9', 
                padding: '12px', 
                borderRadius: '6px',
                marginTop: '8px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {selectedItem.content}
              </div>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="reason"
                label="审核意见"
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="请输入审核意见（拒绝时必填）"
                />
              </Form.Item>
            </Form>

            <Space>
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                onClick={() => {
                  const reason = form.getFieldValue('reason');
                  handleReview(selectedItem.id, 'approve', reason);
                }}
              >
                批准
              </Button>
              <Button 
                danger 
                icon={<CloseOutlined />}
                onClick={() => {
                  const reason = form.getFieldValue('reason');
                  if (!reason) {
                    message.warning('拒绝时请填写审核意见');
                    return;
                  }
                  handleReview(selectedItem.id, 'reject', reason);
                }}
              >
                拒绝
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingReviews;
```

## 🎯 Day 1 验证清单

### 技术验证
- [ ] 项目能正常启动和运行
- [ ] Ant Design组件正常显示
- [ ] TypeScript编译无错误
- [ ] 路由跳转正常工作

### 功能验证
- [ ] 审核员能正常登录 (测试账号: reviewerA / admin123)
- [ ] Token存储和验证机制正常
- [ ] 仪表板数据能正常获取和显示
- [ ] 待审核列表能正常加载
- [ ] 审核操作能正常执行

### API验证
- [ ] `/reviewer/login` 接口调用成功
- [ ] `/reviewer/dashboard` 数据获取成功
- [ ] `/reviewer/pending` 列表获取成功
- [ ] `/reviewer/review/{id}` 审核操作成功

### 用户体验验证
- [ ] 登录流程顺畅
- [ ] 页面加载速度合理
- [ ] 操作反馈及时
- [ ] 错误处理友好

## 🚀 成功标准

如果Day 1结束时以上验证项目都能通过，说明：
1. ✅ **独立前端架构可行** - 技术栈选择正确
2. ✅ **API集成成功** - 后端接口正常工作
3. ✅ **认证机制有效** - Token和权限控制正常
4. ✅ **用户体验良好** - 界面交互符合预期

**这将为后续管理员和超级管理员功能的开发提供坚实的基础！**

---

**下一步**: Day 1验证成功后，立即开始Day 2的管理员功能开发，复制相同的架构模式。
