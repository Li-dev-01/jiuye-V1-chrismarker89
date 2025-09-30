# 账户管理功能说明

## 新增功能

### 1. 邮箱级别操作

#### 1.1 停用/启用邮箱
- **功能描述**：切换邮箱的激活状态，停用后该邮箱下的所有角色账号都无法登录
- **操作位置**：主表格的"操作"列
- **按钮文本**：
  - 激活状态：显示"停用"按钮
  - 停用状态：显示"启用"按钮
- **API接口**：
  ```
  PUT /api/admin/account-management/emails/{emailId}/toggle-status
  Headers: Authorization: Bearer {super_admin_token}
  Body: { "isActive": true/false }
  ```

#### 1.2 删除邮箱
- **功能描述**：删除整个邮箱及其所有关联的角色账号
- **操作位置**：主表格的"操作"列
- **按钮文本**："删除邮箱"（红色危险按钮）
- **确认提示**：
  - 标题：`确定要删除邮箱 {email} 及其所有角色账号吗？`
  - 描述：`此操作不可恢复，请谨慎操作！`
- **API接口**：
  ```
  DELETE /api/admin/account-management/emails/{emailId}
  Headers: Authorization: Bearer {super_admin_token}
  ```

### 2. 角色账号级别操作

#### 2.1 停用/启用角色账号
- **功能描述**：切换单个角色账号的激活状态
- **操作位置**：展开行中的角色账号表格的"操作"列
- **按钮文本**：
  - 激活状态：显示"停用"按钮
  - 停用状态：显示"启用"按钮
- **API接口**：
  ```
  PUT /api/admin/account-management/accounts/{accountId}/toggle-status
  Headers: Authorization: Bearer {super_admin_token}
  Body: { "isActive": true/false }
  ```

#### 2.2 删除角色账号
- **功能描述**：删除单个角色账号（保留邮箱和其他角色账号）
- **操作位置**：展开行中的角色账号表格的"操作"列
- **按钮文本**："删除"（红色危险按钮，带删除图标）
- **确认提示**：
  - 标题：`确定要删除这个角色账号吗？`
  - 描述：`此操作不可恢复！`
- **API接口**：
  ```
  DELETE /api/admin/account-management/accounts/{accountId}
  Headers: Authorization: Bearer {super_admin_token}
  ```

## 功能层级结构

```
邮箱 (Email)
├── 停用/启用邮箱 → 影响该邮箱下的所有角色账号
├── 删除邮箱 → 删除该邮箱及其所有角色账号
└── 角色账号 (Role Account)
    ├── 停用/启用角色账号 → 只影响该角色账号
    └── 删除角色账号 → 只删除该角色账号
```

## 操作权限

所有操作都需要超级管理员权限（super_admin_token）

## 操作流程

### 停用账号流程
1. 点击"停用"按钮
2. 系统发送API请求
3. 后端更新账号状态
4. 前端刷新数据并显示成功消息
5. 被停用的账号无法登录

### 删除账号流程
1. 点击"删除"或"删除邮箱"按钮
2. 显示确认对话框
3. 用户确认后发送API请求
4. 后端删除数据
5. 前端刷新数据并显示成功消息

## UI改进

### 主表格操作列
- 宽度：280px
- 按钮排列：
  1. "添加角色"（蓝色链接按钮）
  2. "停用/启用"（普通链接按钮）
  3. "删除邮箱"（红色危险链接按钮，带确认对话框）

### 展开行操作列
- 宽度：200px
- 按钮排列：
  1. "停用/启用"（小号普通链接按钮）
  2. "删除"（小号红色危险链接按钮，带删除图标和确认对话框）

## 后端API需求

需要后端实现以下API接口：

### 1. 切换邮箱状态
```typescript
PUT /api/admin/account-management/emails/{emailId}/toggle-status
Request Body: {
  "isActive": boolean
}
Response: {
  "success": boolean,
  "message": string
}
```

### 2. 删除邮箱
```typescript
DELETE /api/admin/account-management/emails/{emailId}
Response: {
  "success": boolean,
  "message": string
}
```

### 3. 切换角色账号状态
```typescript
PUT /api/admin/account-management/accounts/{accountId}/toggle-status
Request Body: {
  "isActive": boolean
}
Response: {
  "success": boolean,
  "message": string
}
```

### 4. 删除角色账号（已存在）
```typescript
DELETE /api/admin/account-management/accounts/{accountId}
Response: {
  "success": boolean,
  "message": string
}
```

## 安全考虑

1. **权限验证**：所有操作都需要验证super_admin_token
2. **级联删除**：删除邮箱时应级联删除所有关联的角色账号
3. **状态同步**：停用邮箱时，应同时停用该邮箱下的所有角色账号
4. **操作日志**：建议记录所有删除和状态变更操作
5. **防误删**：所有删除操作都有确认对话框

## 测试建议

### 测试场景
1. 停用邮箱 → 验证该邮箱下的所有角色账号都无法登录
2. 启用邮箱 → 验证该邮箱下的角色账号可以正常登录
3. 删除邮箱 → 验证邮箱及其所有角色账号都被删除
4. 停用单个角色账号 → 验证只有该角色账号无法登录
5. 删除单个角色账号 → 验证只有该角色账号被删除，其他角色账号不受影响

### 边界测试
1. 删除最后一个角色账号 → 邮箱应该保留
2. 删除超级管理员账号 → 应该有额外的安全检查
3. 停用当前登录的账号 → 应该提示用户

## 用户体验优化

1. **操作反馈**：所有操作都有明确的成功/失败消息
2. **确认对话框**：删除操作都有二次确认
3. **状态显示**：使用不同颜色的Tag显示账号状态
4. **按钮文本**：根据当前状态动态显示"停用"或"启用"
5. **危险操作**：删除按钮使用红色，突出显示危险性

## 文件修改

- **文件**：`reviewer-admin-dashboard/src/pages/EmailRoleAccountManagement.tsx`
- **新增函数**：
  - `handleToggleAccountStatus()` - 切换角色账号状态
  - `handleToggleEmailStatus()` - 切换邮箱状态
  - `handleDeleteEmail()` - 删除邮箱
- **修改部分**：
  - 主表格操作列 - 添加停用/启用和删除邮箱按钮
  - 展开行操作列 - 添加停用/启用按钮

## 下一步

1. **后端实现**：实现上述4个API接口
2. **测试**：进行完整的功能测试
3. **文档**：更新API文档
4. **部署**：部署到生产环境

