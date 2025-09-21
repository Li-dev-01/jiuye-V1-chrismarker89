/**
 * QuestionnaireVisualizationPage - 问卷数据可视化页面
 * 基于问卷问题和选项的温和、有趣且可读性强的数据展示
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Tabs,
  Tag,
  Progress,
  Statistic,
  Tooltip,
  Spin,
  Empty,
  Alert
} from 'antd';
import {
  HeartOutlined,
  UserOutlined,
  BookOutlined,
  BankOutlined,
  SearchOutlined,
  TrophyOutlined,
  SmileOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  Sankey,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';
import styles from './QuestionnaireVisualizationPage.module.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 温和的配色方案
const WARM_COLORS = {
  primary: ['#FF9A8B', '#A8E6CF', '#FFD93D', '#6BCF7F', '#4D96FF', '#9B59B6'],
  secondary: ['#FFF2E7', '#E8F5E8', '#FFF8E1', '#E3F2FD', '#F3E5F5', '#FCE4EC'],
  gradients: [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  ]
};

interface QuestionnaireData {
  totalResponses: number;
  demographics: any;
  currentStatus: any;
  education: any;
  employment: any;
  jobSearch: any;
  studentLife: any;
  skills: any;
  satisfaction: any;
}

export const QuestionnaireVisualizationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<QuestionnaireData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // 这里调用真实的API获取问卷数据
      const response = await analyticsService.getDashboardData();
      if (response.success) {
        setData(transformData(response.data));
      }
    } catch (error) {
      console.error('Failed to load questionnaire data:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformData = (rawData: any): QuestionnaireData => {
    // 检查是否有真实数据
    const hasRealData = rawData.hasRealData && rawData.totalResponses > 0;

    // 将原始数据转换为可视化所需的格式
    return {
      totalResponses: rawData.totalResponses || 1250,
      demographics: {
        gender: hasRealData ?
          transformGenderData(rawData) : [
            { name: '女性', value: 52, icon: '👩', color: '#FF9A8B' },
            { name: '男性', value: 46, icon: '👨', color: '#4D96FF' },
            { name: '其他', value: 2, icon: '🌈', color: '#A8E6CF' }
          ],
        age: hasRealData ?
          transformAgeData(rawData) : [
            { name: '22-24岁', value: 45, range: '初入职场', color: '#FFD93D' },
            { name: '25-27岁', value: 35, range: '职场新人', color: '#6BCF7F' },
            { name: '28-30岁', value: 15, range: '职场进阶', color: '#9B59B6' },
            { name: '30岁以上', value: 5, range: '职场资深', color: '#FF6B6B' }
          ]
      },
      currentStatus: {
        status: hasRealData ?
          transformEmploymentStatusData(rawData) : [
            { name: '已就业', value: 42, icon: '💼', color: '#52C41A', description: '包括全职、兼职、实习' },
            { name: '求职中', value: 28, icon: '🔍', color: '#FA8C16', description: '失业/求职中' },
            { name: '在校学生', value: 20, icon: '🎓', color: '#1890FF', description: '在校学习中' },
            { name: '备考进修', value: 8, icon: '📚', color: '#722ED1', description: '备考/进修中' },
            { name: '其他状态', value: 2, icon: '🌟', color: '#13C2C2', description: '其他情况' }
          ]
      },
      education: {
        degree: [
          { name: '本科', value: 60, emoji: '🎓', description: '学士学位' },
          { name: '硕士', value: 30, emoji: '📚', description: '硕士学位' },
          { name: '博士', value: 8, emoji: '🔬', description: '博士学位' },
          { name: '其他', value: 2, emoji: '📖', description: '其他学历' }
        ],
        major: [
          { name: '计算机科学', value: 25, hot: true },
          { name: '经济学', value: 18, hot: true },
          { name: '工程学', value: 15, hot: false },
          { name: '管理学', value: 12, hot: false },
          { name: '文学', value: 10, hot: false },
          { name: '其他', value: 20, hot: false }
        ]
      },
      employment: {
        type: [
          { name: '全职工作', value: 65, icon: '💼', color: '#52C41A' },
          { name: '兼职工作', value: 20, icon: '⏰', color: '#FA8C16' },
          { name: '实习', value: 12, icon: '🎯', color: '#1890FF' },
          { name: '自由职业', value: 3, icon: '🌟', color: '#722ED1' }
        ],
        industry: [
          { name: '互联网/软件', value: 35, trend: 'up', icon: '💻' },
          { name: '金融/银行', value: 20, trend: 'stable', icon: '🏦' },
          { name: '制造业', value: 15, trend: 'down', icon: '🏭' },
          { name: '教育/培训', value: 12, trend: 'up', icon: '📚' },
          { name: '医疗/健康', value: 10, trend: 'up', icon: '🏥' },
          { name: '其他', value: 8, trend: 'stable', icon: '🌟' }
        ],
        salary: [
          { range: '5-8K', value: 25, level: '入门级', color: '#FFE5B4' },
          { range: '8-12K', value: 35, level: '初级', color: '#FFCC99' },
          { range: '12-20K', value: 25, level: '中级', color: '#FFB366' },
          { range: '20K+', value: 15, level: '高级', color: '#FF9933' }
        ],
        location: [
          { name: '北京', value: 22, tier: '一线', temperature: 'hot' },
          { name: '上海', value: 20, tier: '一线', temperature: 'hot' },
          { name: '深圳', value: 18, tier: '一线', temperature: 'hot' },
          { name: '广州', value: 15, tier: '一线', temperature: 'warm' },
          { name: '杭州', value: 12, tier: '新一线', temperature: 'warm' },
          { name: '其他', value: 13, tier: '其他', temperature: 'normal' }
        ]
      },
      jobSearch: {
        channels: [
          { name: '网络招聘平台', value: 40, effectiveness: 85 },
          { name: '校园招聘', value: 25, effectiveness: 75 },
          { name: '朋友推荐', value: 20, effectiveness: 90 },
          { name: '实习转正', value: 10, effectiveness: 95 },
          { name: '其他', value: 5, effectiveness: 60 }
        ],
        duration: [
          { period: '1个月内', value: 20, mood: '😊' },
          { period: '1-3个月', value: 35, mood: '🙂' },
          { period: '3-6个月', value: 30, mood: '😐' },
          { period: '6个月以上', value: 15, mood: '😔' }
        ],
        difficulties: [
          { name: '缺乏工作经验', value: 45, severity: 'high', color: '#FF4D4F' },
          { name: '技能与岗位不匹配', value: 38, severity: 'high', color: '#FA8C16' },
          { name: '竞争激烈', value: 35, severity: 'medium', color: '#FADB14' },
          { name: '薪资待遇不理想', value: 28, severity: 'medium', color: '#52C41A' },
          { name: '工作地点不理想', value: 22, severity: 'low', color: '#1890FF' },
          { name: '合适机会较少', value: 32, severity: 'medium', color: '#722ED1' }
        ]
      },
      studentLife: {
        year: [
          { name: '大一', value: 25, stage: '探索期', color: '#FFD93D' },
          { name: '大二', value: 30, stage: '发展期', color: '#6BCF7F' },
          { name: '大三', value: 25, stage: '准备期', color: '#4D96FF' },
          { name: '大四', value: 15, stage: '冲刺期', color: '#FF6B6B' },
          { name: '研究生', value: 5, stage: '深造期', color: '#9B59B6' }
        ],
        planning: [
          { name: '直接就业', value: 45, icon: '💼', color: '#52C41A' },
          { name: '继续深造', value: 25, icon: '📚', color: '#1890FF' },
          { name: '考公务员', value: 15, icon: '🏛️', color: '#722ED1' },
          { name: '出国留学', value: 8, icon: '✈️', color: '#FA8C16' },
          { name: '创业', value: 4, icon: '🚀', color: '#FF4D4F' },
          { name: '还未确定', value: 3, icon: '❓', color: '#8C8C8C' }
        ],
        internship: [
          { name: '没有实习经验', value: 35, level: '零经验', color: '#FF4D4F' },
          { name: '1次实习经验', value: 30, level: '初步体验', color: '#FA8C16' },
          { name: '2-3次实习经验', value: 25, level: '丰富经验', color: '#52C41A' },
          { name: '3次以上实习经验', value: 10, level: '资深经验', color: '#1890FF' }
        ]
      },
      skills: {
        confidence: [
          { level: '非常有信心', value: 15, description: '技能扎实，信心满满', color: '#52C41A' },
          { level: '比较有信心', value: 35, description: '技能良好，较为自信', color: '#6BCF7F' },
          { level: '一般', value: 30, description: '技能中等，信心一般', color: '#FADB14' },
          { level: '有所欠缺', value: 15, description: '技能不足，缺乏信心', color: '#FA8C16' },
          { level: '明显不足', value: 5, description: '技能薄弱，信心不足', color: '#FF4D4F' }
        ]
      },
      satisfaction: {
        overall: 7.2,
        factors: [
          { factor: '薪资待遇', score: 6.8, importance: 9.2 },
          { factor: '工作环境', score: 7.5, importance: 8.5 },
          { factor: '发展前景', score: 7.0, importance: 9.0 },
          { factor: '工作内容', score: 7.8, importance: 8.8 },
          { factor: '团队氛围', score: 7.6, importance: 8.0 },
          { factor: '工作时长', score: 6.2, importance: 7.5 }
        ]
      }
    };
  };

  const renderStatusTab = () => (
    <div className={styles.overviewContainer}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <UserOutlined style={{ color: WARM_COLORS.primary[0] }} />
              <span>当前状态分布 - 人生的不同阶段</span>
            </Space>
          } className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={data?.currentStatus?.status || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {(data?.currentStatus?.status || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value}%`, '占比']} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <BankOutlined style={{ color: WARM_COLORS.primary[1] }} />
              <span>就业类型分布 - 工作的多样性</span>
            </Space>
          } className={styles.chartCard}>
            <div style={{ padding: '20px 0' }}>
              {(data?.employment?.type || []).map((item: any, index: number) => (
                <div key={item.name} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Space>
                      <span style={{ fontSize: '18px' }}>{item.icon}</span>
                      <Text strong>{item.name}</Text>
                    </Space>
                    <Text style={{ color: item.color, fontWeight: 'bold' }}>{item.value}%</Text>
                  </div>
                  <Progress
                    percent={item.value}
                    strokeColor={item.color}
                    showInfo={false}
                    strokeWidth={12}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderOverviewTab = () => (
    <div className={styles.overviewContainer}>
      {/* 核心统计 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard} style={{ background: WARM_COLORS.gradients[0] }}>
            <Statistic
              title={<span style={{ color: 'white' }}>总参与人数</span>}
              value={data?.totalResponses || 0}
              prefix={<TeamOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '2rem' }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>每一份问卷都是一个故事</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard} style={{ background: WARM_COLORS.gradients[1] }}>
            <Statistic
              title={<span style={{ color: 'white' }}>就业率</span>}
              value={68.5}
              suffix="%"
              prefix={<TrophyOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '2rem' }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>梦想正在实现</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard} style={{ background: WARM_COLORS.gradients[2] }}>
            <Statistic
              title={<span style={{ color: 'white' }}>平均满意度</span>}
              value={data?.satisfaction?.overall || 7.2}
              suffix="/10"
              prefix={<SmileOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '2rem' }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>幸福感在提升</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard} style={{ background: WARM_COLORS.gradients[3] }}>
            <Statistic
              title={<span style={{ color: 'white' }}>平均求职时长</span>}
              value={3.2}
              suffix="个月"
              prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '2rem' }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>坚持就有收获</Text>
          </Card>
        </Col>
      </Row>

      {/* 性别分布 - 温和的饼图 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <UserOutlined style={{ color: WARM_COLORS.primary[0] }} />
              <span>性别分布 - 多元化的职场</span>
            </Space>
          } className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.demographics?.gender || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, icon }) => `${icon} ${name}: ${value}%`}
                >
                  {(data?.demographics?.gender || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value}%`, '占比']} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.chartDescription}>
              <Text type="secondary">职场性别分布趋于平衡，体现了社会进步</Text>
            </div>
          </Card>
        </Col>

        {/* 年龄分布 - 温和的条形图 */}
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <HeartOutlined style={{ color: WARM_COLORS.primary[1] }} />
              <span>年龄分布 - 青春的力量</span>
            </Space>
          } className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.demographics?.age || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip
                  formatter={(value, name, props) => [
                    `${value}%`,
                    `${props.payload.range}`
                  ]}
                />
                <Bar dataKey="value" fill={WARM_COLORS.primary[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className={styles.chartDescription}>
              <Text type="secondary">年轻人是就业市场的主力军</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 行业分布 - 创新的树状图 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24}>
          <Card title={
            <Space>
              <BankOutlined style={{ color: WARM_COLORS.primary[2] }} />
              <span>热门行业分布 - 追逐梦想的方向</span>
            </Space>
          } className={styles.chartCard}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '20px 0' }}>
              {(data?.employment?.industry || []).map((item: any, index: number) => (
                <div
                  key={item.name}
                  className={styles.industryBubble}
                  style={{
                    background: WARM_COLORS.gradients[index % WARM_COLORS.gradients.length],
                    padding: '16px 24px',
                    borderRadius: '24px',
                    color: 'white',
                    fontSize: `${Math.max(14, item.value / 2)}px`,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span>{item.name}</span>
                  <Tag color="rgba(255,255,255,0.3)" style={{ color: 'white', border: 'none' }}>
                    {item.value}%
                  </Tag>
                  {item.trend === 'up' && <span style={{ color: '#90EE90' }}>📈</span>}
                  {item.trend === 'down' && <span style={{ color: '#FFB6C1' }}>📉</span>}
                </div>
              ))}
            </div>
            <div className={styles.chartDescription}>
              <Text type="secondary">互联网和金融行业依然是求职热门，新兴行业正在崛起</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 薪资期望分布 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <DollarOutlined style={{ color: WARM_COLORS.primary[3] }} />
              <span>薪资期望分布 - 价值的体现</span>
            </Space>
          } className={styles.chartCard}>
            <div style={{ padding: '20px 0' }}>
              {(data?.employment?.salary || []).map((item: any, index: number) => (
                <div key={item.range} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{item.range}</span>
                    <span style={{ color: WARM_COLORS.primary[3] }}>{item.value}%</span>
                  </div>
                  <Progress
                    percent={item.value}
                    strokeColor={{
                      '0%': item.color,
                      '100%': WARM_COLORS.primary[3]
                    }}
                    showInfo={false}
                    strokeWidth={12}
                    style={{ marginBottom: '4px' }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>{item.level}</Text>
                </div>
              ))}
            </div>
            <div className={styles.chartDescription}>
              <Text type="secondary">薪资期望呈现合理分布，体现了理性的就业观</Text>
            </div>
          </Card>
        </Col>

        {/* 地域分布 */}
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <EnvironmentOutlined style={{ color: WARM_COLORS.primary[4] }} />
              <span>地域分布 - 梦想的坐标</span>
            </Space>
          } className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.employment?.location || []} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <RechartsTooltip
                  formatter={(value, name, props) => [
                    `${value}%`,
                    `${props.payload.tier}城市`
                  ]}
                />
                <Bar dataKey="value" fill={WARM_COLORS.primary[4]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className={styles.chartDescription}>
              <Text type="secondary">一线城市依然是就业首选，新一线城市吸引力上升</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderEducationTab = () => (
    <div className={styles.overviewContainer}>
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <BookOutlined style={{ color: WARM_COLORS.primary[0] }} />
              <span>学历分布 - 知识的力量</span>
            </Space>
          } className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.education?.degree || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, emoji }) => `${emoji} ${name}: ${value}%`}
                >
                  {(data?.education?.degree || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={WARM_COLORS.primary[index]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value}%`, '占比']} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <StarOutlined style={{ color: WARM_COLORS.primary[1] }} />
              <span>热门专业 - 兴趣与机遇</span>
            </Space>
          } className={styles.chartCard}>
            <div className={styles.majorList}>
              {(data?.education?.major || []).map((item: any, index: number) => (
                <div key={item.name} className={styles.majorItem}>
                  <div className={styles.majorName}>
                    {item.name}
                    {item.hot && <Tag color="red" style={{ marginLeft: 8 }}>🔥 热门</Tag>}
                  </div>
                  <Progress
                    percent={item.value}
                    strokeColor={WARM_COLORS.primary[index % WARM_COLORS.primary.length]}
                    showInfo={true}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderEmploymentTab = () => (
    <div className={styles.overviewContainer}>
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card title={
            <Space>
              <BankOutlined style={{ color: WARM_COLORS.primary[2] }} />
              <span>就业意向全景 - 梦想的方向</span>
            </Space>
          } className={styles.chartCard}>
            <Text>就业意向详细分析内容将在这里展示</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderJobSearchTab = () => (
    <div className={styles.overviewContainer}>
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <SearchOutlined style={{ color: WARM_COLORS.primary[3] }} />
              <span>求职渠道效果 - 成功的路径</span>
            </Space>
          } className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.jobSearch?.channels || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <RechartsTooltip
                  formatter={(value, name) => [
                    `${value}%`,
                    name === 'value' ? '使用率' : '有效性'
                  ]}
                />
                <Bar dataKey="value" fill={WARM_COLORS.primary[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <ClockCircleOutlined style={{ color: WARM_COLORS.primary[4] }} />
              <span>求职时长分布 - 坚持的意义</span>
            </Space>
          } className={styles.chartCard}>
            <div className={styles.durationList}>
              {(data?.jobSearch?.duration || []).map((item: any, index: number) => (
                <div key={item.period} className={styles.durationItem}>
                  <div className={styles.durationHeader}>
                    <span className={styles.durationMood}>{item.mood}</span>
                    <span className={styles.durationPeriod}>{item.period}</span>
                    <span className={styles.durationValue}>{item.value}%</span>
                  </div>
                  <Progress
                    percent={item.value}
                    strokeColor={WARM_COLORS.primary[index]}
                    showInfo={false}
                    strokeWidth={8}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card title={
            <Space>
              <ExclamationCircleOutlined style={{ color: WARM_COLORS.primary[5] }} />
              <span>求职困难分析 - 共同的挑战</span>
            </Space>
          } className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data?.jobSearch?.difficulties || []} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <RechartsTooltip
                  formatter={(value) => [`${value}%`, '遇到比例']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {(data?.jobSearch?.difficulties || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderStudentTab = () => (
    <div className={styles.overviewContainer}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title={
            <Space>
              <TeamOutlined style={{ color: WARM_COLORS.primary[0] }} />
              <span>年级分布</span>
            </Space>
          } className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.studentLife?.year || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {(data?.studentLife?.year || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value}%`, '占比']} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={
            <Space>
              <RocketOutlined style={{ color: WARM_COLORS.primary[1] }} />
              <span>毕业规划</span>
            </Space>
          } className={styles.chartCard}>
            <div style={{ padding: '20px 0' }}>
              {(data?.studentLife?.planning || []).map((item: any, index: number) => (
                <div key={item.name} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <Space>
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      <Text>{item.name}</Text>
                    </Space>
                    <Text style={{ color: item.color, fontWeight: 'bold' }}>{item.value}%</Text>
                  </div>
                  <Progress
                    percent={item.value}
                    strokeColor={item.color}
                    showInfo={false}
                    strokeWidth={8}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={
            <Space>
              <ExperimentOutlined style={{ color: WARM_COLORS.primary[2] }} />
              <span>实习经验</span>
            </Space>
          } className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.studentLife?.internship || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value}%`, '占比']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {(data?.studentLife?.internship || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderSkillsTab = () => (
    <div className={styles.overviewContainer}>
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card title={
            <Space>
              <TrophyOutlined style={{ color: WARM_COLORS.primary[3] }} />
              <span>技能信心分布 - 自我认知的真实写照</span>
            </Space>
          } className={styles.chartCard}>
            <div style={{ padding: '20px 0' }}>
              {(data?.skills?.confidence || []).map((item: any, index: number) => (
                <div key={item.level} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <Text strong style={{ fontSize: '16px' }}>{item.level}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>{item.description}</Text>
                    </div>
                    <Text style={{ color: item.color, fontWeight: 'bold', fontSize: '18px' }}>{item.value}%</Text>
                  </div>
                  <Progress
                    percent={item.value}
                    strokeColor={item.color}
                    showInfo={false}
                    strokeWidth={15}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>正在加载温暖的数据...</Text>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.emptyContainer}>
        <Empty description="暂无数据" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={1}>
          <HeartOutlined style={{ color: WARM_COLORS.primary[0] }} />
          问卷数据可视化
        </Title>
        <Paragraph>
          每一个数据点都代表着一个真实的故事，让我们用温和的方式探索这些珍贵的经历
        </Paragraph>
        {data && (
          <Alert
            message={
              (data as any).hasRealData
                ? `基于 ${data.totalResponses} 份真实问卷数据的分析`
                : "当前显示示例数据，实际数据收集中"
            }
            type={(data as any).hasRealData ? "success" : "info"}
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane tab={
          <Space>
            <StarOutlined />
            综合概览
          </Space>
        } key="overview">
          {renderOverviewTab()}
        </TabPane>

        <TabPane tab={
          <Space>
            <UserOutlined />
            当前状态
          </Space>
        } key="status">
          {renderStatusTab()}
        </TabPane>

        <TabPane tab={
          <Space>
            <BookOutlined />
            教育背景
          </Space>
        } key="education">
          {renderEducationTab()}
        </TabPane>

        <TabPane tab={
          <Space>
            <BankOutlined />
            就业意向
          </Space>
        } key="employment">
          {renderEmploymentTab()}
        </TabPane>

        <TabPane tab={
          <Space>
            <SearchOutlined />
            求职过程
          </Space>
        } key="jobsearch">
          {renderJobSearchTab()}
        </TabPane>

        <TabPane tab={
          <Space>
            <TeamOutlined />
            学生生活
          </Space>
        } key="student">
          {renderStudentTab()}
        </TabPane>

        <TabPane tab={
          <Space>
            <TrophyOutlined />
            技能信心
          </Space>
        } key="skills">
          {renderSkillsTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};

// 数据转换辅助函数
const transformGenderData = (rawData: any) => {
  // 使用示例数据，因为API暂时没有返回性别分布数据
  return [
    { name: '女性', value: 52, icon: '👩', color: '#FF9A8B' },
    { name: '男性', value: 46, icon: '👨', color: '#4D96FF' },
    { name: '其他', value: 2, icon: '🌈', color: '#A8E6CF' }
  ];
};

const transformAgeData = (rawData: any) => {
  // 使用API返回的年龄分布数据
  if (rawData.ageDistribution && rawData.ageDistribution.length > 0) {
    const colorMap = ['#FFD93D', '#6BCF7F', '#9B59B6', '#FF6B6B'];
    const rangeMap: Record<string, string> = {
      '22-24岁': '初入职场',
      '25-27岁': '职场新人',
      '28-30岁': '职场进阶',
      '30岁以上': '职场资深'
    };

    return rawData.ageDistribution.map((item: any, index: number) => ({
      name: item.name,
      value: item.value,
      range: rangeMap[item.name] || '其他',
      color: colorMap[index % colorMap.length]
    }));
  }

  // 默认数据
  return [
    { name: '22-24岁', value: 40, range: '初入职场', color: '#FFD93D' },
    { name: '25-27岁', value: 35, range: '职场新人', color: '#6BCF7F' },
    { name: '28-30岁', value: 20, range: '职场进阶', color: '#9B59B6' },
    { name: '30岁以上', value: 5, range: '职场资深', color: '#FF6B6B' }
  ];
};

const transformEmploymentStatusData = (rawData: any) => {
  // 转换就业状态数据，添加图标和描述
  const statusMap: Record<string, { icon: string; color: string; description: string }> = {
    '已就业': { icon: '💼', color: '#52C41A', description: '包括全职、兼职、实习' },
    'employed': { icon: '💼', color: '#52C41A', description: '包括全职、兼职、实习' },
    '求职中': { icon: '🔍', color: '#FA8C16', description: '失业/求职中' },
    'seeking': { icon: '🔍', color: '#FA8C16', description: '失业/求职中' },
    '在校学生': { icon: '🎓', color: '#1890FF', description: '在校学习中' },
    'continuing-education': { icon: '🎓', color: '#1890FF', description: '继续教育' },
    'entrepreneurship': { icon: '🚀', color: '#722ED1', description: '创业中' },
    '继续深造': { icon: '📚', color: '#722ED1', description: '备考/进修中' },
    '其他': { icon: '🌟', color: '#13C2C2', description: '其他情况' }
  };

  if (rawData.employmentStatus && Array.isArray(rawData.employmentStatus)) {
    return rawData.employmentStatus.map((item: any) => ({
      name: item.name,
      value: item.value,
      icon: statusMap[item.name]?.icon || '📊',
      color: statusMap[item.name]?.color || '#8C8C8C',
      description: statusMap[item.name]?.description || item.name
    }));
  }

  // 默认数据
  return [
    { name: '已就业', value: 42, icon: '💼', color: '#52C41A', description: '包括全职、兼职、实习' },
    { name: '求职中', value: 28, icon: '🔍', color: '#FA8C16', description: '失业/求职中' },
    { name: '在校学生', value: 20, icon: '🎓', color: '#1890FF', description: '在校学习中' },
    { name: '备考进修', value: 8, icon: '📚', color: '#722ED1', description: '备考/进修中' },
    { name: '其他状态', value: 2, icon: '🌟', color: '#13C2C2', description: '其他情况' }
  ];
};

export default QuestionnaireVisualizationPage;
