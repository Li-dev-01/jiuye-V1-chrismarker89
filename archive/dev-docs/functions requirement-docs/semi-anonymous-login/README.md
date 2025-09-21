# 半匿名登录功能克隆文档

## 📋 概述

半匿名登录是一种创新的身份验证方式，通过A+B组合（A值：11位数字，B值：4或6位密码）实现用户身份的半匿名化管理。用户可以在保持匿名的同时管理自己的内容，系统不存储原始A+B值，只生成加密的身份标识。

## 🎯 功能特性

### ✅ 核心功能
- **A+B组合验证** - A值（11位数字，如手机号）+ B值（4或6位密码）
- **身份加密** - 原始A+B值经过哈希加密，不存储明文
- **UUID生成** - 基于A+B组合生成唯一身份标识
- **内容关联** - 用户可以管理自己提交的内容
- **匿名保护** - 保护用户隐私，支持真正的匿名操作

### 🔐 安全特性
- **哈希加密** - 使用SHA-256对A+B值进行不可逆加密
- **盐值保护** - 添加系统盐值增强安全性
- **身份隔离** - 不同身份间完全隔离
- **会话管理** - 支持临时身份验证
- **冲突检测** - 防止多重身份登录冲突

## 📁 文件结构

```
semi-anonymous-login/
├── README.md                           # 本文档
├── components/                         # 组件文件
│   ├── ABLoginModal.html              # A+B登录模态框
│   ├── ABLoginModal.css               # 样式文件
│   ├── ABLoginModal.js                # 交互逻辑
│   └── AnonymousIdentityInput.html    # 匿名身份输入组件
├── services/                          # 服务文件
│   ├── anonymousAuthService.js        # 匿名认证服务
│   ├── identityManager.js             # 身份管理服务
│   ├── uuidService.js                 # UUID生成服务
│   └── cryptoUtils.js                 # 加密工具
├── config/                            # 配置文件
│   ├── security.json                  # 安全配置
│   └── validation.json                # 验证规则
├── examples/                          # 使用示例
│   ├── modal-example.html             # 模态框示例
│   ├── inline-example.html            # 内联使用示例
│   └── content-management.html        # 内容管理示例
└── test.html                          # 功能测试页面
```

## 🔑 A+B组合规则

### A值规则
- **格式**: 11位数字
- **示例**: 13812345678（手机号格式）
- **验证**: `/^\d{11}$/`
- **用途**: 主要身份标识，通常使用手机号

### B值规则
- **格式**: 4位或6位数字
- **示例**: 1234（4位）或 123456（6位）
- **验证**: `/^\d{4}$|^\d{6}$/`
- **用途**: 密码或验证码，用户自定义

### 组合示例
```javascript
// 有效的A+B组合
const validCombinations = [
    { a: '13812345678', b: '1234' },    // 手机号 + 4位密码
    { a: '13987654321', b: '123456' },  // 手机号 + 6位密码
    { a: '15612345678', b: '0000' },    // 手机号 + 4位数字
    { a: '18812345678', b: '888888' }   // 手机号 + 6位数字
];
```

## 🛡️ 安全机制

### 1. 哈希加密流程
```javascript
// 加密流程
function generateIdentityHash(identityA, identityB) {
    const salt = 'college_employment_survey_2024';
    const combinedKey = `${identityA}:${identityB}:${salt}`;
    
    // 使用SHA-256进行哈希
    const hash = crypto.subtle.digest('SHA-256', 
        new TextEncoder().encode(combinedKey)
    );
    
    return hash;
}
```

### 2. UUID生成机制
```javascript
// UUID生成
function generateUUID(identityA, identityB) {
    const identityAHash = generateHash(identityA);
    const identityBHash = generateHash(identityB);
    const combinedKey = `${identityAHash}:${identityBHash}`;
    
    // 检查是否已存在
    const existingUUID = getStoredUUID(combinedKey);
    if (existingUUID) {
        return { uuid: existingUUID, isNew: false };
    }
    
    // 生成新UUID
    const uuid = crypto.randomUUID();
    storeUUID(combinedKey, uuid);
    
    return { uuid, isNew: true };
}
```

### 3. 身份验证流程
```javascript
// 验证流程
async function verifyIdentity(identityA, identityB) {
    // 1. 格式验证
    if (!validateABFormat(identityA, identityB)) {
        return { valid: false, error: '格式错误' };
    }
    
    // 2. 生成哈希
    const hash = generateIdentityHash(identityA, identityB);
    
    // 3. 查找UUID
    const uuid = await findUUIDByHash(hash);
    
    // 4. 返回验证结果
    return { 
        valid: !!uuid, 
        uuid,
        isNewUser: !uuid 
    };
}
```

