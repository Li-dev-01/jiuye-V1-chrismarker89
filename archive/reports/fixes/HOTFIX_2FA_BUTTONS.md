# 紧急修复：添加 2FA 启用/禁用按钮

## 🐛 问题描述

用户报告在账户管理页面（`/admin/email-role-accounts`）中：
1. **2FA 列显示正常**（显示"已启用"或"未启用"）
2. **但是没有 2FA 启用/禁用按钮**

## 🔍 问题分析

### 根本原因
`EmailRoleAccountManagement.tsx` 页面缺少 2FA 管理功能：
- ✅ 2FA 状态列已经存在
- ❌ 缺少启用 2FA 的按钮
- ❌ 缺少禁用 2FA 的按钮
- ❌ 缺少 2FA 设置模态框

### 为什么会出现这个问题？
在阶段4实施时，我们主要修改了 `SuperAdminAccountManagement.tsx` 页面，但是忽略了 `EmailRoleAccountManagement.tsx` 页面也需要相同的功能。

## ✅ 修复内容

### 1. 添加状态管理
```typescript
const [twoFAModalVisible, setTwoFAModalVisible] = useState(false);
const [twoFASecret, setTwoFASecret] = useState('');
const [twoFAQRCode, setTwoFAQRCode] = useState('');
const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([]);
```

### 2. 添加 2FA 处理函数

#### 启用 2FA
```typescript
const handleEnable2FA = async (emailId: number) => {
  setLoading(true);
  try {
    const response = await fetch(
      `https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts/${emailId}/enable-2fa`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      }
    );

    if (response.ok) {
      const result = await response.json();
      setTwoFASecret(result.data.secret);
      setTwoFAQRCode(result.data.qrCode);
      setTwoFABackupCodes(result.data.backupCodes || []);
      setTwoFAModalVisible(true);
      loadAccounts(); // 刷新列表
    } else {
      message.error('启用2FA失败');
    }
  } catch (error) {
    console.error('Enable 2FA error:', error);
    message.error('操作失败，请稍后重试');
  } finally {
    setLoading(false);
  }
};
```

#### 禁用 2FA
```typescript
const handleDisable2FA = async (emailId: number) => {
  setLoading(true);
  try {
    const response = await fetch(
      `https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts/${emailId}/disable-2fa`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      }
    );

    if (response.ok) {
      message.success('2FA已禁用');
      loadAccounts();
    } else {
      message.error('禁用2FA失败');
    }
  } catch (error) {
    console.error('Disable 2FA error:', error);
    message.error('操作失败，请稍后重试');
  } finally {
    setLoading(false);
  }
};
```

### 3. 在操作列中添加 2FA 按钮

```typescript
{
  title: '操作',
  key: 'actions',
  width: 350,
  render: (_, record) => (
    <Space wrap>
      <Button
        type="link"
        icon={<PlusOutlined />}
        onClick={() => {
          form.setFieldsValue({ email: record.email });
          setModalVisible(true);
        }}
      >
        添加角色
      </Button>
      
      {/* 2FA 管理 */}
      {record.twoFactorEnabled ? (
        <Popconfirm
          title="确定要禁用此邮箱的2FA吗？"
          description="这将影响该邮箱下的所有角色账号"
          onConfirm={() => handleDisable2FA(record.id)}
        >
          <Button type="link" danger>
            禁用2FA
          </Button>
        </Popconfirm>
      ) : (
        <Button
          type="link"
          onClick={() => handleEnable2FA(record.id)}
        >
          启用2FA
        </Button>
      )}
      
      <Button
        type="link"
        onClick={() => handleToggleEmailStatus(record.id, record.isActive)}
      >
        {record.isActive ? '停用' : '启用'}
      </Button>
      
      <Popconfirm
        title={`确定要删除邮箱 ${record.email} 及其所有角色账号吗？`}
        description="此操作不可恢复，请谨慎操作！"
        onConfirm={() => handleDeleteEmail(record.id, record.email)}
        okText="确定删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Button type="link" danger>
          删除邮箱
        </Button>
      </Popconfirm>
    </Space>
  )
}
```

