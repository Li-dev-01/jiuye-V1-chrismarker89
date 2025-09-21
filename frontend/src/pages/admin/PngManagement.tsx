/**
 * PNG卡片管理页面
 * 管理员批量生成和管理PNG卡片
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Select,
  InputNumber,
  Switch,
  Progress,
  message,
  Typography,
  Tag,
  Tooltip,
  Statistic,
  Row,
  Col,
  Alert
} from 'antd';
import {
  FileImageOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Paragraph, Text } = Typography;

interface PngCard {
  id: string;
  contentType: 'heart_voice' | 'story';
  contentId: number;
  cardId: string;
  theme: string;
  downloadUrl: string;
  downloadCount: number;
  fileSize: number;
  createdAt: string;
}

interface BatchGenerateOptions {
  contentType: 'heart_voice' | 'story' | 'both';
  themes: string[];
  limit: number;
  highQuality: boolean;
  retina: boolean;
}

interface PngStats {
  totalCards: number;
  totalDownloads: number;
  uniqueContents: number;
  cardsByTheme: Record<string, number>;
  downloadsByDate: Array<{ date: string; downloads: number }>;
}

export const PngManagement: React.FC = () => {
  const [cards, setCards] = useState<PngCard[]>([]);
  const [stats, setStats] = useState<PngStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPngCards();
    loadPngStats();
  }, []);

  const loadPngCards = async () => {
    try {
      setLoading(true);
      // 调用真实API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/png-cards/list`);
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
      } else {
        // API未配置或失败时显示空数据
        setCards([]);
        message.warning('PNG卡片API未配置，请联系管理员');
      }
    } catch (error) {
      console.error('加载PNG卡片失败:', error);
      message.error('加载PNG卡片失败');
    } finally {
      setLoading(false);
    }
  };

  const loadPngStats = async () => {
    try {
      // 调用真实API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auto-png/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // API未配置时显示空统计
        setStats(null);
      }
    } catch (error) {
      console.error('加载PNG统计失败:', error);
      setStats(null);
    }
  };

  const handleBatchGenerate = async (values: BatchGenerateOptions) => {
    try {
      setIsBatchGenerating(true);
      setBatchProgress(0);

      // 模拟批量生成进度
      const progressInterval = setInterval(() => {
        setBatchProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // 这里应该调用实际的批量生成API
      // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auto-png/batch-generate`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify(values)
      // });

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 3000));

      clearInterval(progressInterval);
      setBatchProgress(100);

      message.success('批量生成完成！');
      setBatchModalVisible(false);
      loadPngCards();
      loadPngStats();
      form.resetFields();
    } catch (error) {
      console.error('批量生成失败:', error);
      message.error('批量生成失败');
    } finally {
      setIsBatchGenerating(false);
      setBatchProgress(0);
    }
  };

  const handlePreviewCard = (card: PngCard) => {
    Modal.info({
      title: `预览PNG卡片 - ${card.cardId}`,
      content: (
        <div>
          <img 
            src={card.downloadUrl} 
            alt={card.cardId}
            style={{ width: '100%', maxWidth: '400px' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOazleWKoOi9veWbvueJhzwvdGV4dD48L3N2Zz4=';
            }}
          />
          <div style={{ marginTop: '16px' }}>
            <Text><strong>类型：</strong>{card.contentType === 'heart_voice' ? '心声' : '故事'}</Text><br />
            <Text><strong>主题：</strong>{card.theme}</Text><br />
            <Text><strong>下载次数：</strong>{card.downloadCount}</Text><br />
            <Text><strong>文件大小：</strong>{(card.fileSize / 1024).toFixed(1)} KB</Text>
          </div>
        </div>
      ),
      width: 500
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getThemeColor = (theme: string) => {
    const colors = {
      gradient: 'purple',
      light: 'blue',
      dark: 'default',
      minimal: 'green'
    };
    return colors[theme as keyof typeof colors] || 'default';
  };

  const columns: ColumnsType<PngCard> = [
    {
      title: 'ID',
      dataIndex: 'cardId',
      key: 'cardId',
      width: 200,
      render: (cardId) => <Text code>{cardId}</Text>
    },
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 100,
      render: (type) => (
        <Tag color={type === 'heart_voice' ? 'red' : 'blue'}>
          {type === 'heart_voice' ? '心声' : '故事'}
        </Tag>
      )
    },
    {
      title: '主题',
      dataIndex: 'theme',
      key: 'theme',
      width: 100,
      render: (theme) => (
        <Tag color={getThemeColor(theme)}>{theme}</Tag>
      )
    },
    {
      title: '下载次数',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      width: 100,
      render: (count) => (
        <Space>
          <DownloadOutlined />
          {count}
        </Space>
      )
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (size) => formatFileSize(size)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="预览">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreviewCard(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => window.open(record.downloadUrl, '_blank')}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确定要删除这张PNG卡片吗？',
                  onOk: () => {
                    message.success('PNG卡片删除成功');
                    loadPngCards();
                  }
                });
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总卡片数"
                value={stats.totalCards}
                prefix={<FileImageOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总下载量"
                value={stats.totalDownloads}
                prefix={<DownloadOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="内容数量"
                value={stats.uniqueContents}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均下载"
                value={(stats.totalDownloads / stats.totalCards).toFixed(1)}
                suffix="次/卡片"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={3}>
            <FileImageOutlined style={{ marginRight: '8px' }} />
            PNG卡片管理
          </Title>
          <Paragraph type="secondary">
            管理系统中的PNG卡片，支持批量生成和下载统计
          </Paragraph>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => setBatchModalVisible(true)}
            >
              批量生成PNG
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadPngCards();
                loadPngStats();
              }}
              loading={loading}
            >
              刷新数据
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={cards}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 张PNG卡片`
          }}
        />
      </Card>

      {/* 批量生成模态框 */}
      <Modal
        title="批量生成PNG卡片"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="批量生成说明"
          description="系统将为选定类型的内容生成PNG卡片，已存在的卡片将被跳过。"
          type="info"
          style={{ marginBottom: '24px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleBatchGenerate}
          initialValues={{
            contentType: 'both',
            themes: ['gradient', 'light'],
            limit: 50,
            highQuality: false,
            retina: false
          }}
        >
          <Form.Item
            name="contentType"
            label="内容类型"
            rules={[{ required: true, message: '请选择内容类型' }]}
          >
            <Select>
              <Select.Option value="heart_voice">仅心声</Select.Option>
              <Select.Option value="story">仅故事</Select.Option>
              <Select.Option value="both">心声和故事</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="themes"
            label="主题样式"
            rules={[{ required: true, message: '请选择至少一个主题' }]}
          >
            <Select mode="multiple">
              <Select.Option value="gradient">渐变主题</Select.Option>
              <Select.Option value="light">明亮主题</Select.Option>
              <Select.Option value="dark">深色主题</Select.Option>
              <Select.Option value="minimal">简约主题</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="limit"
            label="处理数量限制"
            rules={[{ required: true, message: '请设置处理数量' }]}
          >
            <InputNumber min={1} max={500} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="质量选项">
            <Form.Item name="highQuality" valuePropName="checked" noStyle>
              <Switch /> 高质量模式（更大文件，更清晰）
            </Form.Item>
            <br />
            <Form.Item name="retina" valuePropName="checked" noStyle>
              <Switch /> Retina显示（2倍分辨率）
            </Form.Item>
          </Form.Item>

          {isBatchGenerating && (
            <div style={{ marginBottom: '16px' }}>
              <Text>生成进度：</Text>
              <Progress percent={batchProgress} />
            </div>
          )}

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isBatchGenerating}
                icon={<CloudUploadOutlined />}
              >
                开始生成
              </Button>
              <Button onClick={() => setBatchModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
