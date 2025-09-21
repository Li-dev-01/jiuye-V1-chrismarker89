#!/usr/bin/env python3
"""
清理所有模拟数据的脚本
将硬编码的模拟数据替换为真实数据获取或空状态显示
"""

import os
import re
import shutil
from pathlib import Path

# 需要清理的文件列表
FILES_TO_CLEAN = [
    'frontend/src/pages/analytics/AdvancedAnalyticsPage.tsx',
    'frontend/src/pages/analytics/AnalyticsPage.tsx', 
    'frontend/src/pages/analytics/StudentParentDashboard.tsx',
    'frontend/src/pages/analytics/PolicyMakerDashboard.tsx',
    'frontend/src/pages/analytics/EducationDashboard.tsx',
    'frontend/src/pages/analytics/PublicDashboard.tsx',
    'frontend/src/pages/Stories.tsx',
    'frontend/src/pages/Voices.tsx'
]

# 模拟数据模式
MOCK_DATA_PATTERNS = [
    r'const mockData.*?=.*?\{[\s\S]*?\};',
    r'const.*?Data.*?=.*?\{[\s\S]*?totalResponses.*?[\s\S]*?\};',
    r'// 模拟数据[\s\S]*?};',
    r'// 专业详细分析数据[\s\S]*?};',
    r'// 核心KPI数据[\s\S]*?};',
    r'// 地区就业数据[\s\S]*?];',
    r'// 学历就业对比[\s\S]*?];',
    r'// 专业推荐数据[\s\S]*?];'
]

def backup_file(file_path):
    """备份文件"""
    backup_path = f"{file_path}.backup"
    if os.path.exists(file_path):
        shutil.copy2(file_path, backup_path)
        print(f"✅ 备份文件: {backup_path}")

def clean_mock_data(file_path):
    """清理单个文件的模拟数据"""
    if not os.path.exists(file_path):
        print(f"⚠️ 文件不存在: {file_path}")
        return False
    
    print(f"🧹 清理文件: {file_path}")
    
    # 备份文件
    backup_file(file_path)
    
    # 读取文件内容
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 清理模拟数据
    for pattern in MOCK_DATA_PATTERNS:
        matches = re.findall(pattern, content, re.MULTILINE | re.DOTALL)
        if matches:
            print(f"  📝 找到模拟数据模式: {len(matches)} 个匹配")
            content = re.sub(pattern, '// 模拟数据已清理', content, flags=re.MULTILINE | re.DOTALL)
    
    # 如果内容有变化，写回文件
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ 清理完成")
        return True
    else:
        print(f"  ℹ️ 未发现需要清理的模拟数据")
        return False

def create_empty_state_template(file_path):
    """为分析页面创建空状态模板"""
    if 'analytics' in file_path and file_path.endswith('.tsx'):
        template = '''import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { AnalyticsEmptyState } from '../../components/common/EmptyState';

const { Title } = Typography;

export const ComponentName: React.FC = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    setLoading(true);
    try {
      // 从真实API获取数据
      const response = await fetch('/api/analytics/real-data');
      if (response.ok) {
        const realData = await response.json();
        setData(realData.success ? realData.data : null);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: '48px' }}>
        <div>正在加载数据...</div>
      </Card>
    );
  }

  if (!data) {
    return (
      <AnalyticsEmptyState 
        onAction={loadRealData}
        showAction={true}
      />
    );
  }

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={2}>数据分析</Title>
          <Button icon={<ReloadOutlined />} onClick={loadRealData}>
            刷新数据
          </Button>
          {/* 这里显示真实数据 */}
          <div>真实数据内容</div>
        </Space>
      </Card>
    </div>
  );
};
'''
        return template
    return None

def main():
    """主函数"""
    print("🧹 开始清理所有模拟数据...")
    print("=" * 60)
    
    cleaned_files = []
    
    for file_path in FILES_TO_CLEAN:
        if clean_mock_data(file_path):
            cleaned_files.append(file_path)
    
    print("\n" + "=" * 60)
    print("🎯 清理总结")
    print("=" * 60)
    
    if cleaned_files:
        print(f"✅ 成功清理 {len(cleaned_files)} 个文件:")
        for file_path in cleaned_files:
            print(f"  • {file_path}")
    else:
        print("ℹ️ 未发现需要清理的文件")
    
    print("\n📋 后续步骤:")
    print("1. 检查清理后的文件是否正常")
    print("2. 添加空状态组件导入")
    print("3. 实现真实数据获取逻辑")
    print("4. 测试页面功能")
    
    print("\n🔄 如需恢复，使用备份文件:")
    for file_path in cleaned_files:
        backup_path = f"{file_path}.backup"
        if os.path.exists(backup_path):
            print(f"  cp {backup_path} {file_path}")

if __name__ == "__main__":
    main()
