/**
 * 独立的Zustand测试组件
 * 用于验证Zustand Store是否正常工作
 */

import React, { useState } from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { create } from 'zustand';

const { Text } = Typography;

// 创建一个简单的测试Store
interface TestState {
  count: number;
  message: string;
  isActive: boolean;
  increment: () => void;
  setMessage: (msg: string) => void;
  toggle: () => void;
}

const useTestStore = create<TestState>((set, get) => ({
  count: 0,
  message: 'initial',
  isActive: false,
  increment: () => set((state) => ({ count: state.count + 1 })),
  setMessage: (msg: string) => set({ message: msg }),
  toggle: () => set((state) => ({ isActive: !state.isActive }))
}));

export const ZustandTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const testStore = useTestStore();

  const addResult = (result: string) => {
    setTestResults(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testBasicFunctionality = () => {
    addResult('=== 测试基础功能 ===');
    
    // 测试计数器
    const beforeCount = testStore.count;
    testStore.increment();
    const afterCount = testStore.count;
    addResult(`计数器: ${beforeCount} -> ${afterCount}`);
    
    // 测试消息
    const beforeMessage = testStore.message;
    testStore.setMessage('测试消息');
    const afterMessage = testStore.message;
    addResult(`消息: ${beforeMessage} -> ${afterMessage}`);
    
    // 测试布尔值
    const beforeActive = testStore.isActive;
    testStore.toggle();
    const afterActive = testStore.isActive;
    addResult(`状态: ${beforeActive} -> ${afterActive}`);
  };

  const testComplexState = () => {
    addResult('=== 测试复杂状态 ===');
    
    // 模拟管理员登录的状态结构
    const complexState = {
      user: {
        id: 'test-id',
        username: 'test-user',
        userType: 'ADMIN'
      },
      isAuthenticated: true,
      timestamp: Date.now()
    };
    
    // 尝试设置复杂状态
    useTestStore.setState(complexState as any);
    
    // 检查状态
    const currentState = useTestStore.getState();
    addResult(`复杂状态设置: ${JSON.stringify(currentState, null, 2)}`);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      left: 10, 
      width: 350, 
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 9999,
      backgroundColor: 'white',
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}>
      <Card title="Zustand测试器" size="small">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* 当前状态显示 */}
          <div>
            <Text strong>当前状态:</Text>
            <div style={{ fontSize: '11px', color: '#666' }}>
              <div>计数: {testStore.count}</div>
              <div>消息: {testStore.message}</div>
              <div>激活: {testStore.isActive ? '是' : '否'}</div>
            </div>
          </div>

          {/* 测试按钮 */}
          <Space wrap size="small">
            <Button size="small" onClick={testBasicFunctionality}>
              测试基础功能
            </Button>
            <Button size="small" onClick={testComplexState}>
              测试复杂状态
            </Button>
            <Button size="small" onClick={() => setTestResults([])}>
              清除日志
            </Button>
          </Space>

          {/* 测试结果 */}
          <div>
            <Text strong>测试结果:</Text>
            <div style={{ 
              maxHeight: '200px', 
              overflow: 'auto', 
              backgroundColor: '#f5f5f5', 
              padding: '4px', 
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'monospace'
            }}>
              {testResults.map((result, index) => (
                <div key={index}>{result}</div>
              ))}
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
};
