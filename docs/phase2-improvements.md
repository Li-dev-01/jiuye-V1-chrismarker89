# 阶段2改进计划

## 当前问题

### 1. 2FA 功能显示问题
**现象**：
- 用户管理页面的 2FA 列显示为 "-"（空值）
- 实际上后端已经实现了 2FA 的启用/禁用功能

**可能原因**：
1. 数据库中 `two_factor_enabled` 字段值为 0/1（整数），前端期望 boolean
2. 后端返回的字段名不一致（`two_factor_enabled` vs `twoFactorEnabled`）
3. 数据转换逻辑有问题

**相关代码位置**：
- 后端：`backend/src/routes/account-management.ts` 第 26 行（查询）、第 44 行（数据组装）
- 前端：`reviewer-admin-dashboard/src/pages/SuperAdminAccountManagement.tsx` 第 109 行（数据转换）、第 343 行（列定义）

**修复方案**：
```typescript
// 后端修改（account-management.ts 第 44 行）
emailMap.set(email.email, {
  email: email.email,
  is_active: email.is_active,
  two_factor_enabled: Boolean(email.two_factor_enabled), // 确保转换为 boolean
  created_by: email.created_by,
  created_at: email.created_at,
  last_login_at: email.last_login_at,
  notes: email.notes,
  accounts: []
});

// 或者前端修改（SuperAdminAccountManagement.tsx 第 109 行）
twoFactorEnabled: Boolean(emailGroup.two_factor_enabled) || false,
```

### 2. 一个邮箱多个角色的显示优化
**需求**：
- 当前每个角色显示为独立的行
- 需要优化为：同一邮箱的多个角色合并显示
- 角色以标签形式展示

**设计方案**：
```typescript
// 数据结构调整
interface EmailAccount {
  email: string;
  roles: Array<{
    id: number;
    role: string;
    username: string;
    permissions: string[];
    allowPasswordLogin: boolean;
    isActive: boolean;
  }>;
  twoFactorEnabled: boolean;
  createdBy: string;
  createdAt: string;
  lastLoginAt: string;
  notes: string;
}

// 表格列调整
{
  title: '角色',
  dataIndex: 'roles',
  key: 'roles',
  render: (roles: any[]) => (
    <Space wrap>
      {roles.map(r => (
        <Tag key={r.id} color="blue">{r.role}</Tag>
      ))}
    </Space>
  )
}
```

### 3. 操作按钮优化
**需求**：
- 当前每个角色都有独立的操作按钮
- 需要区分：
  - 邮箱级别的操作（2FA、激活角色）
  - 角色级别的操作（编辑、删除、使用）

**设计方案**：
```typescript
// 操作列分为两部分
{
  title: '操作',
  key: 'action',
  render: (_, record: EmailAccount) => (
    <Space direction="vertical" size="small">
      {/* 邮箱级别操作 */}
      <Space>
        <Button size="small" onClick={() => handleActivateRole(record)}>
          激活角色
        </Button>
        {record.twoFactorEnabled ? (
          <Button size="small" danger onClick={() => handleDisable2FA(record)}>
            禁用2FA
          </Button>
        ) : (
          <Button size="small" onClick={() => handleEnable2FA(record)}>
            启用2FA
          </Button>
        )}
      </Space>
      
      {/* 角色级别操作 */}
      {record.roles.map(role => (
        <Space key={role.id}>
          <Tag>{role.role}</Tag>
          <Button size="small" onClick={() => handleUseAccount(role)}>使用</Button>
          <Button size="small" onClick={() => handleEditRole(role)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteRole(role.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ))}
    </Space>
  )
}
```

## 实施步骤

### 步骤1：修复 2FA 显示问题
1. 检查数据库中 `two_factor_enabled` 字段的实际值
2. 修改后端数据转换逻辑，确保返回 boolean 类型
3. 测试 2FA 启用/禁用功能
4. 验证前端显示正确

### 步骤2：重构数据结构
1. 修改后端 API，返回按邮箱分组的数据（不需要前端扁平化）
2. 更新前端类型定义
3. 修改前端数据处理逻辑
4. 更新表格列定义

### 步骤3：优化 UI 组件
1. 重新设计表格布局
2. 实现角色标签展示
3. 优化操作按钮布局
4. 添加展开/收起功能（如果角色过多）

### 步骤4：测试验证
1. 测试单邮箱单角色场景
2. 测试单邮箱多角色场景
3. 测试 2FA 功能
4. 测试所有操作按钮

## 技术债务
- [ ] 统一后端字段命名规范（下划线 vs 驼峰）
- [ ] 添加前端数据验证
- [ ] 优化错误处理
- [ ] 添加加载状态提示
- [ ] 完善审计日志记录

## 参考资料
- 后端 API 文档：`backend/src/routes/account-management.ts`
- 前端组件：`reviewer-admin-dashboard/src/pages/SuperAdminAccountManagement.tsx`
- 数据库 Schema：`backend/database/email-role-account-schema.sql`

