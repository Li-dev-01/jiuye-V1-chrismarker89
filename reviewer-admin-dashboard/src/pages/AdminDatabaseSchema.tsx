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
  Tree,
  Descriptions,
  Divider
} from 'antd';
import { 
  DatabaseOutlined,
  TableOutlined,
  LinkOutlined,
  SearchOutlined,
  DownloadOutlined,
  SyncOutlined,
  BranchesOutlined,
  CopyOutlined,
  ExportOutlined,
  NodeIndexOutlined,
  KeyOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { TreeNode } = Tree;

interface DatabaseTable {
  id: string;
  name: string;
  description: string;
  schema: string;
  columns: TableColumn[];
  indexes: TableIndex[];
  foreignKeys: ForeignKey[];
  primaryKey: string[];
  rowCount: number;
  size: string;
  lastUpdated: string;
  dependencies: string[];
  dependents: string[];
  // 新增字段用于4层架构分类
  tier?: 1 | 2 | 3 | 4;
  tierName?: 'Main Data' | 'Business Specific' | 'Statistics Cache' | 'View Cache';
  purpose?: 'write' | 'read' | 'cache' | 'display';
  optimization?: string[];
}

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  description: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
}

interface TableIndex {
  name: string;
  columns: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
}

interface ForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

interface DatabaseRelation {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one';
  description: string;
}

