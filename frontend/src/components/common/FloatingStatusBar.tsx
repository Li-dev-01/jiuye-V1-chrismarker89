/**
 * 悬浮状态栏组件
 * 提供A+B快捷登录和用户内容管理功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Dropdown, Modal, Form, Input, message, Space, List, Card, Typography, Spin, Empty, Tag, Select } from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  LogoutOutlined,
  LoginOutlined,
  FileTextOutlined,
  HeartOutlined,
  EditOutlined,
  EyeOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { heartVoiceService } from '../../services/heartVoiceService';
import { storyService } from '../../services/storyService';
import styles from './FloatingStatusBar.module.css';



const { Title, Text } = Typography;

export const FloatingStatusBar: React.FC = () => {
  // 完全禁用组件以解决问题
  console.log('FloatingStatusBar: 组件已禁用');
  return null;

  // 键盘快捷键支持
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Alt + F: 快速发布心声
    if (event.altKey && event.key === 'f' && isAuthenticated) {
      event.preventDefault();
      handleQuickPublish('voice');
    }
    // Alt + S: 快速发布故事
    if (event.altKey && event.key === 's' && isAuthenticated) {
      event.preventDefault();
      handleQuickPublish('story');
    }
    // Alt + V: 查看我的内容
    if (event.altKey && event.key === 'v' && isAuthenticated) {
      event.preventDefault();
      handleViewContent('voices');
    }
    // Escape: 关闭所有模态框
    if (event.key === 'Escape') {
      setShowQuickLogin(false);
      setShowContentViewer(false);
      setShowQuickPublish(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 使用统一认证store
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    loginSemiAnonymous,
    logout,
    clearError
  } = useUniversalAuthStore();

  // 处理登出
  const handleLogout = async () => {
    try {
      await logout();
      message.success('已退出登录');
      navigate('/');
    } catch (error) {
      message.error('退出登录失败');
    }
  };

  // 快捷A+B登录
  const handleQuickLogin = async (values: { identityA: string; identityB: string }) => {
    try {
      clearError();
      const success = await loginSemiAnonymous(values.identityA, values.identityB);

      if (success) {
        message.success('登录成功！');
        setShowQuickLogin(false);
        form.resetFields();
      } else {
        message.error('登录失败，请检查A+B组合是否正确');
      }
    } catch (error) {
      message.error('登录过程中发生错误');
    }
  };

  // 加载用户内容
  const loadUserContent = async (type: 'voices' | 'stories') => {
    if (!isAuthenticated || !currentUser) return;

    setContentLoading(true);
    try {
      let result;
      if (type === 'voices') {
        result = await heartVoiceService.getUserHeartVoices(currentUser.id, {
          page: 1,
          pageSize: 10,
          sortBy: 'created_at',
          sortOrder: 'desc'
        });
      } else {
        result = await storyService.getUserStories(currentUser.id, {
          page: 1,
          pageSize: 10,
          sortBy: 'created_at',
          sortOrder: 'desc'
        });
      }

      if (result.success && result.data) {
        setUserContent(result.data.items || result.data.voices || result.data.stories || []);
      } else {
        setUserContent([]);
      }
    } catch (error) {
      console.error('Load user content error:', error);
      setUserContent([]);
      message.error('加载内容失败');
    } finally {
      setContentLoading(false);
    }
  };

  // 打开内容查看器
  const handleViewContent = async (type: 'voices' | 'stories') => {
    setContentType(type);
    setShowContentViewer(true);
    await loadUserContent(type);
  };

  // 打开快速发布
  const handleQuickPublish = (type: 'voice' | 'story') => {
    setPublishType(type);
    setShowQuickPublish(true);
    publishForm.resetFields();
  };

  // 处理快速发布提交
  const handleQuickPublishSubmit = async (values: any) => {
    if (!isAuthenticated || !currentUser) {
      message.error('请先登录后再发布');
      setButtonState('error');
      setTimeout(() => setButtonState('normal'), 2000);
      return;
    }

    setButtonState('loading');
    try {
      if (publishType === 'voice') {
        // 发布心声
        const heartVoiceData = {
          content: values.content,
          category: values.category || 'employment-feedback',
          emotion_score: values.emotionScore || 3,
          tags: values.tags || [],
          is_anonymous: values.isAnonymous !== false,
          user_id: currentUser.id
        };

        const result = await heartVoiceService.createHeartVoice(heartVoiceData);
        if (result.success) {
          setButtonState('success');
          message.success('心声发布成功！等待审核后将会展示');
          setShowQuickPublish(false);
          publishForm.resetFields();
          setTimeout(() => setButtonState('normal'), 2000);
        } else {
          setButtonState('error');
          message.error('发布失败: ' + result.error);
          setTimeout(() => setButtonState('normal'), 2000);
        }
      } else {
        // 发布故事
        const storyData = {
          title: values.title,
          content: values.content,
          summary: values.summary || values.content.substring(0, 200) + '...',
          category: values.category || 'employment-experience',
          tags: values.tags || [],
          author_name: values.isAnonymous !== false ? '匿名用户' : (currentUser.displayName || '用户'),
          is_anonymous: values.isAnonymous !== false,
          user_id: currentUser.id
        };

        const result = await storyService.createStory(storyData);
        if (result.success) {
          setButtonState('success');
          message.success('故事发布成功！等待审核后将会展示');
          setShowQuickPublish(false);
          publishForm.resetFields();
          setTimeout(() => setButtonState('normal'), 2000);
        } else {
          setButtonState('error');
          message.error('发布失败: ' + result.error);
          setTimeout(() => setButtonState('normal'), 2000);
        }
      }
    } catch (error) {
      setButtonState('error');
      message.error('发布失败，请稍后重试');
      console.error('Quick publish error:', error);
      setTimeout(() => setButtonState('normal'), 2000);
    }
  };

  // 未登录状态的菜单 - 注册/登录
  const guestMenuItems: MenuProps['items'] = [
    {
      key: 'quick-login',
      icon: <LoginOutlined />,
      label: '注册/登录',
      onClick: () => setShowQuickLogin(true)
    }
  ];

  // 已登录状态的菜单 - 核心功能
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'my-content',
      icon: <FileTextOutlined />,
      label: '查看我的内容',
      children: [
        {
          key: 'my-voices',
          icon: <HeartOutlined />,
          label: '我的问卷心声',
          onClick: () => handleViewContent('voices')
        },
        {
          key: 'my-stories',
          icon: <FileTextOutlined />,
          label: '我的故事',
          onClick: () => handleViewContent('stories')
        },
        {
          type: 'divider'
        },
        {
          key: 'goto-voices',
          icon: <EyeOutlined />,
          label: '浏览所有心声',
          onClick: () => navigate('/voices')
        },
        {
          key: 'goto-stories',
          icon: <EyeOutlined />,
          label: '浏览所有故事',
          onClick: () => navigate('/stories')
        }
      ]
    },
    {
      key: 'publish-content',
      icon: <EditOutlined />,
      label: '发布内容',
      children: [
        {
          key: 'quick-publish-voice',
          icon: <HeartOutlined />,
          label: '快速发布心声',
          onClick: () => handleQuickPublish('voice')
        },
        {
          key: 'quick-publish-story',
          icon: <FileTextOutlined />,
          label: '快速发布故事',
          onClick: () => handleQuickPublish('story')
        },
        {
          type: 'divider'
        },
        {
          key: 'goto-publish-voice',
          icon: <EyeOutlined />,
          label: '完整发布心声',
          onClick: () => navigate('/voices')
        },
        {
          key: 'goto-publish-story',
          icon: <EyeOutlined />,
          label: '完整发布故事',
          onClick: () => navigate('/stories')
        }
      ]
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '注销',
      onClick: handleLogout,
      danger: true
    }
  ];

  // 获取用户显示信息
  const getUserDisplayInfo = () => {
    if (!currentUser) return { name: '未登录', type: 'guest' };

    // 处理半匿名用户
    if (currentUser.userType === 'semi_anonymous') {
      return {
        name: currentUser.display_name || `半匿名用户_${currentUser.uuid?.slice(-6)}`,
        type: '半匿名用户'
      };
    }

    // 处理其他用户类型
    return {
      name: currentUser.username || currentUser.display_name || '用户',
      type: currentUser.userType === 'admin' ? '管理员' :
            currentUser.userType === 'super_admin' ? '超级管理员' :
            currentUser.userType === 'reviewer' ? '审核员' : '注册用户'
    };
  };

  const userInfo = getUserDisplayInfo();

  return (
    <>
      <div className={styles.container}>
        <Dropdown
          menu={{ items: isAuthenticated ? userMenuItems : guestMenuItems }}
          trigger={['click']}
          placement="topLeft"
          onOpenChange={setIsExpanded}
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={buttonState === 'loading' ? null : <PlusOutlined />}
            loading={buttonState === 'loading'}
            className={`${styles.floatingButton} ${isAuthenticated ? styles.loggedIn : styles.guest} ${styles[buttonState]}`}
            aria-label={
              isAuthenticated
                ? '用户菜单 - 查看内容和发布功能 (Alt+V查看内容, Alt+F发布心声, Alt+S发布故事)'
                : '登录菜单 - 点击登录或注册'
            }
            title={
              isAuthenticated
                ? '用户菜单\n快捷键: Alt+V(查看), Alt+F(心声), Alt+S(故事)'
                : '点击登录或注册'
            }
          />
        </Dropdown>


      </div>

      {/* A+B快捷登录模态框 */}
      <Modal
        title="A+B快捷登录"
        open={showQuickLogin}
        onCancel={() => {
          setShowQuickLogin(false);
          form.resetFields();
        }}
        footer={null}
        width={400}
        centered
      >
        <Form
          form={form}
          onFinish={handleQuickLogin}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="identityA"
            label="身份标识A"
            rules={[
              { required: true, message: '请输入身份标识A' },
              { pattern: /^\d{11}$/, message: 'A值必须是11位数字' }
            ]}
          >
            <Input
              placeholder="请输入11位数字（如手机号）"
              maxLength={11}
              onChange={(e) => {
                // 只允许输入数字
                const value = e.target.value.replace(/\D/g, '');
                form.setFieldValue('identityA', value);
              }}
            />
          </Form.Item>

          <Form.Item
            name="identityB"
            label="身份标识B"
            rules={[
              { required: true, message: '请输入身份标识B' },
              { pattern: /^(\d{4}|\d{6})$/, message: 'B值必须是4位或6位数字' }
            ]}
          >
            <Input.Password
              placeholder="请输入4位或6位数字"
              maxLength={6}
              onChange={(e) => {
                // 只允许输入数字
                const value = e.target.value.replace(/\D/g, '');
                form.setFieldValue('identityB', value);
              }}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={() => {
                setShowQuickLogin(false);
                form.resetFields();
              }} disabled={isLoading}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 内容查看器模态框 */}
      <Modal
        title={
          <Space>
            {contentType === 'voices' ? <HeartOutlined /> : <FileTextOutlined />}
            {contentType === 'voices' ? '我的问卷心声' : '我的故事'}
          </Space>
        }
        open={showContentViewer}
        onCancel={() => setShowContentViewer(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowContentViewer(false)}>
            关闭
          </Button>,
          <Button
            key="view-all"
            type="primary"
            onClick={() => {
              setShowContentViewer(false);
              navigate(contentType === 'voices' ? '/voices' : '/stories');
            }}
          >
            查看全部
          </Button>
        ]}
      >
        <Spin spinning={contentLoading}>
          {userContent.length > 0 ? (
            <List
              dataSource={userContent}
              renderItem={(item: any) => (
                <List.Item>
                  <Card
                    size="small"
                    style={{ width: '100%' }}
                    hoverable
                    onClick={() => {
                      setShowContentViewer(false);
                      if (contentType === 'voices') {
                        navigate('/voices');
                      } else {
                        navigate('/stories');
                      }
                    }}
                  >
                    <Card.Meta
                      title={
                        <Space>
                          {contentType === 'voices' ? (
                            <Text strong>{item.content?.substring(0, 50)}...</Text>
                          ) : (
                            <Text strong>{item.title}</Text>
                          )}
                          {item.status === 'pending' && <Tag color="orange">审核中</Tag>}
                          {item.status === 'approved' && <Tag color="green">已发布</Tag>}
                          {item.status === 'rejected' && <Tag color="red">未通过</Tag>}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          {contentType === 'stories' && item.summary && (
                            <Text type="secondary">{item.summary.substring(0, 100)}...</Text>
                          )}
                          <Space>
                            <CalendarOutlined />
                            <Text type="secondary">
                              {new Date(item.created_at).toLocaleDateString()}
                            </Text>
                            {item.category && <Tag>{item.category}</Tag>}
                            {item.likeCount > 0 && (
                              <Text type="secondary">
                                <HeartOutlined style={{ color: '#ff4d4f' }} /> {item.likeCount}
                              </Text>
                            )}
                          </Space>
                        </Space>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Empty
              description={
                contentType === 'voices'
                  ? '您还没有发布过问卷心声'
                  : '您还没有发布过故事'
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                onClick={() => {
                  setShowContentViewer(false);
                  navigate(contentType === 'voices' ? '/voices' : '/stories');
                }}
              >
                去发布第一个{contentType === 'voices' ? '心声' : '故事'}
              </Button>
            </Empty>
          )}
        </Spin>
      </Modal>

      {/* 快速发布模态框 */}
      <Modal
        title={
          <Space>
            {publishType === 'voice' ? <HeartOutlined /> : <FileTextOutlined />}
            快速发布{publishType === 'voice' ? '心声' : '故事'}
          </Space>
        }
        open={showQuickPublish}
        onCancel={() => {
          setShowQuickPublish(false);
          publishForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={publishForm}
          layout="vertical"
          onFinish={handleQuickPublishSubmit}
        >
          {publishType === 'story' && (
            <Form.Item
              name="title"
              label="故事标题"
              rules={[{ required: true, message: '请输入故事标题' }]}
            >
              <Input placeholder="请输入一个吸引人的标题" maxLength={100} />
            </Form.Item>
          )}

          <Form.Item
            name="content"
            label={publishType === 'voice' ? '心声内容' : '故事内容'}
            rules={[
              { required: true, message: `请输入${publishType === 'voice' ? '心声' : '故事'}内容` },
              { min: 10, message: '内容至少需要10个字符' }
            ]}
          >
            <Input.TextArea
              placeholder={publishType === 'voice'
                ? '分享你在求职过程中的真实感受和心声...'
                : '分享你的就业经历，启发他人的职业道路...'
              }
              rows={6}
              maxLength={publishType === 'voice' ? 500 : 2000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            initialValue={publishType === 'voice' ? 'employment-feedback' : 'employment-experience'}
          >
            <Select>
              {publishType === 'voice' ? (
                <>
                  <Select.Option value="employment-feedback">就业反馈</Select.Option>
                  <Select.Option value="interview-experience">面试体验</Select.Option>
                  <Select.Option value="career-planning">职业规划</Select.Option>
                  <Select.Option value="workplace-insights">职场感悟</Select.Option>
                </>
              ) : (
                <>
                  <Select.Option value="employment-experience">就业经历</Select.Option>
                  <Select.Option value="interview-story">面试故事</Select.Option>
                  <Select.Option value="career-change">职业转换</Select.Option>
                  <Select.Option value="success-story">成功故事</Select.Option>
                </>
              )}
            </Select>
          </Form.Item>

          {publishType === 'voice' && (
            <Form.Item
              name="emotionScore"
              label="情感倾向"
              initialValue={3}
            >
              <Select>
                <Select.Option value={1}>😢 消极</Select.Option>
                <Select.Option value={2}>😐 偏消极</Select.Option>
                <Select.Option value={3}>😊 中性</Select.Option>
                <Select.Option value={4}>😄 偏积极</Select.Option>
                <Select.Option value={5}>🎉 积极</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="添加相关标签（可选）"
              maxTagCount={5}
            >
              {publishType === 'voice' ? (
                <>
                  <Select.Option value="求职">求职</Select.Option>
                  <Select.Option value="面试">面试</Select.Option>
                  <Select.Option value="职场">职场</Select.Option>
                  <Select.Option value="心得">心得</Select.Option>
                </>
              ) : (
                <>
                  <Select.Option value="就业">就业</Select.Option>
                  <Select.Option value="经验">经验</Select.Option>
                  <Select.Option value="分享">分享</Select.Option>
                  <Select.Option value="励志">励志</Select.Option>
                </>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="isAnonymous"
            label="发布方式"
            initialValue={true}
          >
            <Select>
              <Select.Option value={true}>匿名发布（推荐）</Select.Option>
              <Select.Option value={false}>实名发布</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={() => {
                setShowQuickPublish(false);
                publishForm.resetFields();
              }}>
                取消
              </Button>
              <Space>
                <Button onClick={() => {
                  setShowQuickPublish(false);
                  navigate(publishType === 'voice' ? '/voices' : '/stories');
                }}>
                  完整编辑
                </Button>
                <Button type="primary" htmlType="submit">
                  立即发布
                </Button>
              </Space>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

    </>
  );
};

export default FloatingStatusBar;
