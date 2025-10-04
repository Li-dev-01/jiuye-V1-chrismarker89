/**
 * 问卷组合生成器页面
 */

import React, { useState } from 'react';
import { 
  Layout, 
  Tabs, 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Progress,
  Alert,
  Button,
  Space
} from 'antd';
import { 
  ExperimentOutlined, 
  BarChartOutlined, 
  DatabaseOutlined,
  BulbOutlined,
  UserOutlined,
  TagOutlined
} from '@ant-design/icons';
import QuestionnaireComboGenerator from '../components/questionnaire/QuestionnaireComboGenerator';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const QuestionnaireComboPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generator');

  // 统计数据
  const stats = {
    questionnaire1Combos: 450,
    questionnaire2Combos: 11250,
    validCombos: 8500,
    tagCategories: 4,
    totalQuotes: 50
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6">
        {/* 页面头部 */}
        <div className="mb-8">
          <Title level={1}>
            <ExperimentOutlined className="mr-3 text-blue-600" />
            问卷组合实验室
          </Title>
          <Paragraph className="text-lg text-gray-600">
            探索问卷数据的无限可能，为每一种用户画像生成专属标签和励志内容
          </Paragraph>
        </div>

        {/* 概览统计 */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="问卷1组合"
                value={stats.questionnaire1Combos}
                prefix={<UserOutlined className="text-blue-500" />}
                suffix="种"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="问卷2组合"
                value={stats.questionnaire2Combos}
                prefix={<UserOutlined className="text-green-500" />}
                suffix="种"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="有效组合"
                value={stats.validCombos}
                prefix={<BarChartOutlined className="text-orange-500" />}
                suffix="种"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="标签分类"
                value={stats.tagCategories}
                prefix={<TagOutlined className="text-purple-500" />}
                suffix="类"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="励志名言"
                value={stats.totalQuotes}
                prefix={<BulbOutlined className="text-yellow-500" />}
                suffix="条"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="覆盖率"
                value={75.5}
                prefix={<DatabaseOutlined className="text-red-500" />}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        {/* 主要内容区域 */}
        <Card className="shadow-lg">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size="large"
            tabBarStyle={{ marginBottom: '24px' }}
          >
            {/* 组合生成器 */}
            <TabPane 
              tab={
                <span>
                  <ExperimentOutlined />
                  组合生成器
                </span>
              } 
              key="generator"
            >
              <QuestionnaireComboGenerator />
            </TabPane>

            {/* 数据分析 */}
            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  数据分析
                </span>
              } 
              key="analysis"
            >
              <div className="p-6">
                <Title level={3}>组合数据分析</Title>
                
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <Card title="问卷1 vs 问卷2 组合对比">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Text>问卷1组合数</Text>
                            <Text strong>{stats.questionnaire1Combos}</Text>
                          </div>
                          <Progress 
                            percent={4} 
                            strokeColor="#1890ff"
                            showInfo={false}
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <Text>问卷2组合数</Text>
                            <Text strong>{stats.questionnaire2Combos}</Text>
                          </div>
                          <Progress 
                            percent={100} 
                            strokeColor="#52c41a"
                            showInfo={false}
                          />
                        </div>
                      </div>
                      
                      <Alert
                        className="mt-4"
                        message="问卷2的组合数是问卷1的25倍"
                        description="问卷2增加了经济压力和就业信心两个维度，大大丰富了用户画像的精细度"
                        type="info"
                        showIcon
                      />
                    </Card>
                  </Col>
                  
                  <Col xs={24} lg={12}>
                    <Card title="标签分布统计">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Text>基础人群标签</Text>
                          <div>
                            <Text strong className="mr-2">35%</Text>
                            <Progress 
                              percent={35} 
                              size="small" 
                              strokeColor="#1890ff"
                              className="w-20"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Text>就业状态标签</Text>
                          <div>
                            <Text strong className="mr-2">28%</Text>
                            <Progress 
                              percent={28} 
                              size="small" 
                              strokeColor="#52c41a"
                              className="w-20"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Text>经济状况标签</Text>
                          <div>
                            <Text strong className="mr-2">22%</Text>
                            <Progress 
                              percent={22} 
                              size="small" 
                              strokeColor="#fa8c16"
                              className="w-20"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Text>性格特征标签</Text>
                          <div>
                            <Text strong className="mr-2">15%</Text>
                            <Progress 
                              percent={15} 
                              size="small" 
                              strokeColor="#722ed1"
                              className="w-20"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[24, 24]} className="mt-6">
                  <Col span={24}>
                    <Card title="组合复杂度分析">
                      <Paragraph>
                        <Text strong>维度分析：</Text>
                      </Paragraph>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li><strong>问卷1</strong>：4个核心维度（性别、年龄、学历、就业状态）</li>
                        <li><strong>问卷2</strong>：6个核心维度（增加经济压力、就业信心）</li>
                        <li><strong>标签匹配</strong>：基于多维度条件的智能标签生成</li>
                        <li><strong>个性化程度</strong>：问卷2的个性化程度提升了600%</li>
                      </ul>
                      
                      <Alert
                        className="mt-4"
                        message="建议"
                        description="可以考虑为高频组合创建预设标签模板，为低频组合使用动态生成算法"
                        type="success"
                        showIcon
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>

            {/* 标签管理 */}
            <TabPane 
              tab={
                <span>
                  <TagOutlined />
                  标签管理
                </span>
              } 
              key="tags"
            >
              <div className="p-6">
                <Title level={3}>标签分类管理</Title>
                
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Card title="基础人群标签" className="h-full">
                      <Space direction="vertical" className="w-full">
                        <div className="p-3 border rounded bg-blue-50">
                          <Text strong className="text-blue-800">学霸型</Text>
                          <br />
                          <Text className="text-sm text-blue-600">高学历 + 高信心</Text>
                        </div>
                        <div className="p-3 border rounded bg-orange-50">
                          <Text strong className="text-orange-800">奋斗型</Text>
                          <br />
                          <Text className="text-sm text-orange-600">中等学历 + 高努力度</Text>
                        </div>
                        <div className="p-3 border rounded bg-gray-50">
                          <Text strong className="text-gray-800">迷茫型</Text>
                          <br />
                          <Text className="text-sm text-gray-600">任意学历 + 低信心</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Card title="就业状态标签" className="h-full">
                      <Space direction="vertical" className="w-full">
                        <div className="p-3 border rounded bg-green-50">
                          <Text strong className="text-green-800">职场新星</Text>
                          <br />
                          <Text className="text-sm text-green-600">已就业 + 年轻 + 高信心</Text>
                        </div>
                        <div className="p-3 border rounded bg-red-50">
                          <Text strong className="text-red-800">求职战士</Text>
                          <br />
                          <Text className="text-sm text-red-600">待业 + 积极求职</Text>
                        </div>
                        <div className="p-3 border rounded bg-purple-50">
                          <Text strong className="text-purple-800">校园精英</Text>
                          <br />
                          <Text className="text-sm text-purple-600">在校学生 + 高学历</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>

                <div className="mt-6">
                  <Space>
                    <Button type="primary">添加新标签</Button>
                    <Button>批量导入</Button>
                    <Button>导出标签库</Button>
                  </Space>
                </div>
              </div>
            </TabPane>

            {/* 名言库 */}
            <TabPane 
              tab={
                <span>
                  <BulbOutlined />
                  名言库
                </span>
              } 
              key="quotes"
            >
              <div className="p-6">
                <Title level={3}>励志名言管理</Title>
                
                <Row gutter={[24, 24]}>
                  <Col span={24}>
                    <Alert
                      message="名言库统计"
                      description={`当前共有 ${stats.totalQuotes} 条励志名言，覆盖 ${stats.tagCategories} 个标签分类`}
                      type="info"
                      showIcon
                      className="mb-4"
                    />
                  </Col>
                </Row>

                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={8}>
                    <Card title="学习成长类" size="small">
                      <div className="space-y-3">
                        <div className="p-2 bg-blue-50 rounded">
                          <Text className="text-sm">"知识就是力量，你已经拥有了最好的武器"</Text>
                          <br />
                          <Text className="text-xs text-gray-500">—— 培根</Text>
                        </div>
                        <div className="p-2 bg-blue-50 rounded">
                          <Text className="text-sm">"学而时习之，不亦说乎"</Text>
                          <br />
                          <Text className="text-xs text-gray-500">—— 孔子</Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  
                  <Col xs={24} lg={8}>
                    <Card title="求职励志类" size="small">
                      <div className="space-y-3">
                        <div className="p-2 bg-orange-50 rounded">
                          <Text className="text-sm">"机会总是留给有准备的人"</Text>
                          <br />
                          <Text className="text-xs text-gray-500">—— 路易·巴斯德</Text>
                        </div>
                        <div className="p-2 bg-orange-50 rounded">
                          <Text className="text-sm">"每一次拒绝都是离成功更近一步"</Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  
                  <Col xs={24} lg={8}>
                    <Card title="心态调节类" size="small">
                      <div className="space-y-3">
                        <div className="p-2 bg-green-50 rounded">
                          <Text className="text-sm">"迷茫是成长的必经之路，勇敢走下去"</Text>
                        </div>
                        <div className="p-2 bg-green-50 rounded">
                          <Text className="text-sm">"山重水复疑无路，柳暗花明又一村"</Text>
                          <br />
                          <Text className="text-xs text-gray-500">—— 陆游</Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                <div className="mt-6">
                  <Space>
                    <Button type="primary">添加新名言</Button>
                    <Button>分类管理</Button>
                    <Button>批量导入</Button>
                    <Button>导出名言库</Button>
                  </Space>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </Content>
    </Layout>
  );
};

export default QuestionnaireComboPage;