### 4. 添加 2FA 设置模态框

```typescript
<Modal
  title={<><SafetyOutlined /> 双因素认证设置</>}
  open={twoFAModalVisible}
  onCancel={() => {
    setTwoFAModalVisible(false);
    loadAccounts();
  }}
  footer={[
    <Button key="close" onClick={() => {
      setTwoFAModalVisible(false);
      loadAccounts();
    }}>
      关闭
    </Button>
  ]}
  width={600}
>
  <Space direction="vertical" style={{ width: '100%' }} size="large">
    <Alert
      message="请使用Google Authenticator或其他TOTP应用扫描二维码"
      type="info"
      showIcon
    />

    <div style={{ textAlign: 'center' }}>
      {twoFAQRCode && <QRCode value={twoFAQRCode} size={200} />}
    </div>

    <div>
      <Text strong>密钥（手动输入）：</Text>
      <Paragraph copyable>{twoFASecret}</Paragraph>
    </div>

    <Divider />

    <div>
      <Text strong>备用代码（请妥善保存）：</Text>
      <Alert
        message="这些备用代码只显示一次，请立即保存！每个代码只能使用一次。"
        type="error"
        showIcon
        style={{ marginTop: '8px', marginBottom: '16px' }}
      />
      <div style={{ 
        background: '#f5f5f5', 
        padding: '16px', 
        borderRadius: '4px',
        fontFamily: 'monospace'
      }}>
        {twoFABackupCodes.map((code, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            {index + 1}. {code}
          </div>
        ))}
      </div>
      <Button
        type="link"
        onClick={() => {
          const text = twoFABackupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n');
          navigator.clipboard.writeText(text);
          message.success('备用代码已复制到剪贴板');
        }}
        style={{ marginTop: '8px' }}
      >
        复制所有备用代码
      </Button>
    </div>

    <Alert
      message="请妥善保存密钥和备用代码，用于恢复访问"
      type="warning"
      showIcon
    />
  </Space>
</Modal>
```

## 🚀 部署信息

### 第一次修复（添加按钮）
- **修复时间**：2025-10-06
- **前端部署**：https://65b40dfa.reviewer-admin-dashboard.pages.dev
- **修改文件**：`reviewer-admin-dashboard/src/pages/EmailRoleAccountManagement.tsx`

### 第二次修复（修复 API 404 错误）
- **修复时间**：2025-10-06
- **前端部署**：https://f63a2457.reviewer-admin-dashboard.pages.dev
- **后端部署**：Version ID: 693ad528-c951-4696-ae95-7f1b786bafb6
- **修改文件**：
  - `backend/src/routes/account-management.ts`（添加邮箱级别的 2FA API）
  - `reviewer-admin-dashboard/src/pages/EmailRoleAccountManagement.tsx`（修复 API 路径）

## 🐛 第二次发现的问题

### 问题描述
用户点击"启用2FA"按钮后，出现 404 错误：
```
POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts/8/enable-2fa 404 (Not Found)
```

### 根本原因
- 前端传递的是**邮箱 ID**（例如：8）
- 后端的 `/accounts/:id/enable-2fa` 端点期望的是**角色账号 ID**
- 这导致 API 找不到对应的账号，返回 404

### 解决方案
在后端添加两个新的 API 端点，专门处理邮箱级别的 2FA 操作：

1. **启用 2FA（邮箱级别）**
   ```
   POST /api/admin/account-management/emails/:id/enable-2fa
   ```

2. **禁用 2FA（邮箱级别）**
   ```
   POST /api/admin/account-management/emails/:id/disable-2fa
   ```

### 实现细节

#### 后端新增端点（`backend/src/routes/account-management.ts`）

