# Cloudflare Turnstile 完整设置指南

## 🎯 **设置概述**

您需要先在Cloudflare控制台创建Turnstile widget，然后才能在项目中使用。以下是完整的设置流程：

## 📋 **第一步: 创建Turnstile Widget**

### **1. 访问Cloudflare Turnstile**
- 登录 Cloudflare 控制台
- 在左侧菜单中找到 "Turnstile" 
- 或直接访问: `https://dash.cloudflare.com/[your-account-id]/turnstile`

### **2. 创建Widget**
点击 "Add widget" 按钮，填写以下信息：

```
Widget名称: College Employment Survey Protection

域名配置:
✅ college-employment-survey-frontend-l84.pages.dev  (生产环境)
✅ localhost:5173                                    (开发环境)  
✅ localhost:3000                                    (备用开发端口)
✅ *.pages.dev                                       (通配符，适用于所有Pages部署)

Widget模式: Managed (推荐，自动调整验证强度)

预挑战: 启用 (提升安全性)
```

### **3. 获取密钥**
创建完成后，您会获得：
- **Site Key**: `0x4AAAAAAA...` (公开密钥，用于前端)
- **Secret Key**: `0x4AAAAAAA...` (私密密钥，用于后端验证)

## 🔑 **第二步: 配置环境变量**

### **前端环境变量**
```bash
# frontend/.env.local
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA... # 从Cloudflare获取的Site Key

# 开发环境可选配置
VITE_TURNSTILE_ENABLED=true
VITE_ENVIRONMENT=development
```

### **后端环境变量**
```bash
# backend/.env 或 Cloudflare Workers 环境变量
TURNSTILE_SECRET_KEY=0x4AAAAAAA... # 从Cloudflare获取的Secret Key

# Cloudflare Workers 中设置
# 在 wrangler.toml 中添加:
[env.production.vars]
TURNSTILE_SECRET_KEY = "0x4AAAAAAA..."

[env.development.vars]  
TURNSTILE_SECRET_KEY = "0x4AAAAAAA..."
```

## 🛠️ **第三步: 更新项目配置**

### **1. 更新前端组件**
```typescript
// frontend/src/components/common/TurnstileVerification.tsx
export const TurnstileVerification: React.FC<TurnstileProps> = ({
  siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY, // 使用环境变量
  // ... 其他props
}) => {
  // 检查是否配置了Site Key
  if (!siteKey) {
    console.warn('Turnstile Site Key 未配置');
    return (
      <Alert 
        message="配置错误" 
        description="Turnstile Site Key 未配置，请检查环境变量" 
        type="warning" 
      />
    );
  }

  // ... 组件逻辑
};
```

### **2. 更新问卷组件**
```typescript
// frontend/src/components/questionnaire/QuestionnaireSubmissionForm.tsx
import { TurnstileVerification } from '../common/TurnstileVerification';

export const QuestionnaireSubmissionForm: React.FC = () => {
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  // 检查是否启用Turnstile
  const isTurnstileEnabled = import.meta.env.VITE_TURNSTILE_ENABLED !== 'false' && siteKey;

  const handleSubmit = async (formData: any) => {
    // 如果启用了Turnstile但没有token，阻止提交
    if (isTurnstileEnabled && !turnstileToken) {
      message.error('请完成人机验证');
      return;
    }

    const submitData = {
      ...formData,
      ...(isTurnstileEnabled && { turnstileToken })
    };

    // 提交逻辑...
  };

  return (
    <Form onFinish={handleSubmit}>
      {/* 问卷表单内容 */}
      
      {/* 条件渲染Turnstile */}
      {isTurnstileEnabled && (
        <Form.Item label="安全验证">
          <TurnstileVerification
            siteKey={siteKey}
            onSuccess={setTurnstileToken}
            onError={(error) => message.error(`验证失败: ${error}`)}
            action="questionnaire-submit"
          />
        </Form.Item>
      )}

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit"
          disabled={isTurnstileEnabled && !turnstileToken}
        >
          提交问卷
        </Button>
      </Form.Item>
    </Form>
  );
};
```

