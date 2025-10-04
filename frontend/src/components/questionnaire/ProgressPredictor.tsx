/**
 * 进度预测器组件 - 第二问卷专用
 * 智能预测完成时间和剩余问题数量
 */

import React from 'react';
import { Typography, Space, Progress } from 'antd';
import { ClockCircleOutlined, QuestionCircleOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ProgressPredictorProps {
  currentProgress: number;
  interactionMetrics: {
    startTime: number;
    interactionCount: number;
    sectionTimes: Record<string, number>;
    currentSectionStartTime: number;
  };
  participantGroup: string;
  totalSections: number;
}

export const ProgressPredictor: React.FC<ProgressPredictorProps> = ({
  currentProgress,
  interactionMetrics,
  participantGroup,
  totalSections
}) => {
  // 计算已用时间（分钟）
  const elapsedMinutes = Math.round((Date.now() - interactionMetrics.startTime) / 60000);
  
  // 预测总完成时间
  const predictTotalTime = (): number => {
    if (currentProgress <= 0) return 10; // 默认预估10分钟
    
    const elapsedTime = (Date.now() - interactionMetrics.startTime) / 60000; // 分钟
    const estimatedTotal = (elapsedTime / currentProgress) * 100;
    
    // 根据参与者群体调整预估时间
    const groupMultiplier = getGroupTimeMultiplier(participantGroup);
    
    return Math.max(5, Math.round(estimatedTotal * groupMultiplier));
  };
  
  // 获取群体时间系数
  const getGroupTimeMultiplier = (group: string): number => {
    const multipliers: Record<string, number> = {
      'fresh_graduate': 0.9,      // 应届生通常回答较快
      'junior_professional': 1.0, // 基准时间
      'senior_professional': 1.2  // 资深人士可能思考更久
    };
    
    return multipliers[group] || 1.0;
  };
  
  // 计算预计剩余时间
  const estimatedRemainingMinutes = (): number => {
    const totalEstimated = predictTotalTime();
    const remaining = Math.max(0, totalEstimated - elapsedMinutes);
    return remaining;
  };
  
  // 获取进度状态
  const getProgressStatus = (): 'normal' | 'active' | 'success' => {
    if (currentProgress >= 100) return 'success';
    if (currentProgress >= 80) return 'active';
    return 'normal';
  };
  
  // 获取参与者群体显示名称
  const getGroupDisplayName = (group: string): string => {
    const names: Record<string, string> = {
      'fresh_graduate': '应届毕业生',
      'junior_professional': '职场新人期',
      'senior_professional': '职业发展期'
    };
    
    return names[group] || '未分类';
  };
  
  // 计算回答速度
  const getAnswerSpeed = (): string => {
    if (interactionMetrics.interactionCount === 0) return '正常';
    
    const avgTimePerQuestion = elapsedMinutes / interactionMetrics.interactionCount;
    
    if (avgTimePerQuestion < 0.5) return '较快';
    if (avgTimePerQuestion > 2) return '较慢';
    return '正常';
  };
  
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      {/* 进度概览 */}
      <div className="flex items-center justify-between">
        <Text className="text-gray-600 font-medium">智能进度分析</Text>
        <Text className="text-gray-500 text-sm">
          基于您的回答模式预测
        </Text>
      </div>
      
      {/* 详细指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 已用时间 */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <ClockCircleOutlined className="text-blue-500 mr-1" />
            <Text className="text-gray-600 text-sm">已用时间</Text>
          </div>
          <Text className="text-lg font-bold text-blue-600">
            {elapsedMinutes}分钟
          </Text>
        </div>
        
        {/* 预计剩余 */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <ClockCircleOutlined className="text-orange-500 mr-1" />
            <Text className="text-gray-600 text-sm">预计剩余</Text>
          </div>
          <Text className="text-lg font-bold text-orange-600">
            {estimatedRemainingMinutes()}分钟
          </Text>
        </div>
        
        {/* 回答数量 */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <QuestionCircleOutlined className="text-green-500 mr-1" />
            <Text className="text-gray-600 text-sm">已回答</Text>
          </div>
          <Text className="text-lg font-bold text-green-600">
            {interactionMetrics.interactionCount}题
          </Text>
        </div>
        
        {/* 参与者类型 */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <UserOutlined className="text-purple-500 mr-1" />
            <Text className="text-gray-600 text-sm">身份类型</Text>
          </div>
          <Text className="text-sm font-medium text-purple-600">
            {getGroupDisplayName(participantGroup)}
          </Text>
        </div>
      </div>
      
      {/* 回答速度指示器 */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Text className="text-gray-600 text-sm">回答速度：</Text>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            getAnswerSpeed() === '较快' ? 'bg-green-100 text-green-700' :
            getAnswerSpeed() === '较慢' ? 'bg-orange-100 text-orange-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {getAnswerSpeed()}
          </span>
        </div>
        
        <Text className="text-gray-500 text-xs">
          预计总时长：{predictTotalTime()}分钟
        </Text>
      </div>
      
      {/* 鼓励信息 */}
      {currentProgress > 0 && (
        <div className="text-center pt-2 border-t border-gray-200">
          {currentProgress < 25 && (
            <Text className="text-blue-600 text-sm">
              🚀 很好的开始！继续保持这个节奏
            </Text>
          )}
          {currentProgress >= 25 && currentProgress < 50 && (
            <Text className="text-green-600 text-sm">
              💪 进展顺利！您已经完成了四分之一
            </Text>
          )}
          {currentProgress >= 50 && currentProgress < 75 && (
            <Text className="text-orange-600 text-sm">
              🎯 太棒了！已经过半，继续加油
            </Text>
          )}
          {currentProgress >= 75 && currentProgress < 100 && (
            <Text className="text-purple-600 text-sm">
              🏆 即将完成！最后冲刺阶段
            </Text>
          )}
          {currentProgress >= 100 && (
            <Text className="text-green-600 text-sm">
              🎉 恭喜完成！感谢您的参与
            </Text>
          )}
        </div>
      )}
    </div>
  );
};
