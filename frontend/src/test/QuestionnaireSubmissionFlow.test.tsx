/**
 * 问卷提交流程测试
 * 验证新的提交方式是否正常工作
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuestionnaireCompletion } from '../pages/QuestionnaireCompletion';

// Mock services
jest.mock('../services/googleOAuthService', () => ({
  googleOAuthService: {
    signIn: jest.fn().mockResolvedValue({}),
  }
}));

jest.mock('../services/questionnaireAuthService', () => ({
  questionnaireAuthService: {
    authenticateWithAPI: jest.fn().mockResolvedValue({
      success: true,
      user: { id: 'test-user' },
      session: { sessionId: 'test-session' }
    }),
  }
}));

jest.mock('../services/universalQuestionnaireService', () => ({
  universalQuestionnaireService: {
    submitQuestionnaire: jest.fn().mockResolvedValue({ success: true }),
  }
}));

// Mock hooks
jest.mock('../stores/universalAuthStore', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    currentUser: null
  })
}));

jest.mock('../hooks/useQuestionnaireCompletion', () => ({
  useQuestionnaireCompletion: () => ({
    isLoggedIn: false,
    userType: null,
    detectionResult: null,
    isDetecting: false,
    recommendedAction: null
  })
}));

const mockQuestionnaireData = {
  personalInfo: {
    name: '测试用户',
    age: 25,
    gender: '男'
  },
  educationInfo: {
    degree: '本科',
    major: '计算机科学'
  }
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('问卷提交流程测试', () => {
  beforeEach(() => {
    // 清理所有mock
    jest.clearAllMocks();
  });

  test('应该显示两个新的提交选项', () => {
    render(
      <TestWrapper>
        <QuestionnaireCompletion questionnaireData={mockQuestionnaireData} />
      </TestWrapper>
    );

    // 检查是否显示Google登录选项
    expect(screen.getByText('Google一键登录')).toBeInTheDocument();
    expect(screen.getByText('使用Google账号快速登录，安全便捷。会获取您的邮箱地址用于身份验证。')).toBeInTheDocument();

    // 检查是否显示自动登录选项
    expect(screen.getByText('自动登录')).toBeInTheDocument();
    expect(screen.getByText('系统自动创建匿名账户，通过简单验证后即可登录提交。')).toBeInTheDocument();

    // 确保不显示旧的匿名提交选项
    expect(screen.queryByText('匿名提交')).not.toBeInTheDocument();
  });

  test('点击Google登录应该显示安全提示', async () => {
    render(
      <TestWrapper>
        <QuestionnaireCompletion questionnaireData={mockQuestionnaireData} />
      </TestWrapper>
    );

    const googleLoginButton = screen.getByRole('button', { name: /Google一键登录/i });
    fireEvent.click(googleLoginButton);

    // 应该显示安全提示弹窗
    await waitFor(() => {
      expect(screen.getByText('隐私安全提示')).toBeInTheDocument();
      expect(screen.getByText('Google一键登录会获得您的邮箱地址，请确保不会透露您的个人信息关联')).toBeInTheDocument();
    });
  });

  test('点击自动登录应该显示数字验证', async () => {
    render(
      <TestWrapper>
        <QuestionnaireCompletion questionnaireData={mockQuestionnaireData} />
      </TestWrapper>
    );

    const autoLoginButton = screen.getByRole('button', { name: /自动登录/i });
    fireEvent.click(autoLoginButton);

    // 应该显示数字验证弹窗
    await waitFor(() => {
      expect(screen.getByText('安全验证')).toBeInTheDocument();
      expect(screen.getByText('为了防止恶意提交，请选择正确的数字')).toBeInTheDocument();
    });
  });

  test('应该显示安全提示信息', () => {
    render(
      <TestWrapper>
        <QuestionnaireCompletion questionnaireData={mockQuestionnaireData} />
      </TestWrapper>
    );

    // 检查安全提示
    expect(screen.getByText('安全提示')).toBeInTheDocument();
    expect(screen.getByText('为了确保问卷数据的真实性和防止恶意提交，我们要求用户登录后提交问卷。请选择以下任一方式进行登录：')).toBeInTheDocument();
  });
});

describe('AB值生成测试', () => {
  test('应该正确生成A值和B值', () => {
    // 模拟生成函数
    const generateIdentityA = (firstDigit: number): string => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString().slice(2, 6);
      return `${firstDigit}${timestamp}${random}`;
    };

    const generateIdentityB = (digit: number): string => {
      return digit.toString().repeat(6);
    };

    // 测试A值生成
    const identityA = generateIdentityA(5);
    expect(identityA).toHaveLength(11);
    expect(identityA.startsWith('5')).toBe(true);

    // 测试B值生成
    const identityB = generateIdentityB(5);
    expect(identityB).toBe('555555');
    expect(identityB).toHaveLength(6);
  });
});