### **3. 更新后端验证**
```typescript
// backend/src/services/turnstileService.ts
export class TurnstileService {
  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.TURNSTILE_SECRET_KEY;
    
    if (!this.secretKey) {
      console.warn('Turnstile Secret Key 未配置');
    }
  }

  async verifyToken(token: string, options: TurnstileVerificationOptions = {}): Promise<TurnstileVerificationResult> {
    // 如果没有配置Secret Key，跳过验证（开发环境）
    if (!this.secretKey) {
      console.warn('Turnstile验证跳过: Secret Key未配置');
      return { success: true };
    }

    // 正常验证逻辑...
  }
}
```

## 🚀 **第四步: 部署和测试**

### **1. 部署到Cloudflare**
```bash
# 前端部署
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=college-employment-survey-frontend

# 后端部署  
cd backend
npm run deploy
```

### **2. 设置Cloudflare Workers环境变量**
```bash
# 设置生产环境变量
npx wrangler secret put TURNSTILE_SECRET_KEY --env production

# 设置开发环境变量
npx wrangler secret put TURNSTILE_SECRET_KEY --env development
```

### **3. 测试验证**
1. **开发环境测试**:
   - 访问 `http://localhost:5173/questionnaire`
   - 检查Turnstile组件是否正常加载
   - 提交问卷测试验证流程

2. **生产环境测试**:
   - 访问 `https://college-employment-survey-frontend-l84.pages.dev/questionnaire`
   - 确认Turnstile在生产环境正常工作

## 🔧 **第五步: 开关系统集成**

### **1. 环境感知配置**
```typescript
// 根据环境自动调整Turnstile配置
const getTurnstileConfig = () => {
  const environment = import.meta.env.MODE;
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  
  return {
    enabled: !!siteKey && import.meta.env.VITE_TURNSTILE_ENABLED !== 'false',
    siteKey,
    theme: environment === 'development' ? 'light' : 'auto',
    size: 'normal',
    // 开发环境使用测试模式
    action: environment === 'development' ? 'test' : 'questionnaire-submit'
  };
};
```

### **2. 管理员控制面板**
在超级管理员页面添加Turnstile状态监控：

```typescript
// 显示Turnstile配置状态
const TurnstileStatus = () => {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    // 检查Turnstile配置状态
    const checkStatus = async () => {
      const response = await fetch('/api/admin/turnstile/status');
      const result = await response.json();
      setStatus(result.data);
    };
    
    checkStatus();
  }, []);

  return (
    <Card title="Turnstile状态">
      <Descriptions column={2}>
        <Descriptions.Item label="配置状态">
          <Tag color={status?.configured ? 'green' : 'red'}>
            {status?.configured ? '已配置' : '未配置'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="验证次数">
          {status?.verificationCount || 0}
        </Descriptions.Item>
        <Descriptions.Item label="成功率">
          {status?.successRate || 0}%
        </Descriptions.Item>
        <Descriptions.Item label="最后验证">
          {status?.lastVerification || '无'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};
```

## ⚠️ **注意事项**

### **域名配置**
- 确保在Turnstile widget中添加了所有需要的域名
- 开发环境需要添加 `localhost:5173`
- 生产环境需要添加实际的Pages域名
- 可以使用通配符 `*.pages.dev` 覆盖所有Pages部署

### **密钥安全**
- Site Key 可以公开，包含在前端代码中
- Secret Key 必须保密，只能在后端使用
- 使用Cloudflare Workers的环境变量存储Secret Key

### **开发调试**
- 开发环境可以通过环境变量禁用Turnstile
- 提供降级方案，当Turnstile不可用时不影响核心功能
- 在管理员面板提供开关控制

## 🎯 **下一步**

1. **立即行动**: 在Cloudflare控制台创建Turnstile widget
2. **获取密钥**: 复制Site Key和Secret Key
3. **配置环境**: 设置前端和后端环境变量
4. **测试验证**: 在开发和生产环境测试功能
5. **监控调优**: 通过管理员面板监控和调整配置

**创建widget后，请将Site Key和Secret Key提供给我，我可以帮您完成具体的集成配置！**
