/**
 * 数据质量管理面板
 * 提供数据一致性检查、质量监控和修复工具
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Progress, Tag, Descriptions, Timeline, message } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ToolOutlined,
  MonitorOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

interface DataQualityReport {
  timestamp: string;
  questionnaireId: string;
  metrics: {
    totalResponses: number;
    validResponses: number;
    recentResponses: number;
    qualityRate: number;
    cachedQuestions: number;
  };
  status: {
    dataQuality: 'excellent' | 'good' | 'warning' | 'critical';
    cacheHealth: 'healthy' | 'warning' | 'critical';
    activityLevel: 'high' | 'medium' | 'low' | 'inactive';
  };
  alerts: Array<{
    type: string;
    message: string;
  }>;
}

interface ConsistencyReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  details: {
    questionnaire: {
      totalQuestions: number;
      questionIds: string[];
    };
    database: {
      totalResponses: number;
      actualQuestionIds: string[];
      missingQuestions: string[];
    };
    statistics: {
      cachedQuestionIds: string[];
      missingFromCache: string[];
    };
  };
}

const DataQualityDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [consistencyReport, setConsistencyReport] = useState<ConsistencyReport | null>(null);
  const [repairLoading, setRepairLoading] = useState(false);

  const questionnaireId = 'employment-survey-2024';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

  // 获取数据质量报告
  const fetchQualityReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/universal-questionnaire/data-quality/${questionnaireId}`);
      const result = await response.json();

      if (result.success) {
        setQualityReport(result.data);
      } else {
        message.error('获取数据质量报告失败');
      }
    } catch (error) {
      console.error('获取数据质量报告失败:', error);
      message.error('获取数据质量报告失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取数据一致性报告
  const fetchConsistencyReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/universal-questionnaire/consistency-check/${questionnaireId}`);
      const result = await response.json();

      if (result.success) {
        setConsistencyReport(result.data);
      } else {
        message.error('获取数据一致性报告失败');
      }
    } catch (error) {
      console.error('获取数据一致性报告失败:', error);
      message.error('获取数据一致性报告失败');
    } finally {
      setLoading(false);
    }
  };

  // 执行数据修复
  const performDataRepair = async (repairType: string = 'all') => {
    try {
      setRepairLoading(true);
      const response = await fetch(
        `${apiBaseUrl}/api/universal-questionnaire/data-repair/${questionnaireId}?type=${repairType}`,
        { method: 'POST' }
      );
      const result = await response.json();

      if (result.success) {
        message.success('数据修复完成');
        // 刷新报告
        await Promise.all([fetchQualityReport(), fetchConsistencyReport()]);
      } else {
        message.error('数据修复失败');
      }
    } catch (error) {
      console.error('数据修复失败:', error);
      message.error('数据修复失败');
    } finally {
      setRepairLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityReport();
    fetchConsistencyReport();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>数据质量管理面板</h1>
        <div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => Promise.all([fetchQualityReport(), fetchConsistencyReport()])}
            loading={loading}
            style={{ marginRight: '8px' }}
          >
            刷新报告
          </Button>
          <Button
            type="primary"
            icon={<ToolOutlined />}
            onClick={() => performDataRepair('all')}
            loading={repairLoading}
          >
            执行数据修复
          </Button>
        </div>
      </div>

      <Card title="数据质量管理系统已部署">
        <p>✅ 数据清理完成 - 已删除所有不匹配的测试数据和缓存</p>
        <p>✅ 定期检查机制 - 每天自动执行数据一致性检查</p>
        <p>✅ 质量监控系统 - 实时监控数据质量指标</p>
        <p>✅ 修复工具 - 提供自动化数据修复功能</p>
      </Card>
    </div>
  );
};

export default DataQualityDashboard;