## 💾 数据存储结构

### 1. 本地存储
```javascript
// localStorage 存储结构
{
    "identity_a": "encrypted_hash",           // A值哈希（不存储原值）
    "identity_b": "encrypted_hash",           // B值哈希（不存储原值）
    "auth_type": "anonymous",                 // 认证类型
    "auth_time": "2025-01-27T10:00:00Z",     // 认证时间
    "uuid": "550e8400-e29b-41d4-a716-446655440000", // 用户UUID
    "session_token": "anonymous_token_xxx"    // 会话令牌
}
```

### 2. 服务端存储
```sql
-- UUID映射表
CREATE TABLE uuid_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    identity_a_hash TEXT NOT NULL,
    identity_b_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TIMESTAMP,
    verification_count INTEGER DEFAULT 0
);

-- 用户内容表
CREATE TABLE user_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL,
    content_type TEXT NOT NULL, -- 'story', 'questionnaire', 'voice'
    content_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uuid) REFERENCES uuid_mappings(uuid)
);
```

## 🎨 UI组件设计

### 1. A+B登录模态框
- **触发方式**: 点击"半匿名登录"按钮
- **输入字段**: A值输入框（11位数字）+ B值输入框（4/6位数字）
- **验证提示**: 实时格式验证和错误提示
- **密码显示**: B值支持显示/隐藏切换
- **帮助信息**: 详细的使用说明和示例

### 2. 内联身份输入组件
- **可选启用**: 复选框控制是否启用匿名身份
- **折叠展开**: 启用后展开输入区域
- **格式提示**: 输入框占位符和格式说明
- **验证状态**: 实时显示验证状态

## 🔧 特殊交互逻辑

### 1. 身份冲突处理
```javascript
// 身份冲突检测
function checkIdentityConflict(newIdentityType) {
    const currentIdentity = getCurrentIdentity();
    
    if (currentIdentity && currentIdentity.type !== newIdentityType) {
        return {
            needConfirm: true,
            message: `检测到您已以${currentIdentity.type}身份登录，切换到${newIdentityType}身份将清除当前登录状态。是否继续？`
        };
    }
    
    return { needConfirm: false };
}
```

### 2. 自动填充和记忆
```javascript
// 记住上次输入（仅在用户同意的情况下）
function rememberLastInput(identityA, identityB, remember) {
    if (remember) {
        // 只存储哈希值，不存储原始值
        const hashedA = generateHash(identityA);
        const hashedB = generateHash(identityB);
        
        localStorage.setItem('last_identity_hash', JSON.stringify({
            a: hashedA,
            b: hashedB,
            timestamp: Date.now()
        }));
    }
}
```

### 3. 内容关联管理
```javascript
// 获取用户内容
async function getUserContent(identityA, identityB) {
    const uuid = await generateUUID(identityA, identityB);
    
    return {
        stories: await getStoriesByUUID(uuid),
        questionnaires: await getQuestionnairesByUUID(uuid),
        voices: await getVoicesByUUID(uuid)
    };
}
```

## 🚀 快速使用

### 1. 基础集成
```html
<!-- 引入样式和脚本 -->
<link rel="stylesheet" href="components/ABLoginModal.css">
<script src="services/anonymousAuthService.js"></script>
<script src="components/ABLoginModal.js"></script>

<!-- 触发按钮 -->
<button onclick="showABLoginModal()">半匿名登录</button>

<!-- 模态框容器 -->
<div id="ab-login-modal"></div>
```

### 2. 模态框使用
```javascript
// 显示A+B登录模态框
function showABLoginModal() {
    const modal = new ABLoginModal({
        title: "半匿名身份验证",
        description: "请输入您的A+B组合以验证身份",
        onSuccess: (result) => {
            console.log('登录成功:', result);
            // 处理登录成功逻辑
        },
        onError: (error) => {
            console.error('登录失败:', error);
            // 处理登录失败逻辑
        }
    });
    
    modal.show();
}
```

### 3. 内联组件使用
```javascript
// 创建内联身份输入组件
const identityInput = new AnonymousIdentityInput({
    container: '#identity-input-container',
    onIdentityChange: (identityA, identityB, enabled) => {
        if (enabled && identityA && identityB) {
            console.log('身份信息已输入:', { identityA, identityB });
        }
    }
});
```