**启用 2FA（邮箱级别）**：
```typescript
accountManagement.post('/emails/:id/enable-2fa', async (c) => {
  const emailId = parseInt(c.req.param('id'));

  // 1. 获取邮箱信息
  const emailWhitelist = await db.queryFirst(`
    SELECT id, email FROM email_whitelist WHERE id = ?
  `, [emailId]);

  // 2. 获取该邮箱的第一个角色账号（用于生成 QR 码）
  const account = await db.queryFirst(`
    SELECT id, username FROM role_accounts WHERE email = ? LIMIT 1
  `, [emailWhitelist.email]);

  // 3. 生成 2FA 密钥、QR 码、备用代码
  const secret = generateBase32Secret(32);
  const qrCodeUrl = generateQRCodeURL(secret, account.username, '就业调查系统');
  const backupCodes = generateBackupCodes(10, 8);

  // 4. 更新邮箱白名单的 2FA 设置
  await db.execute(`
    UPDATE email_whitelist
    SET two_factor_enabled = 1, two_factor_secret = ?, updated_at = ?
    WHERE id = ?
  `, [secret, now, emailId]);

  // 5. 存储备用代码（哈希后）
  for (const code of backupCodes) {
    const codeHash = await hashBackupCode(code);
    await db.execute(`
      INSERT INTO two_factor_backup_codes (email, code_hash, created_at)
      VALUES (?, ?, ?)
    `, [emailWhitelist.email, codeHash, now]);
  }

  // 6. 返回结果
  return c.json({
    success: true,
    data: {
      secret,
      qrCode: qrCodeUrl,
      backupCodes
    }
  });
});
```

**禁用 2FA（邮箱级别）**：
```typescript
accountManagement.post('/emails/:id/disable-2fa', async (c) => {
  const emailId = parseInt(c.req.param('id'));

  // 1. 获取邮箱信息
  const emailWhitelist = await db.queryFirst(`
    SELECT id, email FROM email_whitelist WHERE id = ?
  `, [emailId]);

  // 2. 更新邮箱白名单的 2FA 设置
  await db.execute(`
    UPDATE email_whitelist
    SET two_factor_enabled = 0, two_factor_secret = NULL, updated_at = ?
    WHERE id = ?
  `, [now, emailId]);

  // 3. 删除所有备用代码
  await db.execute(`
    DELETE FROM two_factor_backup_codes WHERE email = ?
  `, [emailWhitelist.email]);

  return c.json({
    success: true,
    message: '2FA已禁用'
  });
});
```

#### 前端修复（`reviewer-admin-dashboard/src/pages/EmailRoleAccountManagement.tsx`）

**修改前**：
```typescript
const response = await fetch(
  `https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts/${emailId}/enable-2fa`,
  // ...
);
```

**修改后**：
```typescript
const response = await fetch(
  `https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/emails/${emailId}/enable-2fa`,
  // ...
);
```

## 🧪 测试步骤

1. **访问账户管理页面**
   ```
   URL: https://reviewer-admin-dashboard.pages.dev/admin/email-role-accounts
   ```

2. **查看操作列**
   - 应该看到"启用2FA"或"禁用2FA"按钮
   - 按钮根据当前 2FA 状态动态显示

3. **测试启用 2FA**
   - 点击"启用2FA"按钮
   - 应该弹出模态框
   - 显示 QR 码、密钥和备用代码

4. **测试禁用 2FA**
   - 点击"禁用2FA"按钮
   - 确认操作
   - 2FA 状态应该变为"未启用"

## ✅ 修复验证

- [x] 2FA 启用按钮显示正常
- [x] 2FA 禁用按钮显示正常
- [x] 点击启用按钮弹出模态框
- [x] 模态框显示 QR 码
- [x] 模态框显示密钥
- [x] 模态框显示备用代码
- [x] 点击禁用按钮成功禁用
- [x] 前端已部署

## 📝 注意事项

1. **两个账户管理页面**：
   - `/admin/account-management`：`SuperAdminAccountManagement.tsx`（已有 2FA 功能）
   - `/admin/email-role-accounts`：`EmailRoleAccountManagement.tsx`（本次修复）

2. **功能一致性**：
   - 两个页面现在都有完整的 2FA 管理功能
   - 使用相同的 API 端点
   - 使用相同的 UI 组件

3. **后续优化**：
   - 考虑将 2FA 管理功能提取为共享组件
   - 减少代码重复

## 🎉 修复完成

现在用户可以在账户管理页面正常使用 2FA 功能了！

