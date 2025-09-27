/**
 * AB值凭证展示组件
 * 显示自动生成的A值和B值，提供图片下载功能
 */

import React, { useRef, useEffect } from 'react';
import { Modal, Button, Space, Typography, Card, Divider, message } from 'antd';
import { 
  DownloadOutlined, 
  CopyOutlined, 
  SafetyOutlined,
  EyeOutlined,
  KeyOutlined
} from '@ant-design/icons';
import './ABCredentialsDisplay.css';

const { Title, Text, Paragraph } = Typography;

interface ABCredentialsDisplayProps {
  /** 是否显示弹窗 */
  visible: boolean;
  /** A值（11位数字） */
  identityA: string;
  /** B值（6位数字） */
  identityB: string;
  /** 确认回调 */
  onConfirm: () => void;
  /** 取消回调 */
  onCancel: () => void;
}

const ABCredentialsDisplay: React.FC<ABCredentialsDisplayProps> = ({
  visible,
  identityA,
  identityB,
  onConfirm,
  onCancel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 生成凭证图片
  const generateCredentialImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = 400;
    canvas.height = 300;

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 400, 300);
    gradient.addColorStop(0, '#f0f9ff');
    gradient.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 300);

    // 边框
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 380, 280);

    // 标题
    ctx.fillStyle = '#1890ff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('就业调查问卷 - 登录凭证', 200, 50);

    // 分割线
    ctx.strokeStyle = '#d9d9d9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 70);
    ctx.lineTo(370, 70);
    ctx.stroke();

    // A值标签
    ctx.fillStyle = '#262626';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('A值 (账户标识):', 30, 110);

    // A值
    ctx.fillStyle = '#1890ff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(identityA, 200, 140);

    // B值标签
    ctx.fillStyle = '#262626';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('B值 (验证码):', 30, 180);

    // B值
    ctx.fillStyle = '#52c41a';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(identityB, 200, 210);

    // 底部说明
    ctx.fillStyle = '#8c8c8c';
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('请妥善保存此凭证，用于后续登录', 200, 250);
    ctx.fillText(`生成时间: ${new Date().toLocaleString()}`, 200, 270);
  };

  // 当弹窗显示时生成图片
  useEffect(() => {
    if (visible && identityA && identityB) {
      setTimeout(generateCredentialImage, 100);
    }
  }, [visible, identityA, identityB]);

  // 复制到剪贴板
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${label}已复制到剪贴板`);
    } catch (error) {
      message.error('复制失败，请手动复制');
    }
  };

  // 下载图片
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement('a');
      link.download = `就业调查问卷-登录凭证-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      message.success('凭证图片下载成功');
    } catch (error) {
      message.error('下载失败，请重试');
    }
  };

  return (
    <Modal
      title={
        <Space>
          <KeyOutlined style={{ color: '#1890ff' }} />
          账户创建成功
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={handleDownload}>
          下载凭证图片
        </Button>,
        <Button key="confirm" type="primary" onClick={onConfirm}>
          完成登录
        </Button>
      ]}
      width={500}
      centered
      maskClosable={false}
      className="ab-credentials-modal"
    >
      <div className="credentials-content">
        <div className="success-message">
          <SafetyOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
          <Title level={4} style={{ margin: '8px 0', color: '#52c41a' }}>
            半匿名账户创建成功！
          </Title>
          <Text type="secondary">
            系统已为您自动生成登录凭证，请妥善保存
          </Text>
        </div>

        <Divider />

        <div className="credentials-display">
          <Card className="credential-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="credential-item">
                <Text strong>A值 (账户标识):</Text>
                <div className="credential-value">
                  <Text code style={{ fontSize: '18px', color: '#1890ff' }}>
                    {identityA}
                  </Text>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    size="small"
                    onClick={() => handleCopy(identityA, 'A值')}
                  />
                </div>
              </div>

              <div className="credential-item">
                <Text strong>B值 (验证码):</Text>
                <div className="credential-value">
                  <Text code style={{ fontSize: '18px', color: '#52c41a' }}>
                    {identityB}
                  </Text>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    size="small"
                    onClick={() => handleCopy(identityB, 'B值')}
                  />
                </div>
              </div>
            </Space>
          </Card>
        </div>

        <div className="important-notice">
          <Paragraph type="warning" style={{ margin: 0 }}>
            <EyeOutlined /> 重要提示：请保存好您的A值和B值，这是您下次登录的唯一凭证
          </Paragraph>
        </div>

        {/* 隐藏的画布用于生成图片 */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
          width={400}
          height={300}
        />
      </div>
    </Modal>
  );
};

export default ABCredentialsDisplay;
