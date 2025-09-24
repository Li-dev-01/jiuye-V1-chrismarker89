import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Card,
  DatePicker,
  Select,
  Input,
  Typography,
  Statistic,
  Row,
  Col,
  Alert
} from 'antd';
import { 
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';
import { ReviewHistoryItem } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReviewHistory: React.FC = () => {
  const [items, setItems] = useState<ReviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<any>(null);

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      console.log('[REVIEW_HISTORY] Fetching history from:', API_CONFIG.ENDPOINTS.REVIEWER_HISTORY);
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.REVIEWER_HISTORY);

      console.log('[REVIEW_HISTORY] API response:', response.data);

      if (response.data.success && response.data.data) {
        setItems(response.data.data.items || []);
      } else {
        throw new Error('API响应格式错误');
      }
    } catch (error: any) {
      console.error('获取审核历史失败:', error);
      
      // 如果API不存在，使用模拟数据
      if (error.response?.status === 404) {
        const mockData: ReviewHistoryItem[] = [
          {
            id: '1',
            title: '大学生创业经验分享',
            action: 'approve',
            reason: '内容积极正面，对其他学生有启发意义',
            reviewedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
            author: '陈同学'
          },
          {
            id: '2',
            title: '求职被拒后的反思',
            action: 'approve', 
            reason: '内容真实，能帮助其他学生调整心态',
            reviewedAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
            author: '刘同学'
          },
          {
            id: '3',
            title: '不当内容测试',
            action: 'reject',
            reason: '内容包含不当信息，不符合平台规范',
            reviewedAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
            author: '测试用户'
          },
          {
            id: '4',
            title: '互联网行业求职心得',
            action: 'approve',
            reason: '内容详实，对求职者有实用价值',
            reviewedAt: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm'),
            author: '王同学'
          },
          {
            id: '5',
            title: '研究生就业选择困惑',
            action: 'approve',
            reason: '内容真实反映学生困惑，有讨论价值',
            reviewedAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm'),
            author: '李同学'
          }
        ];
        setItems(mockData);
      }
    } finally {
      setLoading(false);
    }
  };

  // 过滤数据
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.author.toLowerCase().includes(searchText.toLowerCase());
    const matchesAction = actionFilter === 'all' || item.action === actionFilter;
    
    let matchesDate = true;
    if (dateRange) {
      const itemDate = dayjs(item.reviewedAt);
      matchesDate = itemDate.isAfter(dateRange[0].startOf('day')) && 
                   itemDate.isBefore(dateRange[1].endOf('day'));
    }
    
    return matchesSearch && matchesAction && matchesDate;
  });

  // 统计数据
  const stats = {
    total: items.length,
    approved: items.filter(item => item.action === 'approve').length,
    rejected: items.filter(item => item.action === 'reject').length,
    todayCount: items.filter(item => 
      dayjs(item.reviewedAt).isSame(dayjs(), 'day')
    ).length
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: '35%',
      render: (title: string) => (
        <Text strong>{title}</Text>
      )
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: '12%',
    },
    {
      title: '审核结果',
      dataIndex: 'action',
      key: 'action',
      width: '12%',
      render: (action: string) => (
        <Tag 
          color={action === 'approve' ? 'green' : 'red'}
          icon={action === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {action === 'approve' ? '已批准' : '已拒绝'}
        </Tag>
      )
    },
    {
      title: '审核理由',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      width: '25%',
      render: (reason: string) => (
        <Text type="secondary">{reason}</Text>
      )
    },
    {
      title: '审核时间',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      width: '16%',
      render: (time: string) => (
        <Text type="secondary">{time}</Text>
      )
    }
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总审核数"
              value={stats.total}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已批准"
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已拒绝"
              value={stats.rejected}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日审核"
              value={stats.todayCount}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容卡片 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: '18px' }}>审核历史</Text>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            共 {filteredItems.length} 条记录
          </Text>
        </div>

        {/* 筛选工具栏 */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="搜索标题或作者"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="审核结果"
                value={actionFilter}
                onChange={setActionFilter}
              >
                <Option value="all">全部</Option>
                <Option value="approve">已批准</Option>
                <Option value="reject">已拒绝</Option>
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={setDateRange}
                placeholder={['开始日期', '结束日期']}
              />
            </Col>
            <Col span={6}>
              <Space>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={fetchHistoryData}
                  loading={loading}
                >
                  刷新
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    // 导出功能
                    const csvContent = [
                      ['标题', '作者', '审核结果', '审核理由', '审核时间'].join(','),
                      ...filteredItems.map(item => [
                        `"${item.title}"`,
                        item.author,
                        item.action === 'approve' ? '已批准' : '已拒绝',
                        `"${item.reason}"`,
                        item.reviewedAt
                      ].join(','))
                    ].join('\n');
                    
                    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `审核历史_${dayjs().format('YYYY-MM-DD')}.csv`;
                    link.click();
                  }}
                >
                  导出
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {filteredItems.length === 0 && !loading && (
          <Alert
            message="暂无审核记录"
            description="当前筛选条件下没有找到审核记录。"
            type="info"
            showIcon
            style={{ margin: '40px 0' }}
          />
        )}

        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            size: 'default'
          }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default ReviewHistory;
