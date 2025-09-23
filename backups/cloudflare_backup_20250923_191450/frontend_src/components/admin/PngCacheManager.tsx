import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Alert, 
  Modal, 
  Select, 
  Switch,
  message,
  Divider,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  DeleteOutlined, 
  ReloadOutlined, 
  ExclamationCircleOutlined,
  ClearOutlined,
  FileImageOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { confirm } = Modal;

interface ClearResult {
  deletedCacheCount: number;
  deletedR2Count?: number;
  contentType?: string;
  theme?: string;
  reason?: string;
}

const PngCacheManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ClearResult | null>(null);

  // 清理所有缓存
  const clearAllCache = async (deleteR2Files: boolean = false) => {
    confirm({
      title: '确认清理所有PNG缓存？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <Paragraph>
            此操作将清理所有PNG缓存，下次用户下载时会重新生成PNG。
          </Paragraph>
          {deleteR2Files && (
            <Alert 
              type="warning" 
              message="同时删除R2存储文件" 
              description="这将永久删除已生成的PNG文件，请谨慎操作！"
              showIcon 
            />
          )}
        </div>
      ),
      okText: '确认清理',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/png-management/cache/clear-all`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reason: '书信体样式更新',
                deleteR2Files
              })
            }
          );

          const result = await response.json();
          
          if (result.success) {
            setLastResult(result.data);
            message.success(result.message);
          } else {
            message.error(result.message || '清理失败');
          }
        } catch (error) {
          message.error('清理请求失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 清理特定主题缓存
  const clearThemeCache = async (theme: string) => {
    confirm({
      title: `确认清理${theme}主题缓存？`,
      icon: <ExclamationCircleOutlined />,
      content: `此操作将清理所有${theme}主题的PNG缓存。`,
      okText: '确认清理',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/png-management/cache/clear-theme/${theme}`,
            { method: 'POST' }
          );

          const result = await response.json();
          
          if (result.success) {
            setLastResult(result.data);
            message.success(result.message);
          } else {
            message.error(result.message || '清理失败');
          }
        } catch (error) {
          message.error('清理请求失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 清理特定内容类型缓存
  const clearContentTypeCache = async (contentType: 'heart_voice' | 'story') => {
    const typeName = contentType === 'heart_voice' ? '问卷心声' : '就业故事';
    
    confirm({
      title: `确认清理${typeName}缓存？`,
      icon: <ExclamationCircleOutlined />,
      content: `此操作将清理所有${typeName}的PNG缓存。`,
      okText: '确认清理',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/png-management/cache/clear-type/${contentType}`,
            { method: 'POST' }
          );

          const result = await response.json();
          
          if (result.success) {
            setLastResult(result.data);
            message.success(result.message);
          } else {
            message.error(result.message || '清理失败');
          }
        } catch (error) {
          message.error('清理请求失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={3}>
          <FileImageOutlined /> PNG缓存管理
        </Title>
        
        <Alert
          type="info"
          message="书信体样式更新"
          description="由于书信体样式已更新，建议清理相关缓存以确保用户看到最新样式的PNG卡片。"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {lastResult && (
          <Card size="small" style={{ marginBottom: 24, backgroundColor: '#f6ffed' }}>
            <Title level={5}>上次清理结果</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="清理缓存条目" 
                  value={lastResult.deletedCacheCount} 
                  suffix="个"
                />
              </Col>
              {lastResult.deletedR2Count !== undefined && (
                <Col span={8}>
                  <Statistic 
                    title="删除R2文件" 
                    value={lastResult.deletedR2Count} 
                    suffix="个"
                  />
                </Col>
              )}
              <Col span={8}>
                <Text type="secondary">
                  {lastResult.contentType && `类型: ${lastResult.contentType}`}
                  {lastResult.theme && `主题: ${lastResult.theme}`}
                </Text>
              </Col>
            </Row>
          </Card>
        )}

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 全量清理 */}
          <Card size="small" title="全量清理" extra={<ClearOutlined />}>
            <Paragraph>
              清理所有PNG缓存，适用于全局样式更新。下次用户下载时会使用新样式重新生成。
            </Paragraph>
            <Space>
              <Button 
                type="primary" 
                danger 
                icon={<DeleteOutlined />}
                loading={loading}
                onClick={() => clearAllCache(false)}
              >
                清理所有缓存
              </Button>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                loading={loading}
                onClick={() => clearAllCache(true)}
              >
                清理缓存+删除文件
              </Button>
            </Space>
          </Card>

          <Divider />

          {/* 按主题清理 */}
          <Card size="small" title="按主题清理">
            <Paragraph>
              只清理特定主题的缓存，其他主题保持不变。
            </Paragraph>
            <Space>
              <Button 
                icon={<DeleteOutlined />}
                loading={loading}
                onClick={() => clearThemeCache('gradient')}
              >
                清理渐变主题
              </Button>
              <Button 
                icon={<DeleteOutlined />}
                loading={loading}
                onClick={() => clearThemeCache('light')}
              >
                清理浅色主题
              </Button>
              <Button 
                icon={<DeleteOutlined />}
                loading={loading}
                onClick={() => clearThemeCache('dark')}
              >
                清理深色主题
              </Button>
            </Space>
          </Card>

          <Divider />

          {/* 按内容类型清理 */}
          <Card size="small" title="按内容类型清理">
            <Paragraph>
              只清理特定内容类型的缓存。
            </Paragraph>
            <Space>
              <Button 
                icon={<DeleteOutlined />}
                loading={loading}
                onClick={() => clearContentTypeCache('story')}
              >
                清理就业故事缓存
              </Button>
              <Button 
                icon={<DeleteOutlined />}
                loading={loading}
                onClick={() => clearContentTypeCache('heart_voice')}
              >
                清理问卷心声缓存
              </Button>
            </Space>
          </Card>
        </Space>

        <Alert
          type="warning"
          message="注意事项"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>清理缓存后，用户下次下载PNG时会重新生成，可能需要等待几秒钟</li>
              <li>建议在低峰期进行清理操作，避免影响用户体验</li>
              <li>"删除文件"选项会永久删除R2存储中的PNG文件，请谨慎使用</li>
            </ul>
          }
          showIcon
          style={{ marginTop: 24 }}
        />
      </Card>
    </div>
  );
};

export default PngCacheManager;