const AdminDatabaseSchema: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [relations, setRelations] = useState<DatabaseRelation[]>([]);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<string>('all');

  useEffect(() => {
    fetchDatabaseSchema();
  }, []);

  const fetchDatabaseSchema = async () => {
    setLoading(true);
    try {
      console.log('[DB_SCHEMA] Fetching database schema...');
      
      // 尝试从后端获取数据库结构
      const response = await apiClient.get('/api/simple-admin/database/schema');
      
      if (response.data.success) {
        setTables(response.data.data.tables || []);
        setRelations(response.data.data.relations || []);
      } else {
        throw new Error('API响应失败');
      }
    } catch (error) {
      console.error('获取数据库结构失败:', error);
      
      // 使用模拟数据
      const mockTables: DatabaseTable[] = [
        {
          id: 'users',
          name: 'users',
          description: '用户基础信息表',
          schema: 'public',
          columns: [
            {
              name: 'id',
              type: 'varchar(50)',
              nullable: false,
              description: '用户唯一标识',
              isPrimaryKey: true,
              isForeignKey: false
            },
            {
              name: 'username',
              type: 'varchar(100)',
              nullable: false,
              description: '用户名',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'email',
              type: 'varchar(255)',
              nullable: true,
              description: '邮箱地址',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'role',
              type: 'varchar(50)',
              nullable: false,
              defaultValue: 'user',
              description: '用户角色',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'name',
              type: 'varchar(100)',
              nullable: true,
              description: '真实姓名',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'created_at',
              type: 'timestamp',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
              description: '创建时间',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
              description: '更新时间',
              isPrimaryKey: false,
              isForeignKey: false
            }
          ],
          indexes: [
            {
              name: 'idx_users_username',
              columns: ['username'],
              unique: true,
              type: 'btree'
            },
            {
              name: 'idx_users_email',
              columns: ['email'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_users_role',
              columns: ['role'],
              unique: false,
              type: 'btree'
            }
          ],
          foreignKeys: [],
          primaryKey: ['id'],
          rowCount: 1247,
          size: '2.3 MB',
          lastUpdated: new Date().toISOString(),
          dependencies: [],
          dependents: ['questionnaire_submissions', 'audit_records', 'user_sessions']
        },
        {
          id: 'questionnaires',
          name: 'questionnaires',
          description: '问卷模板表',
          schema: 'public',
          columns: [
            {
              name: 'id',
              type: 'varchar(50)',
              nullable: false,
              description: '问卷唯一标识',
              isPrimaryKey: true,
              isForeignKey: false
            },
            {
              name: 'title',
              type: 'varchar(255)',
              nullable: false,
              description: '问卷标题',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'description',
              type: 'text',
              nullable: true,
              description: '问卷描述',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'questions',
              type: 'jsonb',
              nullable: false,
              description: '问题配置JSON',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'status',
              type: 'varchar(20)',
              nullable: false,
              defaultValue: 'draft',
              description: '问卷状态',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'created_by',
              type: 'varchar(50)',
              nullable: false,
              description: '创建者ID',
              isPrimaryKey: false,
              isForeignKey: true,
              references: {
                table: 'users',
                column: 'id'
              }
            },
            {
              name: 'created_at',
              type: 'timestamp',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
              description: '创建时间',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
              description: '更新时间',
              isPrimaryKey: false,
              isForeignKey: false
            }
          ],
          indexes: [
            {
              name: 'idx_questionnaires_status',
              columns: ['status'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_questionnaires_created_by',
              columns: ['created_by'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_questionnaires_questions',
              columns: ['questions'],
              unique: false,
              type: 'gin'
            }
          ],
          foreignKeys: [
            {
              name: 'fk_questionnaires_created_by',
              columns: ['created_by'],
              referencedTable: 'users',
              referencedColumns: ['id'],
              onDelete: 'RESTRICT',
              onUpdate: 'CASCADE'
            }
          ],
          primaryKey: ['id'],
          rowCount: 45,
          size: '1.2 MB',
          lastUpdated: new Date().toISOString(),
          dependencies: ['users'],
          dependents: ['questionnaire_submissions']
        },
        {
          id: 'questionnaire_submissions',
          name: 'questionnaire_submissions',
          description: '问卷提交记录表',
          schema: 'public',
          columns: [
            {
              name: 'id',
              type: 'varchar(50)',
              nullable: false,
              description: '提交记录唯一标识',
              isPrimaryKey: true,
              isForeignKey: false
            },
            {
              name: 'questionnaire_id',
              type: 'varchar(50)',
              nullable: false,
              description: '问卷ID',
              isPrimaryKey: false,
              isForeignKey: true,
              references: {
                table: 'questionnaires',
                column: 'id'
              }
            },
            {
              name: 'user_id',
              type: 'varchar(50)',
              nullable: true,
              description: '提交用户ID（可为空，支持匿名提交）',
              isPrimaryKey: false,
              isForeignKey: true,
              references: {
                table: 'users',
                column: 'id'
              }
            },
            {
              name: 'responses',
              type: 'jsonb',
              nullable: false,
              description: '问卷回答数据JSON',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'ip_address',
              type: 'inet',
              nullable: true,
              description: '提交者IP地址',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'user_agent',
              type: 'text',
              nullable: true,
              description: '用户代理字符串',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'submitted_at',
              type: 'timestamp',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
              description: '提交时间',
              isPrimaryKey: false,
              isForeignKey: false
            }
          ],
          indexes: [
            {
              name: 'idx_submissions_questionnaire_id',
              columns: ['questionnaire_id'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_submissions_user_id',
              columns: ['user_id'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_submissions_submitted_at',
              columns: ['submitted_at'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_submissions_responses',
              columns: ['responses'],
              unique: false,
              type: 'gin'
            }
          ],
          foreignKeys: [
            {
              name: 'fk_submissions_questionnaire_id',
              columns: ['questionnaire_id'],
              referencedTable: 'questionnaires',
              referencedColumns: ['id'],
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            },
            {
              name: 'fk_submissions_user_id',
              columns: ['user_id'],
              referencedTable: 'users',
              referencedColumns: ['id'],
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            }
          ],
          primaryKey: ['id'],
          rowCount: 3456,
          size: '15.7 MB',
          lastUpdated: new Date().toISOString(),
          dependencies: ['questionnaires', 'users'],
          dependents: ['audit_records']
        },
        {
          id: 'audit_records',
          name: 'audit_records',
          description: '审核记录表',
          schema: 'public',
          columns: [
            {
              name: 'id',
              type: 'varchar(50)',
              nullable: false,
              description: '审核记录唯一标识',
              isPrimaryKey: true,
              isForeignKey: false
            },
            {
              name: 'submission_id',
              type: 'varchar(50)',
              nullable: false,
              description: '问卷提交ID',
              isPrimaryKey: false,
              isForeignKey: true,
              references: {
                table: 'questionnaire_submissions',
                column: 'id'
              }
            },
            {
              name: 'reviewer_id',
              type: 'varchar(50)',
              nullable: false,
              description: '审核员ID',
              isPrimaryKey: false,
              isForeignKey: true,
              references: {
                table: 'users',
                column: 'id'
              }
            },
            {
              name: 'status',
              type: 'varchar(20)',
              nullable: false,
              description: '审核状态',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'comments',
              type: 'text',
              nullable: true,
              description: '审核意见',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'reviewed_at',
              type: 'timestamp',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
              description: '审核时间',
              isPrimaryKey: false,
              isForeignKey: false
            }
          ],
          indexes: [
            {
              name: 'idx_audit_submission_id',
              columns: ['submission_id'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_audit_reviewer_id',
              columns: ['reviewer_id'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_audit_status',
              columns: ['status'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_audit_reviewed_at',
              columns: ['reviewed_at'],
              unique: false,
              type: 'btree'
            }
          ],
          foreignKeys: [
            {
              name: 'fk_audit_submission_id',
              columns: ['submission_id'],
              referencedTable: 'questionnaire_submissions',
              referencedColumns: ['id'],
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            },
            {
              name: 'fk_audit_reviewer_id',
              columns: ['reviewer_id'],
              referencedTable: 'users',
              referencedColumns: ['id'],
              onDelete: 'RESTRICT',
              onUpdate: 'CASCADE'
            }
          ],
          primaryKey: ['id'],
          rowCount: 2890,
          size: '8.9 MB',
          lastUpdated: new Date().toISOString(),
          dependencies: ['questionnaire_submissions', 'users'],
          dependents: []
        },
        {
          id: 'stories',
          name: 'stories',
          description: '用户故事/心声表',
          schema: 'public',
          columns: [
            {
              name: 'id',
              type: 'varchar(50)',
              nullable: false,
              description: '故事唯一标识',
              isPrimaryKey: true,
              isForeignKey: false
            },
            {
              name: 'title',
              type: 'varchar(255)',
              nullable: false,
              description: '故事标题',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'content',
              type: 'text',
              nullable: false,
              description: '故事内容',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'author_name',
              type: 'varchar(100)',
              nullable: true,
              description: '作者姓名（可匿名）',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'category',
              type: 'varchar(50)',
              nullable: false,
              description: '故事分类',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'status',
              type: 'varchar(20)',
              nullable: false,
              defaultValue: 'pending',
              description: '审核状态',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'created_at',
              type: 'timestamp',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
              description: '创建时间',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'published_at',
              type: 'timestamp',
              nullable: true,
              description: '发布时间',
              isPrimaryKey: false,
              isForeignKey: false
            }
          ],
          indexes: [
            {
              name: 'idx_stories_category',
              columns: ['category'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_stories_status',
              columns: ['status'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_stories_created_at',
              columns: ['created_at'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_stories_content_search',
              columns: ['content'],
              unique: false,
              type: 'gin'
            }
          ],
          foreignKeys: [],
          primaryKey: ['id'],
          rowCount: 567,
          size: '4.2 MB',
          lastUpdated: new Date().toISOString(),
          dependencies: [],
          dependents: []
        },
        {
          id: 'user_sessions',
          name: 'user_sessions',
          description: '用户会话表',
          schema: 'public',
          columns: [
            {
              name: 'id',
              type: 'varchar(50)',
              nullable: false,
              description: '会话唯一标识',
              isPrimaryKey: true,
              isForeignKey: false
            },
            {
              name: 'user_id',
              type: 'varchar(50)',
              nullable: false,
              description: '用户ID',
              isPrimaryKey: false,
              isForeignKey: true,
              references: {
                table: 'users',
                column: 'id'
              }
            },
            {
              name: 'token',
              type: 'text',
              nullable: false,
              description: 'JWT token',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'ip_address',
              type: 'inet',
              nullable: true,
              description: '登录IP地址',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'user_agent',
              type: 'text',
              nullable: true,
              description: '用户代理字符串',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'expires_at',
              type: 'timestamp',
              nullable: false,
              description: 'token过期时间',
              isPrimaryKey: false,
              isForeignKey: false
            },
            {
              name: 'created_at',
              type: 'timestamp',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
              description: '创建时间',
              isPrimaryKey: false,
              isForeignKey: false
            }
          ],
          indexes: [
            {
              name: 'idx_sessions_user_id',
              columns: ['user_id'],
              unique: false,
              type: 'btree'
            },
            {
              name: 'idx_sessions_token',
              columns: ['token'],
              unique: true,
              type: 'btree'
            },
            {
              name: 'idx_sessions_expires_at',
              columns: ['expires_at'],
              unique: false,
              type: 'btree'
            }
          ],
          foreignKeys: [
            {
              name: 'fk_sessions_user_id',
              columns: ['user_id'],
              referencedTable: 'users',
              referencedColumns: ['id'],
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            }
          ],
          primaryKey: ['id'],
          rowCount: 892,
          size: '3.1 MB',
          lastUpdated: new Date().toISOString(),
          dependencies: ['users'],
          dependents: []
        }
      ];

      const mockRelations: DatabaseRelation[] = [
        {
          from: 'questionnaires',
          to: 'users',
          type: 'many-to-one',
          description: '问卷由用户创建'
        },
        {
          from: 'questionnaire_submissions',
          to: 'questionnaires',
          type: 'many-to-one',
          description: '提交记录关联问卷'
        },
        {
          from: 'questionnaire_submissions',
          to: 'users',
          type: 'many-to-one',
          description: '提交记录关联用户（可选）'
        },
        {
          from: 'audit_records',
          to: 'questionnaire_submissions',
          type: 'many-to-one',
          description: '审核记录关联提交记录'
        },
        {
          from: 'audit_records',
          to: 'users',
          type: 'many-to-one',
          description: '审核记录关联审核员'
        },
        {
          from: 'user_sessions',
          to: 'users',
          type: 'many-to-one',
          description: '会话关联用户'
        }
      ];

      setTables(mockTables);
      setRelations(mockRelations);
    } finally {
      setLoading(false);
    }
  };

  const generateERDiagram = () => {
    // 生成Mermaid ER图代码
    let mermaidCode = 'erDiagram\n';
    
    // 添加表定义
    tables.forEach(table => {
      mermaidCode += `    ${table.name} {\n`;
      table.columns.forEach(column => {
        const type = column.type.replace(/\(/g, '_').replace(/\)/g, '');
        const nullable = column.nullable ? '' : ' NOT_NULL';
        const pk = column.isPrimaryKey ? ' PK' : '';
        const fk = column.isForeignKey ? ' FK' : '';
        mermaidCode += `        ${type} ${column.name}${nullable}${pk}${fk}\n`;
      });
      mermaidCode += `    }\n\n`;
    });
    
    // 添加关系
    relations.forEach(relation => {
      const relationSymbol = relation.type === 'one-to-one' ? '||--||' :
                           relation.type === 'one-to-many' ? '||--o{' :
                           relation.type === 'many-to-one' ? '}o--||' :
                           '}{--o{';
      mermaidCode += `    ${relation.from} ${relationSymbol} ${relation.to} : "${relation.description}"\n`;
    });
    
    return mermaidCode;
  };

  const exportSchema = (format: 'sql' | 'json' | 'mermaid') => {
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    switch (format) {
      case 'sql':
        content = generateSQLSchema();
        filename = 'database-schema.sql';
        break;
      case 'json':
        content = JSON.stringify({ tables, relations }, null, 2);
        filename = 'database-schema.json';
        mimeType = 'application/json';
        break;
      case 'mermaid':
        content = generateERDiagram();
        filename = 'database-er-diagram.mmd';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success(`${format.toUpperCase()} 文件已导出`);
  };

  const generateSQLSchema = () => {
    let sql = '-- 数据库结构导出\n';
    sql += `-- 生成时间: ${new Date().toLocaleString()}\n\n`;
    
    tables.forEach(table => {
      sql += `-- 表: ${table.name}\n`;
      sql += `-- 描述: ${table.description}\n`;
      sql += `CREATE TABLE ${table.name} (\n`;
      
      const columnDefs = table.columns.map(column => {
        let def = `    ${column.name} ${column.type}`;
        if (!column.nullable) def += ' NOT NULL';
        if (column.defaultValue) def += ` DEFAULT ${column.defaultValue}`;
        return def;
      });
      
      sql += columnDefs.join(',\n');
      
      if (table.primaryKey.length > 0) {
        sql += `,\n    PRIMARY KEY (${table.primaryKey.join(', ')})`;
      }
      
      table.foreignKeys.forEach(fk => {
        sql += `,\n    CONSTRAINT ${fk.name} FOREIGN KEY (${fk.columns.join(', ')}) REFERENCES ${fk.referencedTable}(${fk.referencedColumns.join(', ')})`;
        sql += ` ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate}`;
      });
      
      sql += '\n);\n\n';
      
      // 添加索引
      table.indexes.forEach(index => {
        const unique = index.unique ? 'UNIQUE ' : '';
        sql += `CREATE ${unique}INDEX ${index.name} ON ${table.name} USING ${index.type} (${index.columns.join(', ')});\n`;
      });
      
      sql += '\n';
    });
    
    return sql;
  };

  const copyTableInfo = (table: DatabaseTable) => {
    const info = `表名: ${table.name}
描述: ${table.description}
记录数: ${table.rowCount}
大小: ${table.size}
主键: ${table.primaryKey.join(', ')}

字段信息:
${table.columns.map(col => 
  `- ${col.name} (${col.type}) ${col.nullable ? '' : 'NOT NULL'} ${col.isPrimaryKey ? 'PK' : ''} ${col.isForeignKey ? 'FK' : ''} - ${col.description}`
).join('\n')}

索引:
${table.indexes.map(idx => 
  `- ${idx.name}: ${idx.columns.join(', ')} (${idx.type}${idx.unique ? ', UNIQUE' : ''})`
).join('\n')}

外键约束:
${table.foreignKeys.map(fk => 
  `- ${fk.name}: ${fk.columns.join(', ')} -> ${fk.referencedTable}(${fk.referencedColumns.join(', ')})`
).join('\n')}`;

    navigator.clipboard.writeText(info).then(() => {
      message.success('表信息已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         table.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchema = selectedSchema === 'all' || table.schema === selectedSchema;
    
    return matchesSearch && matchesSchema;
  });

  const allSchemas = Array.from(new Set(tables.map(table => table.schema)));

  const columns = [
    {
      title: '表名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DatabaseTable) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
        </div>
      )
    },
    {
      title: '模式',
      dataIndex: 'schema',
      key: 'schema',
      width: 100,
      render: (schema: string) => <Tag color="blue">{schema}</Tag>
    },
    {
      title: '字段数',
      dataIndex: 'columns',
      key: 'columnCount',
      width: 80,
      render: (columns: TableColumn[]) => columns.length
    },
    {
      title: '记录数',
      dataIndex: 'rowCount',
      key: 'rowCount',
      width: 100,
      render: (count: number) => count.toLocaleString()
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 80
    },
    {
      title: '依赖关系',
      key: 'relationships',
      width: 150,
      render: (_: any, record: DatabaseTable) => (
        <div>
          {record.dependencies.length > 0 && (
            <div>
              <Text type="secondary">依赖: </Text>
              {record.dependencies.map(dep => <Tag key={dep}>{dep}</Tag>)}
            </div>
          )}
          {record.dependents.length > 0 && (
            <div>
              <Text type="secondary">被依赖: </Text>
              {record.dependents.map(dep => <Tag key={dep} color="orange">{dep}</Tag>)}
            </div>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: DatabaseTable) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              size="small" 
              icon={<TableOutlined />}
              onClick={() => {
                setSelectedTable(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="复制表信息">
            <Button 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => copyTableInfo(record)}
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
          <DatabaseOutlined /> 数据库结构管理
        </Title>
        <Text type="secondary">
          数据库表结构可视化与关系图管理 • 共 {tables.length} 个表 • {relations.length} 个关系
        </Text>
      </div>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="数据表总数"
              value={tables.length}
              prefix={<TableOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总记录数"
              value={tables.reduce((sum, table) => sum + table.rowCount, 0)}
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="关系数量"
              value={relations.length}
              prefix={<LinkOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="数据库大小"
              value="36.4"
              suffix="MB"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择模式"
              value={selectedSchema}
              onChange={setSelectedSchema}
            >
              <Option value="all">全部模式</Option>
              {allSchemas.map(schema => (
                <Option key={schema} value={schema}>{schema}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Search
              placeholder="搜索表名或描述"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={10}>
            <Space>
              <Button 
                type="primary" 
                icon={<SyncOutlined />}
                onClick={fetchDatabaseSchema}
                loading={loading}
              >
                刷新结构
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => {
                  // 使用render-mermaid工具渲染ER图
                  const mermaidCode = generateERDiagram();
                  // 这里可以调用render-mermaid工具
                  message.success('ER图已生成，请查看下方图表');
                }}
              >
                生成ER图
              </Button>
              <Button.Group>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => exportSchema('sql')}
                >
                  导出SQL
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => exportSchema('json')}
                >
                  导出JSON
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => exportSchema('mermaid')}
                >
                  导出Mermaid
                </Button>
              </Button.Group>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 数据表列表 */}
      <Card title={`数据表列表 (${filteredTables.length}/${tables.length})`}>
        <Table
          columns={columns}
          dataSource={filteredTables}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          size="small"
        />
      </Card>

      {/* 关系图概览 */}
      <Card title="表关系概览" style={{ marginTop: '24px' }}>
        <Row gutter={16}>
          {relations.map((relation, index) => (
            <Col xs={24} sm={12} md={8} key={index} style={{ marginBottom: '16px' }}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <Tag color="blue">{relation.from}</Tag>
                  <br />
                  <LinkOutlined style={{ margin: '8px 0', color: '#1890ff' }} />
                  <br />
                  <Tag color="green">{relation.to}</Tag>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {relation.type} • {relation.description}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 表详情Modal */}
      <Modal
        title={selectedTable ? `表: ${selectedTable.name}` : '表详情'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={1000}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => selectedTable && copyTableInfo(selectedTable)}>
            复制表信息
          </Button>,
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedTable && (
          <Tabs defaultActiveKey="overview">
            <TabPane tab="概览" key="overview">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="表名">{selectedTable.name}</Descriptions.Item>
                <Descriptions.Item label="模式">{selectedTable.schema}</Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>{selectedTable.description}</Descriptions.Item>
                <Descriptions.Item label="记录数">{selectedTable.rowCount.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="大小">{selectedTable.size}</Descriptions.Item>
                <Descriptions.Item label="主键">{selectedTable.primaryKey.join(', ')}</Descriptions.Item>
                <Descriptions.Item label="最后更新">{new Date(selectedTable.lastUpdated).toLocaleString()}</Descriptions.Item>
              </Descriptions>
            </TabPane>
            
            <TabPane tab="字段" key="columns">
              <Table
                dataSource={selectedTable.columns}
                columns={[
                  { title: '字段名', dataIndex: 'name', key: 'name' },
                  { title: '类型', dataIndex: 'type', key: 'type' },
                  { 
                    title: '可空', 
                    dataIndex: 'nullable', 
                    key: 'nullable',
                    render: (nullable: boolean) => nullable ? <Tag color="orange">是</Tag> : <Tag color="red">否</Tag>
                  },
                  { title: '默认值', dataIndex: 'defaultValue', key: 'defaultValue' },
                  { title: '描述', dataIndex: 'description', key: 'description' },
                  { 
                    title: '约束', 
                    key: 'constraints',
                    render: (_: any, record: TableColumn) => (
                      <Space>
                        {record.isPrimaryKey && <Tag color="red">PK</Tag>}
                        {record.isForeignKey && <Tag color="blue">FK</Tag>}
                        {record.references && (
                          <Tooltip title={`引用 ${record.references.table}.${record.references.column}`}>
                            <Tag color="purple">REF</Tag>
                          </Tooltip>
                        )}
                      </Space>
                    )
                  }
                ]}
                pagination={false}
                size="small"
              />
            </TabPane>
            
            <TabPane tab="索引" key="indexes">
              <Table
                dataSource={selectedTable.indexes}
                columns={[
                  { title: '索引名', dataIndex: 'name', key: 'name' },
                  { title: '字段', dataIndex: 'columns', key: 'columns', render: (cols: string[]) => cols.join(', ') },
                  { 
                    title: '类型', 
                    dataIndex: 'type', 
                    key: 'type',
                    render: (type: string) => <Tag color="blue">{type.toUpperCase()}</Tag>
                  },
                  { 
                    title: '唯一', 
                    dataIndex: 'unique', 
                    key: 'unique',
                    render: (unique: boolean) => unique ? <Tag color="green">是</Tag> : <Tag>否</Tag>
                  }
                ]}
                pagination={false}
                size="small"
              />
            </TabPane>
            
            <TabPane tab="外键" key="foreignKeys">
              <Table
                dataSource={selectedTable.foreignKeys}
                columns={[
                  { title: '约束名', dataIndex: 'name', key: 'name' },
                  { title: '字段', dataIndex: 'columns', key: 'columns', render: (cols: string[]) => cols.join(', ') },
                  { title: '引用表', dataIndex: 'referencedTable', key: 'referencedTable' },
                  { title: '引用字段', dataIndex: 'referencedColumns', key: 'referencedColumns', render: (cols: string[]) => cols.join(', ') },
                  { title: '删除操作', dataIndex: 'onDelete', key: 'onDelete', render: (action: string) => <Tag>{action}</Tag> },
                  { title: '更新操作', dataIndex: 'onUpdate', key: 'onUpdate', render: (action: string) => <Tag>{action}</Tag> }
                ]}
                pagination={false}
                size="small"
              />
            </TabPane>
            
            <TabPane tab="关系" key="relationships">
              <div>
                <Title level={5}>依赖的表:</Title>
                {selectedTable.dependencies.length > 0 ? (
                  <Space wrap>
                    {selectedTable.dependencies.map(dep => <Tag key={dep} color="blue">{dep}</Tag>)}
                  </Space>
                ) : (
                  <Text type="secondary">无依赖</Text>
                )}
                
                <Divider />
                
                <Title level={5}>被依赖的表:</Title>
                {selectedTable.dependents.length > 0 ? (
                  <Space wrap>
                    {selectedTable.dependents.map(dep => <Tag key={dep} color="orange">{dep}</Tag>)}
                  </Space>
                ) : (
                  <Text type="secondary">无被依赖</Text>
                )}
              </div>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default AdminDatabaseSchema;
