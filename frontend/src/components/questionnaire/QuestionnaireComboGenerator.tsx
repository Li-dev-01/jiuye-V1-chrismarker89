/**
 * 问卷组合生成器 - 用于生成用户画像标签和励志名言
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  Button, 
  Tag, 
  Typography, 
  Row, 
  Col, 
  Space, 
  Divider,
  Alert,
  Statistic,
  Progress,
  Badge
} from 'antd';
import { 
  UserOutlined, 
  TagOutlined, 
  BulbOutlined, 
  ReloadOutlined,
  ExportOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// 用户画像接口
interface UserProfile {
  gender: 'male' | 'female' | 'prefer-not-say';
  ageRange: string;
  education: string;
  employmentStatus: string;
  economicPressure?: string;
  employmentConfidence?: string;
}

// 用户标签接口
interface UserTag {
  id: string;
  name: string;
  description: string;
  color: string;
  category: string;
}

// 励志名言接口
interface MotivationalQuote {
  id: string;
  text: string;
  author?: string;
  category: string;
}

// 选项配置
const OPTIONS = {
  gender: [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'prefer-not-say', label: '不愿透露' }
  ],
  ageRange: [
    { value: 'under-20', label: '20岁以下' },
    { value: '20-22', label: '20-22岁（在校大学生为主）' },
    { value: '23-25', label: '23-25岁（应届毕业生为主）' },
    { value: '26-28', label: '26-28岁（职场新人为主）' },
    { value: '29-35', label: '29-35岁（职场中坚为主）' },
    { value: 'over-35', label: '35岁以上（职场资深为主）' }
  ],
  education: [
    { value: 'high-school', label: '高中/中专' },
    { value: 'junior-college', label: '专科' },
    { value: 'bachelor', label: '本科' },
    { value: 'master', label: '硕士研究生' },
    { value: 'phd', label: '博士研究生' }
  ],
  employmentStatus: [
    { value: 'fulltime', label: '全职工作' },
    { value: 'student', label: '在校学生' },
    { value: 'unemployed', label: '待业/求职中' },
    { value: 'freelance', label: '自由职业' },
    { value: 'entrepreneur', label: '创业' }
  ],
  economicPressure: [
    { value: 'none', label: '无压力' },
    { value: 'light', label: '轻微压力' },
    { value: 'medium', label: '中等压力' },
    { value: 'high', label: '较大压力' },
    { value: 'extreme', label: '极大压力' }
  ],
  employmentConfidence: [
    { value: 'very-confident', label: '非常有信心' },
    { value: 'confident', label: '比较有信心' },
    { value: 'neutral', label: '一般' },
    { value: 'worried', label: '比较担心' },
    { value: 'very-worried', label: '非常担心' }
  ]
};

export const QuestionnaireComboGenerator: React.FC = () => {
  const [form] = Form.useForm();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [generatedTags, setGeneratedTags] = useState<UserTag[]>([]);
  const [generatedQuote, setGeneratedQuote] = useState<MotivationalQuote | null>(null);
  const [totalCombinations, setTotalCombinations] = useState(0);

  // 计算总组合数
  useEffect(() => {
    const total = OPTIONS.gender.length * 
                  OPTIONS.ageRange.length * 
                  OPTIONS.education.length * 
                  OPTIONS.employmentStatus.length * 
                  OPTIONS.economicPressure.length * 
                  OPTIONS.employmentConfidence.length;
    setTotalCombinations(total);
  }, []);

  // 标签生成逻辑
  const generateTags = (profile: Partial<UserProfile>): UserTag[] => {
    const tags: UserTag[] = [];

    // 基础人群标签
    if (profile.education === 'master' || profile.education === 'phd') {
      if (profile.employmentConfidence === 'very-confident' || profile.employmentConfidence === 'confident') {
        tags.push({
          id: 'academic-elite',
          name: '学霸型',
          description: '高学历 + 高信心',
          color: 'blue',
          category: '基础人群'
        });
      }
    }

    if (profile.employmentStatus === 'unemployed') {
      tags.push({
        id: 'job-seeker',
        name: '求职战士',
        description: '正在积极寻找工作机会',
        color: 'orange',
        category: '就业状态'
      });
    }

    if (profile.economicPressure === 'high' || profile.economicPressure === 'extreme') {
      if (profile.ageRange === '20-22' || profile.ageRange === '23-25') {
        tags.push({
          id: 'debt-youth',
          name: '负债青年',
          description: '年轻 + 高经济压力',
          color: 'red',
          category: '经济状况'
        });
      }
    }

    if (profile.employmentConfidence === 'very-confident' && profile.economicPressure === 'none') {
      tags.push({
        id: 'optimist',
        name: '乐观派',
        description: '高信心 + 低压力',
        color: 'green',
        category: '性格特征'
      });
    }

    if (profile.employmentStatus === 'student' && (profile.education === 'master' || profile.education === 'phd')) {
      tags.push({
        id: 'campus-elite',
        name: '校园精英',
        description: '在校学生 + 高学历',
        color: 'purple',
        category: '就业状态'
      });
    }

    if (profile.employmentConfidence === 'worried' || profile.employmentConfidence === 'very-worried') {
      tags.push({
        id: 'confused',
        name: '迷茫型',
        description: '对未来缺乏信心',
        color: 'gray',
        category: '性格特征'
      });
    }

    if (profile.employmentStatus === 'freelance') {
      tags.push({
        id: 'free-bird',
        name: '自由飞鸟',
        description: '追求自由的工作方式',
        color: 'cyan',
        category: '就业状态'
      });
    }

    return tags;
  };

  // 名言生成逻辑
  const generateQuote = (tags: UserTag[]): MotivationalQuote => {
    const quotes: Record<string, MotivationalQuote[]> = {
      'academic-elite': [
        { id: '1', text: '知识就是力量，你已经拥有了最好的武器', author: '培根', category: '学习成长' },
        { id: '2', text: '优秀是一种习惯，你正在路上', author: '亚里士多德', category: '学习成长' }
      ],
      'job-seeker': [
        { id: '3', text: '机会总是留给有准备的人', author: '路易·巴斯德', category: '求职励志' },
        { id: '4', text: '每一次拒绝都是离成功更近一步', category: '求职励志' }
      ],
      'debt-youth': [
        { id: '5', text: '债务是暂时的，能力是永久的', category: '经济励志' },
        { id: '6', text: '今天的困难，是明天的财富', category: '经济励志' }
      ],
      'optimist': [
        { id: '7', text: '保持乐观，世界因你而美好', category: '心态调节' },
        { id: '8', text: '阳光总在风雨后', category: '心态调节' }
      ],
      'campus-elite': [
        { id: '9', text: '学而时习之，不亦说乎', author: '孔子', category: '学习成长' },
        { id: '10', text: '青春是用来奋斗的，不是用来挥霍的', category: '青春励志' }
      ],
      'confused': [
        { id: '11', text: '迷茫是成长的必经之路，勇敢走下去', category: '心态调节' },
        { id: '12', text: '山重水复疑无路，柳暗花明又一村', author: '陆游', category: '心态调节' }
      ],
      'free-bird': [
        { id: '13', text: '自由不是想做什么就做什么，而是不想做什么就不做什么', category: '自由职业' },
        { id: '14', text: '做自己喜欢的事，让喜欢的事有价值', category: '自由职业' }
      ]
    };

    // 根据标签优先级选择名言
    for (const tag of tags) {
      if (quotes[tag.id]) {
        const tagQuotes = quotes[tag.id];
        return tagQuotes[Math.floor(Math.random() * tagQuotes.length)];
      }
    }

    // 默认励志名言
    const defaultQuotes = [
      { id: 'default1', text: '相信自己，你比想象中更强大', category: '通用励志' },
      { id: 'default2', text: '每一天都是新的开始', category: '通用励志' },
      { id: 'default3', text: '成功的路上并不拥挤，因为坚持的人不多', category: '通用励志' }
    ];
    
    return defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
  };

  // 处理表单变化
  const handleFormChange = (changedValues: any, allValues: any) => {
    setProfile(allValues);
    
    if (Object.keys(allValues).length >= 4) { // 至少填写4个基础字段
      const tags = generateTags(allValues);
      const quote = generateQuote(tags);
      
      setGeneratedTags(tags);
      setGeneratedQuote(quote);
    }
  };

  // 随机生成组合
  const generateRandomCombo = () => {
    const randomProfile: UserProfile = {
      gender: OPTIONS.gender[Math.floor(Math.random() * OPTIONS.gender.length)].value as any,
      ageRange: OPTIONS.ageRange[Math.floor(Math.random() * OPTIONS.ageRange.length)].value,
      education: OPTIONS.education[Math.floor(Math.random() * OPTIONS.education.length)].value,
      employmentStatus: OPTIONS.employmentStatus[Math.floor(Math.random() * OPTIONS.employmentStatus.length)].value,
      economicPressure: OPTIONS.economicPressure[Math.floor(Math.random() * OPTIONS.economicPressure.length)].value,
      employmentConfidence: OPTIONS.employmentConfidence[Math.floor(Math.random() * OPTIONS.employmentConfidence.length)].value
    };

    form.setFieldsValue(randomProfile);
    setProfile(randomProfile);
    
    const tags = generateTags(randomProfile);
    const quote = generateQuote(tags);
    
    setGeneratedTags(tags);
    setGeneratedQuote(quote);
  };

  return (
    <div className="questionnaire-combo-generator p-6">
      <div className="mb-6">
        <Title level={2}>
          <UserOutlined className="mr-2" />
          问卷组合生成器
        </Title>
        <Paragraph className="text-gray-600">
          基于用户特征生成个性化标签和励志名言，用于测试数据生成和可视化优化
        </Paragraph>
      </div>

      {/* 统计信息 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="理论组合总数"
              value={totalCombinations}
              prefix={<BarChartOutlined />}
              formatter={(value) => `${value?.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="有效组合估计"
              value={Math.floor(totalCombinations * 0.75)}
              prefix={<UserOutlined />}
              formatter={(value) => `${value?.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="当前标签数"
              value={generatedTags.length}
              prefix={<TagOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* 左侧：选项配置 */}
        <Col xs={24} lg={12}>
          <Card title="用户特征选择" extra={
            <Button 
              icon={<ReloadOutlined />} 
              onClick={generateRandomCombo}
              type="primary"
            >
              随机生成
            </Button>
          }>
            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleFormChange}
            >
              <Form.Item name="gender" label="性别">
                <Select placeholder="请选择性别">
                  {OPTIONS.gender.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="ageRange" label="年龄段">
                <Select placeholder="请选择年龄段">
                  {OPTIONS.ageRange.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="education" label="学历">
                <Select placeholder="请选择学历">
                  {OPTIONS.education.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="employmentStatus" label="就业状态">
                <Select placeholder="请选择就业状态">
                  {OPTIONS.employmentStatus.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="economicPressure" label="经济压力">
                <Select placeholder="请选择经济压力程度">
                  {OPTIONS.economicPressure.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="employmentConfidence" label="就业信心">
                <Select placeholder="请选择就业信心">
                  {OPTIONS.employmentConfidence.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧：生成结果 */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size="large" className="w-full">
            {/* 生成的标签 */}
            <Card title={
              <span>
                <TagOutlined className="mr-2" />
                生成的用户标签
              </span>
            }>
              {generatedTags.length > 0 ? (
                <Space wrap>
                  {generatedTags.map(tag => (
                    <Badge key={tag.id} count={tag.category} size="small">
                      <Tag color={tag.color} className="mb-2">
                        <strong>{tag.name}</strong>
                        <br />
                        <Text className="text-xs">{tag.description}</Text>
                      </Tag>
                    </Badge>
                  ))}
                </Space>
              ) : (
                <Alert
                  message="请至少选择4个基础特征来生成标签"
                  type="info"
                  showIcon
                />
              )}
            </Card>

            {/* 励志名言 */}
            <Card title={
              <span>
                <BulbOutlined className="mr-2" />
                专属励志名言
              </span>
            }>
              {generatedQuote ? (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Paragraph className="text-lg font-medium text-blue-800 mb-2">
                    "{generatedQuote.text}"
                  </Paragraph>
                  {generatedQuote.author && (
                    <Text className="text-blue-600">
                      —— {generatedQuote.author}
                    </Text>
                  )}
                  <div className="mt-2">
                    <Tag color="blue">{generatedQuote.category}</Tag>
                  </div>
                </div>
              ) : (
                <Alert
                  message="选择用户特征后将生成专属励志名言"
                  type="info"
                  showIcon
                />
              )}
            </Card>

            {/* 操作按钮 */}
            <Card>
              <Space>
                <Button 
                  type="primary" 
                  icon={<ExportOutlined />}
                  disabled={generatedTags.length === 0}
                >
                  导出数据
                </Button>
                <Button 
                  icon={<BarChartOutlined />}
                  disabled={generatedTags.length === 0}
                >
                  预览可视化
                </Button>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default QuestionnaireComboGenerator;
