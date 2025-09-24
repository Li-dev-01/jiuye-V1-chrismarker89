/**
 * 故事提交演示组件
 * 展示三层审核系统的完整工作流程
 */

import React, { useState } from 'react';
import { contentFilter } from '../utils/frontendContentFilter';

interface SubmissionResult {
  success: boolean;
  data?: {
    story_id: number;
    status: string;
    next_step: string;
  };
  message: string;
  timestamp: string;
  requestId?: string;
}

interface ContentCheckResult {
  isValid: boolean;
  violations: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export const StorySubmissionDemo: React.FC = () => {
  const [content, setContent] = useState('');
  const [userId, setUserId] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [contentCheck, setContentCheck] = useState<ContentCheckResult | null>(null);
  const [showPrecheck, setShowPrecheck] = useState(false);

  // 实时内容检查
  const handleContentChange = (value: string) => {
    setContent(value);
    
    // 前端实时检查
    const check = contentFilter.checkContent(value);
    setContentCheck(check);
    
    // 清除之前的提交结果
    if (submissionResult) {
      setSubmissionResult(null);
    }
  };

  // 前端预检
  const handlePrecheck = async () => {
    if (!content.trim()) {
      alert('请输入内容');
      return;
    }

    setShowPrecheck(true);
    
    try {
      const response = await fetch('/api/stories/precheck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();
      console.log('预检结果:', result);
      
    } catch (error) {
      console.error('预检失败:', error);
    }
  };

  // 提交故事
  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('请输入故事内容');
      return;
    }

    if (content.length < 50) {
      alert('故事内容至少需要50个字符');
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const response = await fetch('/api/stories/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          content: content,
        }),
      });

      const result = await response.json();
      setSubmissionResult(result);

      if (result.success) {
        // 如果提交成功，可以清空内容
        if (result.data?.status === 'approved') {
          setContent('');
          setContentCheck(null);
        }
      }

    } catch (error) {
      console.error('提交失败:', error);
      setSubmissionResult({
        success: false,
        message: '网络错误，请稍后重试',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 查询故事状态
  const handleCheckStatus = async (storyId: number) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/status`);
      const result = await response.json();
      
      if (result.success) {
        alert(`故事状态: ${result.data.status}\n创建时间: ${result.data.created_at}\n是否已发布: ${result.data.is_published ? '是' : '否'}`);
      } else {
        alert('查询失败: ' + result.message);
      }
    } catch (error) {
      console.error('状态查询失败:', error);
      alert('查询失败，请稍后重试');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      case 'ai_checking': return 'text-blue-600';
      case 'manual_review': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '✅ 已通过审核';
      case 'rejected': return '❌ 审核未通过';
      case 'pending': return '⏳ 待审核';
      case 'ai_checking': return '🤖 AI审核中';
      case 'manual_review': return '👥 人工审核中';
      default: return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        📝 故事提交系统 - 三层审核演示
      </h2>

      {/* 用户选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          用户ID:
        </label>
        <input
          type="number"
          value={userId}
          onChange={(e) => setUserId(parseInt(e.target.value) || 1)}
          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
        />
      </div>

      {/* 内容输入 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          故事内容 (50-2000字符):
        </label>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="请分享您的就业经历和经验..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          maxLength={2000}
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>字符数: {content.length}/2000</span>
          <span>最少需要: 50字符</span>
        </div>
      </div>

      {/* 前端实时检查结果 */}
      {contentCheck && content.length > 0 && (
        <div className={`mb-4 p-3 rounded-md ${
          contentCheck.isValid 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <h4 className="font-medium mb-2">
            {contentCheck.isValid ? '✅ 前端检查通过' : '⚠️ 前端检查发现问题'}
          </h4>
          
          {contentCheck.violations.length > 0 && (
            <div className="mb-2">
              <strong>问题:</strong>
              <ul className="list-disc list-inside text-sm text-red-600">
                {contentCheck.violations.map((violation, index) => (
                  <li key={index}>{violation}</li>
                ))}
              </ul>
            </div>
          )}
          
          {contentCheck.suggestions.length > 0 && (
            <div>
              <strong>建议:</strong>
              <ul className="list-disc list-inside text-sm text-blue-600">
                {contentCheck.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-2 text-sm">
            <span className={`px-2 py-1 rounded text-xs ${
              contentCheck.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
              contentCheck.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              风险级别: {contentCheck.riskLevel}
            </span>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handlePrecheck}
          disabled={!content.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          🔍 前端预检
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim() || content.length < 50}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '提交中...' : '📤 提交故事'}
        </button>
      </div>

      {/* 提交结果 */}
      {submissionResult && (
        <div className={`mb-6 p-4 rounded-md ${
          submissionResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <h4 className="font-medium mb-2">提交结果</h4>
          
          <div className="space-y-2 text-sm">
            <div>
              <strong>状态:</strong> 
              <span className={`ml-2 ${getStatusColor(submissionResult.data?.status || '')}`}>
                {getStatusText(submissionResult.data?.status || '')}
              </span>
            </div>
            
            {submissionResult.data?.story_id && (
              <div>
                <strong>故事ID:</strong> {submissionResult.data.story_id}
                <button
                  onClick={() => handleCheckStatus(submissionResult.data!.story_id)}
                  className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  查询状态
                </button>
              </div>
            )}
            
            <div><strong>消息:</strong> {submissionResult.message}</div>
            <div><strong>时间:</strong> {new Date(submissionResult.timestamp).toLocaleString()}</div>
            
            {submissionResult.requestId && (
              <div><strong>请求ID:</strong> {submissionResult.requestId}</div>
            )}
          </div>
        </div>
      )}

      {/* 系统说明 */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">🔄 三层审核系统说明</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div><strong>第一层 - 规则审核:</strong> 检测明显违规内容（粗口、色情等），合规内容直接通过</div>
          <div><strong>第二层 - AI审核:</strong> 批量处理（每10条或1分钟），检测政治敏感等复杂内容</div>
          <div><strong>第三层 - 人工审核:</strong> AI无法确定的内容转入人工审核队列</div>
          <div><strong>违规记录:</strong> 所有违规内容都会记录，用于分析恶意行为模式</div>
        </div>
      </div>

      {/* 测试用例 */}
      <div className="mt-6 bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">🧪 测试用例</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <button
            onClick={() => setContent('我最近在求职过程中学到了很多面试技巧，希望能和大家分享一些经验，特别是如何准备技术面试和展示个人项目。这个过程虽然有挑战，但也让我成长了很多。')}
            className="p-2 bg-green-100 text-green-800 rounded hover:bg-green-200 text-left"
          >
            ✅ 正常内容 (应该通过)
          </button>
          
          <button
            onClick={() => setContent('这个公司的老板真是个傻逼，工作环境太差了，我操他妈的！')}
            className="p-2 bg-red-100 text-red-800 rounded hover:bg-red-200 text-left"
          >
            ❌ 违规内容 (应该被拒绝)
          </button>
          
          <button
            onClick={() => setContent('政府的就业政策真的很糟糕，领导人根本不关心老百姓的工作问题，这个党完全不行！')}
            className="p-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-left"
          >
            ⚠️ 政治敏感 (需要AI审核)
          </button>
          
          <button
            onClick={() => setContent('短内容')}
            className="p-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-left"
          >
            📏 内容过短 (应该被拒绝)
          </button>
        </div>
      </div>
    </div>
  );
};
