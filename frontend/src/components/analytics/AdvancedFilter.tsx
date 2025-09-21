import React, { useState } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Slider,
  Checkbox,
  Button,
  Space,
  Row,
  Col,
  Collapse,
  InputNumber
} from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

export interface FilterValues {
  dateRange?: [any, any];
  education?: string[];
  ageRange?: [number, number];
  salaryRange?: [number, number];
  region?: string[];
  employmentStatus?: string[];
  skills?: string[];
}

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
  loading?: boolean;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  onFilterChange,
  onReset,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<FilterValues>({});

  const educationOptions = [
    { label: '高中及以下', value: 'high_school' },
    { label: '专科', value: 'college' },
    { label: '本科', value: 'bachelor' },
    { label: '硕士', value: 'master' },
    { label: '博士', value: 'phd' }
  ];

  const regionOptions = [
    { label: '北京', value: 'beijing' },
    { label: '上海', value: 'shanghai' },
    { label: '广州', value: 'guangzhou' },
    { label: '深圳', value: 'shenzhen' },
    { label: '杭州', value: 'hangzhou' },
    { label: '成都', value: 'chengdu' },
    { label: '其他', value: 'others' }
  ];

  const employmentStatusOptions = [
    { label: '已就业', value: 'employed' },
    { label: '求职中', value: 'job_seeking' },
    { label: '继续深造', value: 'studying' },
    { label: '暂不就业', value: 'not_seeking' }
  ];

  const skillsOptions = [
    { label: 'Java', value: 'java' },
    { label: 'Python', value: 'python' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'React', value: 'react' },
    { label: 'Vue', value: 'vue' },
    { label: 'Node.js', value: 'nodejs' },
    { label: 'SQL', value: 'sql' },
    { label: 'Git', value: 'git' }
  ];

  const handleValuesChange = (changedValues: any, allValues: any) => {
    const newFilters = { ...filters, ...changedValues };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    onReset();
  };

  return (
    <Card 
      title={
        <Space>
          <FilterOutlined />
          高级筛选
        </Space>
      }
      extra={
        <Button 
          icon={<ClearOutlined />} 
          onClick={handleReset}
          size="small"
        >
          重置
        </Button>
      }
      size="small"
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        size="small"
      >
        <Collapse size="small" ghost>
          <Panel header="时间筛选" key="time">
            <Form.Item name="dateRange" label="日期范围">
              <RangePicker 
                style={{ width: '100%' }}
                placeholder={['开始日期', '结束日期']}
              />
            </Form.Item>
          </Panel>

          <Panel header="基本信息" key="basic">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="education" label="学历">
                  <Select
                    mode="multiple"
                    placeholder="选择学历"
                    options={educationOptions}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="region" label="地区">
                  <Select
                    mode="multiple"
                    placeholder="选择地区"
                    options={regionOptions}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="ageRange" label="年龄范围">
              <Slider
                range
                min={18}
                max={60}
                defaultValue={[18, 60]}
                marks={{
                  18: '18',
                  25: '25',
                  30: '30',
                  40: '40',
                  60: '60'
                }}
              />
            </Form.Item>
          </Panel>

          <Panel header="就业信息" key="employment">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="employmentStatus" label="就业状态">
                  <Select
                    mode="multiple"
                    placeholder="选择就业状态"
                    options={employmentStatusOptions}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="salaryRange" label="期望薪资范围 (K)">
                  <Slider
                    range
                    min={3}
                    max={50}
                    defaultValue={[3, 50]}
                    marks={{
                      3: '3K',
                      10: '10K',
                      20: '20K',
                      30: '30K',
                      50: '50K+'
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          <Panel header="技能筛选" key="skills">
            <Form.Item name="skills" label="技能">
              <Checkbox.Group options={skillsOptions} />
            </Form.Item>
          </Panel>
        </Collapse>
      </Form>
    </Card>
  );
};

export default AdvancedFilter;
