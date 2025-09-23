/**
 * 升级版智能问卷页面
 * 基于优秀问卷设计原则的全面升级版本
 * 
 * 升级特性：
 * - 动画过渡效果
 * - 智能数据清理
 * - 分支路径追踪
 * - 数据质量保证
 * - 性能优化
 * - 可访问性支持
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, Typography, Space, Alert, Tag, Progress, Button, Tooltip, Badge } from 'antd';
import { 
  BranchesOutlined, 
  UserOutlined, 
  SettingOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  BarChartOutlined,
  BugOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { UniversalQuestionnaireEngine } from '../components/questionnaire/UniversalQuestionnaireEngine';
import { AnimatedSection, AnimatedProgress, PageTransition } from '../components/questionnaire/AnimatedSection';
import { enhancedIntelligentQuestionnaire } from '../data/enhancedIntelligentQuestionnaire';
import { useBranchLogic } from '../hooks/useBranchLogic';
import { useDataCleanup } from '../hooks/useDataCleanup';

const { Title, Paragraph, Text } = Typography;

const EnhancedQuestionnairePage: React.FC = () => {
  const [formData, setFormData] = useState<any>({});
  const [showQualityReport, setShowQualityReport] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    branchCalculationTime: 0,
    dataCleanupTime: 0
  });

  // 使用升级版 Hooks
  const branchLogic = useBranchLogic(enhancedIntelligentQuestionnaire, formData);
  const dataCleanup = useDataCleanup();

  // 性能监控
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setPerformanceMetrics(prev => ({
        ...prev,
        renderTime: endTime - startTime
      }));
    };
  }, [formData]);

  // 处理表单数据变化
  const handleDataChange = useCallback((newData: any) => {
    const startTime = performance.now();
    
    // 执行数据清理
    const cleanupStartTime = performance.now();
    const { cleanedData, appliedRules } = dataCleanup.cleanupData(newData, branchLogic.branchState);
    const cleanupEndTime = performance.now();
    
    setFormData(cleanedData);
    
    // 更新性能指标
    setPerformanceMetrics(prev => ({
      ...prev,
      branchCalculationTime: performance.now() - startTime,
      dataCleanupTime: cleanupEndTime - cleanupStartTime
    }));

    // 如果有数据清理，显示提示
    if (appliedRules.length > 0) {
      console.log('数据清理规则已应用:', appliedRules);
    }
  }, [branchLogic.branchState, dataCleanup]);

  // 生成质量报告
  const handleGenerateQualityReport = useCallback(() => {
    const report = dataCleanup.generateQualityReport(formData, branchLogic.branchState);
    console.log('数据质量报告:', report);
    setShowQualityReport(true);
  }, [formData, branchLogic.branchState, dataCleanup]);

  // 计算进度
  const progress = branchLogic.calculateProgress(formData);
  const estimatedTime = branchLogic.estimateRemainingTime(formData);
  const qualityIssues = dataCleanup.validateDataQuality(formData, branchLogic.branchState);

  return (
    <PageTransition>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

        
        {/* 升级版智能问卷组件 */}
        <AnimatedSection show={true} animationType="slide">
          <Card>
            <UniversalQuestionnaireEngine
              questionnaire={enhancedIntelligentQuestionnaire}
            />
          </Card>
        </AnimatedSection>
      </div>
    </PageTransition>
  );
};

export default EnhancedQuestionnairePage;
