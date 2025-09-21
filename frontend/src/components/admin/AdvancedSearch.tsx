import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Dropdown,
  Modal,
  message,
  Divider
} from 'antd';
import {
  SearchOutlined,
  SaveOutlined,
  ClearOutlined,
  HistoryOutlined,
  FilterOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface SearchFilters {
  keyword?: string;
  status?: string[];
  type?: string[];
  dateRange?: [any, any];
  submittedBy?: string;
  tags?: string[];
}

interface SavedFilter {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
  loading?: boolean;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onReset,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({});
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
    {
      id: '1',
      name: '待审核问卷',
      filters: { status: ['pending'], type: ['questionnaire'] },
      createdAt: '2025-01-15'
    },
    {
      id: '2',
      name: '本周新故事',
      filters: { type: ['story'], dateRange: [null, null] },
      createdAt: '2025-01-14'
    }
  ]);

  const statusOptions = [
    { label: '待审核', value: 'pending' },
    { label: '已通过', value: 'approved' },
    { label: '已拒绝', value: 'rejected' },
    { label: '草稿', value: 'draft' }
  ];

  const typeOptions = [
    { label: '问卷', value: 'questionnaire' },
    { label: '故事', value: 'story' },
    { label: '评论', value: 'comment' }
  ];

  const tagOptions = [
    { label: '就业', value: 'employment' },
    { label: '求职', value: 'job-seeking' },
    { label: '薪资', value: 'salary' },
    { label: '经验', value: 'experience' },
    { label: '困难', value: 'difficulty' },
    { label: '成功', value: 'success' }
  ];

  const handleSearch = () => {
    form.validateFields().then(values => {
      const filters = {
        ...values,
        dateRange: values.dateRange || undefined
      };
      setActiveFilters(filters);
      onSearch(filters);
    });
  };

  const handleReset = () => {
    form.resetFields();
    setActiveFilters({});
    onReset();
  };

  const handleSaveFilter = () => {
    const values = form.getFieldsValue();
    if (Object.keys(values).some(key => values[key])) {
      setSaveModalVisible(true);
    } else {
      message.warning('请先设置筛选条件');
    }
  };

  const handleSaveConfirm = (filterName: string) => {
    const values = form.getFieldsValue();
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: values,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setSavedFilters(prev => [newFilter, ...prev]);
    setSaveModalVisible(false);
    message.success('筛选条件已保存');
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    form.setFieldsValue(filter.filters);
    setActiveFilters(filter.filters);
    onSearch(filter.filters);
    message.success(`已加载筛选条件：${filter.name}`);
  };

  const handleDeleteFilter = (filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
    message.success('筛选条件已删除');
  };

  const getActiveFilterTags = () => {
    const tags: React.ReactNode[] = [];
    
    if (activeFilters.keyword) {
      tags.push(
        <Tag key="keyword" closable onClose={() => {
          form.setFieldValue('keyword', undefined);
          handleSearch();
        }}>
          关键词: {activeFilters.keyword}
        </Tag>
      );
    }
    
    if (activeFilters.status?.length) {
      tags.push(
        <Tag key="status" closable onClose={() => {
          form.setFieldValue('status', undefined);
          handleSearch();
        }}>
          状态: {activeFilters.status.join(', ')}
        </Tag>
      );
    }
    
    if (activeFilters.type?.length) {
      tags.push(
        <Tag key="type" closable onClose={() => {
          form.setFieldValue('type', undefined);
          handleSearch();
        }}>
          类型: {activeFilters.type.join(', ')}
        </Tag>
      );
    }
    
    return tags;
  };

  const savedFilterItems = savedFilters.map(filter => ({
    key: filter.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{filter.name}</span>
        <Button
          type="text"
          size="small"
          danger
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteFilter(filter.id);
          }}
        >
          删除
        </Button>
      </div>
    ),
    onClick: () => handleLoadFilter(filter)
  }));

  return (
    <Card
      title={
        <Space>
          <FilterOutlined />
          高级搜索
        </Space>
      }
      extra={
        <Space>
          <Dropdown
            menu={{ items: savedFilterItems }}
            disabled={savedFilters.length === 0}
          >
            <Button icon={<HistoryOutlined />}>
              历史筛选 ({savedFilters.length})
            </Button>
          </Dropdown>
          <Button icon={<SaveOutlined />} onClick={handleSaveFilter}>
            保存筛选
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="keyword" label="关键词">
              <Input
                placeholder="搜索标题、内容..."
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="status" label="状态">
              <Select
                mode="multiple"
                placeholder="选择状态"
                options={statusOptions}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="type" label="类型">
              <Select
                mode="multiple"
                placeholder="选择类型"
                options={typeOptions}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="submittedBy" label="提交者">
              <Input
                placeholder="用户名或邮箱"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="dateRange" label="提交时间">
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['开始日期', '结束日期']}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="tags" label="标签">
              <Select
                mode="multiple"
                placeholder="选择标签"
                options={tagOptions}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={24}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
              >
                搜索
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>

      {getActiveFilterTags().length > 0 && (
        <>
          <Divider />
          <div>
            <span style={{ marginRight: 8 }}>当前筛选:</span>
            <Space wrap>
              {getActiveFilterTags()}
            </Space>
          </div>
        </>
      )}

      <Modal
        title="保存筛选条件"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        footer={null}
      >
        <Form
          onFinish={(values) => handleSaveConfirm(values.name)}
        >
          <Form.Item
            name="name"
            label="筛选名称"
            rules={[{ required: true, message: '请输入筛选名称' }]}
          >
            <Input placeholder="为这个筛选条件起个名字" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setSaveModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
