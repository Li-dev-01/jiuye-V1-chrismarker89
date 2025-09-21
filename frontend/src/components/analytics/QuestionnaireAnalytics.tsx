import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, Briefcase, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface QuestionnaireData {
  totalResponses: number;
  hasData: boolean;
  educationDistribution: Array<{ label: string; value: number; percentage: number }>;
  majorDistribution: Array<{ label: string; value: number; percentage: number }>;
  employmentStatusDistribution: Array<{ label: string; value: number; percentage: number }>;
  lastUpdated: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function QuestionnaireAnalytics() {
  const [data, setData] = useState<QuestionnaireData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestionnaireData();
  }, []);

  const fetchQuestionnaireData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/real-data');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        console.error('Failed to fetch questionnaire data:', result.message);
      }
    } catch (error) {
      console.error('Error fetching questionnaire data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无问卷数据</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">问卷总数</p>
                <p className="text-2xl font-bold">{data.totalResponses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">教育水平</p>
                <p className="text-2xl font-bold">{data.educationDistribution.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">专业分布</p>
                <p className="text-2xl font-bold">{data.majorDistribution.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">就业状态</p>
                <p className="text-2xl font-bold">{data.employmentStatusDistribution.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据分布图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 教育水平分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2" />
              教育水平分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.educationDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, percentage }) => `${label}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.educationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 专业分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              专业分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.majorDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, percentage }) => `${label}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.majorDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 就业状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              就业状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.employmentStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, percentage }) => `${label}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.employmentStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 数据更新信息 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Badge variant="outline">基础分析</Badge>
              <span className="ml-2 text-sm text-gray-600">
                数据最后更新: {new Date(data.lastUpdated).toLocaleString('zh-CN')}
              </span>
            </div>
            <Badge variant="secondary">
              {data.totalResponses} 份问卷
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