## 📝 API接口

### 1. 身份验证接口
```javascript
/**
 * A+B身份验证
 * @param {string} identityA - A值（11位数字）
 * @param {string} identityB - B值（4或6位数字）
 * @returns {Promise<Object>} 验证结果
 */
async function verifyABIdentity(identityA, identityB) {
    const response = await fetch('/api/anonymous-auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityA, identityB })
    });
    
    return response.json();
}
```

### 2. UUID生成接口
```javascript
/**
 * 生成或获取UUID
 * @param {string} identityA - A值
 * @param {string} identityB - B值
 * @returns {Promise<Object>} UUID结果
 */
async function generateOrGetUUID(identityA, identityB) {
    const response = await fetch('/api/uuid/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityA, identityB })
    });
    
    return response.json();
}
```

### 3. 内容管理接口
```javascript
/**
 * 获取用户内容
 * @param {string} identityA - A值
 * @param {string} identityB - B值
 * @returns {Promise<Object>} 用户内容
 */
async function getUserContents(identityA, identityB) {
    const response = await fetch(`/api/anonymous-auth/my-content`, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'X-Identity-A': btoa(identityA),
            'X-Identity-B': btoa(identityB)
        }
    });
    
    return response.json();
}
```

## 🎨 样式定制

### CSS变量
```css
:root {
    --ab-primary-color: #3b82f6;
    --ab-success-color: #10b981;
    --ab-error-color: #ef4444;
    --ab-warning-color: #f59e0b;
    --ab-border-radius: 0.5rem;
    --ab-box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --ab-transition: all 0.15s ease-in-out;
}
```

### 主题定制
```css
.ab-login-modal {
    --modal-background: var(--ab-modal-bg, white);
    --modal-border: var(--ab-modal-border, #e5e7eb);
    --input-focus-color: var(--ab-primary-color);
}

.ab-input-group {
    --input-border: var(--ab-input-border, #d1d5db);
    --input-focus-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

## 🧪 测试用例

### 1. 格式验证测试
```javascript
// 测试A值格式验证
const testAValues = [
    { value: '13812345678', expected: true },   // 有效：11位数字
    { value: '1381234567', expected: false },   // 无效：10位数字
    { value: '138123456789', expected: false }, // 无效：12位数字
    { value: '1381234567a', expected: false },  // 无效：包含字母
];

// 测试B值格式验证
const testBValues = [
    { value: '1234', expected: true },     // 有效：4位数字
    { value: '123456', expected: true },   // 有效：6位数字
    { value: '123', expected: false },     // 无效：3位数字
    { value: '12345', expected: false },   // 无效：5位数字
    { value: '1234567', expected: false }, // 无效：7位数字
    { value: '123a', expected: false },    // 无效：包含字母
];
```

### 2. 加密测试
```javascript
// 测试哈希一致性
function testHashConsistency() {
    const identityA = '13812345678';
    const identityB = '1234';
    
    const hash1 = generateIdentityHash(identityA, identityB);
    const hash2 = generateIdentityHash(identityA, identityB);
    
    console.assert(hash1 === hash2, '相同输入应产生相同哈希');
}
```

## 🔍 调试和监控

### 调试模式
```javascript
// 启用调试模式
window.AB_LOGIN_DEBUG = true;

// 查看调试信息
console.log('A+B登录调试信息:', {
    currentIdentity: getCurrentIdentity(),
    storedHashes: getStoredHashes(),
    validationRules: getValidationRules()
});
```

### 监控指标
- **登录成功率**: 成功验证的A+B组合比例
- **格式错误率**: 输入格式错误的比例
- **重复登录率**: 相同A+B组合的重复登录次数
- **会话时长**: 用户会话的平均持续时间

## 📚 最佳实践

### 1. 安全建议
- 永远不要在客户端存储原始A+B值
- 使用HTTPS传输所有敏感数据
- 定期更新加密算法和盐值
- 实施适当的速率限制

### 2. 用户体验
- 提供清晰的格式说明和示例
- 实时验证用户输入
- 友好的错误提示信息
- 支持记住上次输入（可选）

### 3. 性能优化
- 客户端缓存验证结果
- 异步处理加密操作
- 优化网络请求次数
- 使用防抖处理用户输入

## 📄 许可证

本项目遵循 MIT 许可证。
