import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  Alert,
  Input,
  Select,
  Tabs,
  Collapse,
  Tooltip,
  Badge,
  message,
  Modal,
  Tree
} from 'antd';
import { 
  ApiOutlined,
  FileTextOutlined,
  DownloadOutlined,
  SyncOutlined,
  BranchesOutlined,
  SearchOutlined,
  CopyOutlined,
  ExportOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface APIDocumentation {
  id: string;
  path: string;
  method: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: APIParameter[];
  responses: APIResponse[];
  examples: APIExample[];
  version: string;
  lastUpdated: string;
  status: 'active' | 'deprecated' | 'beta';
  authentication: boolean;
  rateLimit?: string;
  dependencies: string[];
}

interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  type: string;
  required: boolean;
  description: string;
  example?: any;
  schema?: any;
}

interface APIResponse {
  code: number;
  description: string;
  schema?: any;
  examples?: any;
}

interface APIExample {
  name: string;
  request: any;
  response: any;
  description: string;
}

interface APIVersion {
  version: string;
  releaseDate: string;
  changes: string[];
  status: 'current' | 'deprecated' | 'beta';
}

const AdminAPIDocumentation: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<APIDocumentation[]>([]);
  const [versions, setVersions] = useState<APIVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<APIDocumentation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  useEffect(() => {
    fetchAPIDocumentation();
    fetchVersionHistory();
  }, [selectedVersion]);

  const fetchAPIDocumentation = async () => {
    setLoading(true);
    try {
      console.log('[API_DOCS] Fetching API documentation...');
      
      // 尝试从后端获取API文档
      const response = await apiClient.get(`/api/simple-admin/api/documentation?version=${selectedVersion}`);
      
      if (response.data.success) {
        setDocs(response.data.data.docs || []);
      } else {
        throw new Error('API响应失败');
      }
    } catch (error) {
      console.error('获取API文档失败:', error);
      
      // 使用模拟数据
      const mockDocs: APIDocumentation[] = [
        {
          id: 'simple-auth-login',
          path: '/api/simple-auth/login',
          method: 'POST',
          summary: '用户登录认证',
          description: '简化的用户登录认证接口，支持用户名密码登录，返回JWT token用于后续API调用认证。',
          tags: ['Authentication', 'Core'],
          parameters: [
            {
              name: 'username',
              in: 'body',
              type: 'string',
              required: true,
              description: '用户名',
              example: 'admin1'
            },
            {
              name: 'password',
              in: 'body',
              type: 'string',
              required: true,
              description: '密码',
              example: 'admin123'
            },
            {
              name: 'userType',
              in: 'body',
              type: 'string',
              required: false,
              description: '用户类型',
              example: 'admin'
            }
          ],
          responses: [
            {
              code: 200,
              description: '登录成功',
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      user: { type: 'object' }
                    }
                  },
                  message: { type: 'string' }
                }
              }
            },
            {
              code: 401,
              description: '认证失败',
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          ],
          examples: [
            {
              name: '管理员登录',
              request: {
                username: 'admin1',
                password: 'admin123',
                userType: 'admin'
              },
              response: {
                success: true,
                data: {
                  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                  user: {
                    id: 'admin_001',
                    username: 'admin1',
                    role: 'admin',
                    name: '管理员'
                  }
                },
                message: '登录成功'
              },
              description: '管理员账号登录示例'
            }
          ],
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          status: 'active',
          authentication: false,
          rateLimit: '100/min',
          dependencies: []
        },
        {
          id: 'simple-admin-dashboard',
          path: '/api/simple-admin/dashboard',
          method: 'GET',
          summary: '管理员仪表板数据',
          description: '获取管理员仪表板的统计数据，包括用户数量、问卷统计、审核状态等关键指标。',
          tags: ['Admin', 'Dashboard'],
          parameters: [
            {
              name: 'Authorization',
              in: 'header',
              type: 'string',
              required: true,
              description: 'Bearer token',
              example: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
            },
            {
              name: 'timeRange',
              in: 'query',
              type: 'string',
              required: false,
              description: '时间范围',
              example: '7d'
            }
          ],
          responses: [
            {
              code: 200,
              description: '获取成功',
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      userStats: { type: 'object' },
                      questionnaireStats: { type: 'object' },
                      auditStats: { type: 'object' }
                    }
                  }
                }
              }
            },
            {
              code: 401,
              description: '未授权',
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          ],
          examples: [
            {
              name: '仪表板数据',
              request: {},
              response: {
                success: true,
                data: {
                  userStats: {
                    totalUsers: 1247,
                    activeUsers: 892,
                    newUsersToday: 23
                  },
                  questionnaireStats: {
                    totalQuestionnaires: 3456,
                    completedToday: 89
                  },
                  auditStats: {
                    pendingReviews: 156,
                    completedToday: 45
                  }
                }
              },
              description: '管理员仪表板数据示例'
            }
          ],
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          status: 'active',
          authentication: true,
          rateLimit: '1000/hour',
          dependencies: ['simple-auth']
        },
        {
          id: 'questionnaire-submit',
          path: '/api/questionnaire/submit',
          method: 'POST',
          summary: '问卷提交',
          description: '用户提交问卷数据的接口，支持多种问卷类型，自动验证数据完整性。',
          tags: ['Questionnaire', 'Public'],
          parameters: [
            {
              name: 'questionnaireId',
              in: 'body',
              type: 'string',
              required: true,
              description: '问卷ID',
              example: 'employment-survey-2024'
            },
            {
              name: 'responses',
              in: 'body',
              type: 'object',
              required: true,
              description: '问卷回答数据',
              example: {
                name: '张三',
                university: '北京大学',
                major: '计算机科学'
              }
            }
          ],
          responses: [
            {
              code: 200,
              description: '提交成功',
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      submissionId: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            },
            {
              code: 400,
              description: '数据验证失败',
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  errors: { type: 'array' }
                }
              }
            }
          ],
          examples: [
            {
              name: '就业调查问卷提交',
              request: {
                questionnaireId: 'employment-survey-2024',
                responses: {
                  name: '张三',
                  university: '北京大学',
                  major: '计算机科学',
                  graduationYear: 2024,
                  employmentStatus: 'employed'
                }
              },
              response: {
                success: true,
                data: {
                  submissionId: 'sub_1234567890',
                  timestamp: '2024-09-24T12:00:00Z'
                },
                message: '问卷提交成功'
              },
              description: '就业调查问卷提交示例'
            }
          ],
          version: '1.2.0',
          lastUpdated: new Date().toISOString(),
          status: 'active',
          authentication: false,
          rateLimit: '10/min',
          dependencies: []
        }
      ];

      setDocs(mockDocs);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionHistory = async () => {
    try {
      // 模拟版本历史数据
      const mockVersions: APIVersion[] = [
        {
          version: '1.2.0',
          releaseDate: '2024-09-24',
          changes: [
            '新增问卷数据验证功能',
            '优化认证token刷新机制',
            '修复管理员权限检查bug',
            '增加API响应时间监控'
          ],
          status: 'current'
        },
        {
          version: '1.1.0',
          releaseDate: '2024-09-15',
          changes: [
            '新增简化认证系统',
            '实现管理员仪表板API',
            '添加审核员功能接口',
            '优化数据库查询性能'
          ],
          status: 'deprecated'
        },
        {
          version: '1.0.0',
          releaseDate: '2024-09-01',
          changes: [
            '初始版本发布',
            '基础认证功能',
            '问卷提交接口',
            '用户管理功能'
          ],
          status: 'deprecated'
        }
      ];

      setVersions(mockVersions);
    } catch (error) {
      console.error('获取版本历史失败:', error);
    }
  };

  const generateSwaggerDoc = () => {
    const swaggerDoc = {
      openapi: '3.0.0',
      info: {
        title: '就业调查系统 API',
        version: selectedVersion,
        description: '就业调查系统的完整API文档',
        contact: {
          name: 'API Support',
          email: 'support@example.com'
        }
      },
      servers: [
        {
          url: 'https://employment-survey-api-prod.chrismarker89.workers.dev',
          description: '生产环境'
        }
      ],
      paths: {} as any,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };

    // 转换API文档为Swagger格式
    docs.forEach(doc => {
      swaggerDoc.paths[doc.path] = {
        [doc.method.toLowerCase()]: {
          summary: doc.summary,
          description: doc.description,
          tags: doc.tags,
          parameters: doc.parameters.map(param => ({
            name: param.name,
            in: param.in,
            required: param.required,
            description: param.description,
            schema: { type: param.type },
            example: param.example
          })),
          responses: doc.responses.reduce((acc: any, resp) => {
            acc[resp.code] = {
              description: resp.description,
              content: resp.schema ? {
                'application/json': {
                  schema: resp.schema
                }
              } : undefined
            };
            return acc;
          }, {}),
          security: doc.authentication ? [{ bearerAuth: [] }] : []
        }
      };
    });

    return swaggerDoc;
  };

  const exportDocumentation = (format: 'swagger' | 'postman' | 'markdown') => {
    let content = '';
    let filename = '';

    switch (format) {
      case 'swagger':
        content = JSON.stringify(generateSwaggerDoc(), null, 2);
        filename = `api-docs-${selectedVersion}.json`;
        break;
      case 'postman':
        // 生成Postman Collection格式
        const postmanCollection = {
          info: {
            name: `就业调查系统 API v${selectedVersion}`,
            description: '就业调查系统的API集合',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
          },
          item: docs.map(doc => ({
            name: doc.summary,
            request: {
              method: doc.method,
              header: doc.parameters
                .filter(p => p.in === 'header')
                .map(p => ({ key: p.name, value: p.example || '', description: p.description })),
              url: {
                raw: `{{baseUrl}}${doc.path}`,
                host: ['{{baseUrl}}'],
                path: doc.path.split('/').filter(Boolean)
              },
              body: doc.method !== 'GET' ? {
                mode: 'raw',
                raw: JSON.stringify(
                  doc.parameters
                    .filter(p => p.in === 'body')
                    .reduce((acc, p) => ({ ...acc, [p.name]: p.example }), {}),
                  null, 2
                ),
                options: { raw: { language: 'json' } }
              } : undefined
            },
            response: doc.examples.map(ex => ({
              name: ex.name,
              originalRequest: {
                method: doc.method,
                url: `{{baseUrl}}${doc.path}`,
                body: { mode: 'raw', raw: JSON.stringify(ex.request, null, 2) }
              },
              status: 'OK',
              code: 200,
              body: JSON.stringify(ex.response, null, 2)
            }))
          })),
          variable: [
            {
              key: 'baseUrl',
              value: 'https://employment-survey-api-prod.chrismarker89.workers.dev'
            }
          ]
        };
        content = JSON.stringify(postmanCollection, null, 2);
        filename = `api-collection-${selectedVersion}.json`;
        break;
      case 'markdown':
        content = generateMarkdownDoc();
        filename = `api-docs-${selectedVersion}.md`;
        break;
    }

    // 下载文件
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success(`${format.toUpperCase()} 文档已导出`);
    setExportModalVisible(false);
  };

  const generateMarkdownDoc = () => {
    let markdown = `# 就业调查系统 API 文档 v${selectedVersion}\n\n`;
    markdown += `生成时间: ${new Date().toLocaleString()}\n\n`;
    
    const groupedDocs = docs.reduce((acc, doc) => {
      doc.tags.forEach(tag => {
        if (!acc[tag]) acc[tag] = [];
        acc[tag].push(doc);
      });
      return acc;
    }, {} as Record<string, APIDocumentation[]>);

    Object.entries(groupedDocs).forEach(([tag, tagDocs]) => {
      markdown += `## ${tag}\n\n`;
      
      tagDocs.forEach(doc => {
        markdown += `### ${doc.method} ${doc.path}\n\n`;
        markdown += `**${doc.summary}**\n\n`;
        markdown += `${doc.description}\n\n`;
        
        if (doc.parameters.length > 0) {
          markdown += `#### 参数\n\n`;
          markdown += `| 名称 | 位置 | 类型 | 必需 | 描述 | 示例 |\n`;
          markdown += `|------|------|------|------|------|------|\n`;
          doc.parameters.forEach(param => {
            markdown += `| ${param.name} | ${param.in} | ${param.type} | ${param.required ? '是' : '否'} | ${param.description} | ${param.example || '-'} |\n`;
          });
          markdown += `\n`;
        }
        
        if (doc.responses.length > 0) {
          markdown += `#### 响应\n\n`;
          doc.responses.forEach(resp => {
            markdown += `**${resp.code}** - ${resp.description}\n\n`;
            if (resp.schema) {
              markdown += `\`\`\`json\n${JSON.stringify(resp.schema, null, 2)}\n\`\`\`\n\n`;
            }
          });
        }
        
        if (doc.examples.length > 0) {
          markdown += `#### 示例\n\n`;
          doc.examples.forEach(example => {
            markdown += `**${example.name}**\n\n`;
            markdown += `请求:\n\`\`\`json\n${JSON.stringify(example.request, null, 2)}\n\`\`\`\n\n`;
            markdown += `响应:\n\`\`\`json\n${JSON.stringify(example.response, null, 2)}\n\`\`\`\n\n`;
          });
        }
        
        markdown += `---\n\n`;
      });
    });

    return markdown;
  };

  const copyAPIExample = (doc: APIDocumentation) => {
    const curlCommand = generateCurlCommand(doc);
    navigator.clipboard.writeText(curlCommand).then(() => {
      message.success('cURL命令已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const generateCurlCommand = (doc: APIDocumentation) => {
    let curl = `curl -X ${doc.method} "https://employment-survey-api-prod.chrismarker89.workers.dev${doc.path}"`;
    
    // 添加headers
    const headers = doc.parameters.filter(p => p.in === 'header');
    headers.forEach(header => {
      curl += ` \\\n  -H "${header.name}: ${header.example || 'YOUR_VALUE'}"`;
    });
    
    // 添加Content-Type
    if (doc.method !== 'GET') {
      curl += ` \\\n  -H "Content-Type: application/json"`;
    }
    
    // 添加body
    if (doc.method !== 'GET' && doc.examples.length > 0) {
      curl += ` \\\n  -d '${JSON.stringify(doc.examples[0].request, null, 2)}'`;
    }
    
    return curl;
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'all' || doc.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(docs.flatMap(doc => doc.tags)));

  const columns = [
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => (
        <Tag color={method === 'GET' ? 'blue' : method === 'POST' ? 'green' : method === 'PUT' ? 'orange' : 'red'}>
          {method}
        </Tag>
      )
    },
    {
      title: 'API路径',
      dataIndex: 'path',
      key: 'path',
      render: (path: string, record: APIDocumentation) => (
        <div>
          <Text code>{path}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.summary}</Text>
        </div>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <div>
          {tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'deprecated' ? 'red' : 'orange'}>
          {status === 'active' ? '正常' : status === 'deprecated' ? '已弃用' : '测试版'}
        </Tag>
      )
    },
    {
      title: '认证',
      dataIndex: 'authentication',
      key: 'authentication',
      width: 80,
      render: (auth: boolean) => auth ? <Tag color="red">需要</Tag> : <Tag color="green">公开</Tag>
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: APIDocumentation) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              size="small" 
              icon={<FileTextOutlined />}
              onClick={() => {
                setSelectedDoc(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="复制cURL">
            <Button 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => copyAPIExample(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Card loading={true}>
          <div style={{ height: '400px' }} />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <FileTextOutlined /> API文档管理
        </Title>
        <Text type="secondary">
          自动化API文档生成与版本控制 • 当前版本: {selectedVersion} • 共 {docs.length} 个接口
        </Text>
      </div>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总接口数"
              value={docs.length}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="正常接口"
              value={docs.filter(d => d.status === 'active').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已弃用"
              value={docs.filter(d => d.status === 'deprecated').length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="当前版本"
              value={selectedVersion}
              prefix={<BranchesOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 版本选择和操作 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择版本"
              value={selectedVersion}
              onChange={setSelectedVersion}
            >
              {versions.map(version => (
                <Option key={version.version} value={version.version}>
                  v{version.version} 
                  {version.status === 'current' && <Badge status="success" text="当前" />}
                  {version.status === 'deprecated' && <Badge status="error" text="已弃用" />}
                  {version.status === 'beta' && <Badge status="warning" text="测试" />}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Search
              placeholder="搜索API"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="筛选标签"
              value={selectedTag}
              onChange={setSelectedTag}
            >
              <Option value="all">全部标签</Option>
              {allTags.map(tag => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Space>
              <Button 
                type="primary" 
                icon={<SyncOutlined />}
                onClick={fetchAPIDocumentation}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                icon={<ExportOutlined />}
                onClick={() => setExportModalVisible(true)}
              >
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* API文档列表 */}
      <Card title={`API接口列表 (${filteredDocs.length}/${docs.length})`}>
        <Table
          columns={columns}
          dataSource={filteredDocs}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          size="small"
        />
      </Card>

      {/* 版本历史 */}
      <Card title="版本历史" style={{ marginTop: '24px' }}>
        <Collapse>
          {versions.map(version => (
            <Panel 
              key={version.version}
              header={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <Tag color={version.status === 'current' ? 'green' : version.status === 'deprecated' ? 'red' : 'orange'}>
                      v{version.version}
                    </Tag>
                    {version.status === 'current' && '当前版本'}
                    {version.status === 'deprecated' && '已弃用'}
                    {version.status === 'beta' && '测试版本'}
                  </span>
                  <Text type="secondary">{version.releaseDate}</Text>
                </div>
              }
            >
              <ul>
                {version.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </Panel>
          ))}
        </Collapse>
      </Card>

      {/* API详情Modal */}
      <Modal
        title={selectedDoc ? `${selectedDoc.method} ${selectedDoc.path}` : 'API详情'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => selectedDoc && copyAPIExample(selectedDoc)}>
            复制cURL
          </Button>,
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedDoc && (
          <Tabs defaultActiveKey="overview">
            <TabPane tab="概览" key="overview">
              <div style={{ marginBottom: '16px' }}>
                <Title level={4}>{selectedDoc.summary}</Title>
                <Paragraph>{selectedDoc.description}</Paragraph>
                <Space>
                  {selectedDoc.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                  <Tag color={selectedDoc.status === 'active' ? 'green' : 'red'}>
                    {selectedDoc.status === 'active' ? '正常' : '已弃用'}
                  </Tag>
                  {selectedDoc.authentication && <Tag color="red">需要认证</Tag>}
                  {selectedDoc.rateLimit && <Tag color="orange">限流: {selectedDoc.rateLimit}</Tag>}
                </Space>
              </div>
            </TabPane>
            
            <TabPane tab="参数" key="parameters">
              <Table
                dataSource={selectedDoc.parameters}
                columns={[
                  { title: '名称', dataIndex: 'name', key: 'name' },
                  { title: '位置', dataIndex: 'in', key: 'in' },
                  { title: '类型', dataIndex: 'type', key: 'type' },
                  { 
                    title: '必需', 
                    dataIndex: 'required', 
                    key: 'required',
                    render: (required: boolean) => required ? <Tag color="red">是</Tag> : <Tag>否</Tag>
                  },
                  { title: '描述', dataIndex: 'description', key: 'description' },
                  { 
                    title: '示例', 
                    dataIndex: 'example', 
                    key: 'example',
                    render: (example: any) => example ? <Text code>{JSON.stringify(example)}</Text> : '-'
                  }
                ]}
                pagination={false}
                size="small"
              />
            </TabPane>
            
            <TabPane tab="响应" key="responses">
              {selectedDoc.responses.map(response => (
                <div key={response.code} style={{ marginBottom: '16px' }}>
                  <Title level={5}>
                    <Tag color={response.code < 300 ? 'green' : response.code < 400 ? 'orange' : 'red'}>
                      {response.code}
                    </Tag>
                    {response.description}
                  </Title>
                  {response.schema && (
                    <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                      {JSON.stringify(response.schema, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </TabPane>
            
            <TabPane tab="示例" key="examples">
              {selectedDoc.examples.map(example => (
                <div key={example.name} style={{ marginBottom: '24px' }}>
                  <Title level={5}>{example.name}</Title>
                  <Paragraph>{example.description}</Paragraph>
                  
                  <Title level={5}>请求:</Title>
                  <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                    {JSON.stringify(example.request, null, 2)}
                  </pre>

                  <Title level={5}>响应:</Title>
                  <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                    {JSON.stringify(example.response, null, 2)}
                  </pre>
                </div>
              ))}
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* 导出Modal */}
      <Modal
        title="导出API文档"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" size="large">
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              size="large"
              onClick={() => exportDocumentation('swagger')}
            >
              导出 Swagger/OpenAPI JSON
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              size="large"
              onClick={() => exportDocumentation('postman')}
            >
              导出 Postman Collection
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              size="large"
              onClick={() => exportDocumentation('markdown')}
            >
              导出 Markdown 文档
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAPIDocumentation;
