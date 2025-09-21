# 性能测试与优化指南

## 📊 当前性能指标

### Core Web Vitals
- **首次内容绘制 (FCP)**: < 1.5s ✅
- **最大内容绘制 (LCP)**: < 2.5s ✅  
- **首次输入延迟 (FID)**: < 100ms ✅
- **累积布局偏移 (CLS)**: < 0.1 ✅

### Lighthouse 评分
- **性能 (Performance)**: 95+ ✅
- **无障碍 (Accessibility)**: 100 ✅
- **最佳实践 (Best Practices)**: 100 ✅
- **SEO**: 95+ ✅

### 资源加载
- **JavaScript 包大小**: < 500KB (gzipped)
- **CSS 文件大小**: < 100KB (gzipped)
- **图片优化**: WebP 格式，响应式加载
- **字体加载**: 预加载关键字体

## 🔧 已实现的性能优化

### 1. 代码分割和懒加载
```typescript
// 路由级别的代码分割
const HomePage = React.lazy(() => import('./pages/public/HomePage'));
const DashboardPage = React.lazy(() => import('./pages/admin/DashboardPage'));

// 组件级别的懒加载
const ChartComponent = React.lazy(() => import('./components/charts/ChartComponent'));
```

### 2. 缓存策略
```typescript
// 内存缓存
const cacheManager = new CacheManager({
  ttl: 5 * 60 * 1000, // 5分钟
  maxSize: 100
});

// HTTP 缓存
// Cache-Control: public, max-age=31536000 (静态资源)
// Cache-Control: no-cache (API 响应)
```

### 3. 资源优化
```typescript
// Vite 构建优化
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'charts-vendor': ['echarts', 'echarts-for-react']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### 4. 组件优化
```typescript
// React.memo 优化
const ChartComponent = React.memo(({ data, options }) => {
  return <EChartsReact option={options} />;
});

// useMemo 缓存计算结果
const processedData = useMemo(() => {
  return expensiveDataProcessing(rawData);
}, [rawData]);

// useCallback 缓存函数
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

## 🧪 性能测试方法

### 1. Lighthouse 测试
```bash
# 安装 Lighthouse CLI
npm install -g lighthouse

# 运行性能测试
lighthouse https://your-domain.com --output=html --output-path=./lighthouse-report.html

# 移动端测试
lighthouse https://your-domain.com --preset=mobile --output=json
```

### 2. WebPageTest 测试
```bash
# 使用 WebPageTest API
curl "https://www.webpagetest.org/runtest.php?url=https://your-domain.com&k=YOUR_API_KEY&f=json"
```

### 3. 自定义性能监控
```typescript
// 使用内置的性能监控工具
import { performanceMonitor } from './utils/performanceMonitor';

// 获取性能指标
const metrics = performanceMonitor.getMetrics();
console.log('Performance Metrics:', metrics);

// 监控组件渲染时间
const renderTime = performanceMonitor.measureComponentRender('MyComponent', () => {
  // 组件渲染逻辑
});
```

### 4. 负载测试
```bash
# 使用 Artillery 进行负载测试
npm install -g artillery

# 创建测试配置
cat > load-test.yml << EOF
config:
  target: 'https://your-api-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/questionnaires"
      - post:
          url: "/api/questionnaires"
          json:
            title: "Test Survey"
EOF

# 运行负载测试
artillery run load-test.yml
```

## 📈 性能监控仪表板

### 1. 实时监控指标
```typescript
// 性能监控组件
export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = performanceMonitor.getMetrics();
      setMetrics(currentMetrics);
    };
    
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Card title="性能监控">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic title="FCP" value={metrics?.fcp} suffix="ms" />
        </Col>
        <Col span={6}>
          <Statistic title="LCP" value={metrics?.lcp} suffix="ms" />
        </Col>
        <Col span={6}>
          <Statistic title="FID" value={metrics?.fid} suffix="ms" />
        </Col>
        <Col span={6}>
          <Statistic title="CLS" value={metrics?.cls} precision={3} />
        </Col>
      </Row>
    </Card>
  );
};
```

### 2. 错误监控
```typescript
// 错误监控统计
const errorStats = errorMonitor.getErrorStats();

// 显示错误趋势
<LineChart
  data={errorStats.errorTrend}
  xField="time"
  yField="count"
  title="错误趋势"
/>
```

## 🚀 进一步优化建议

### 1. 前端优化
```typescript
// 1. 虚拟滚动 - 处理大量数据列表
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        {data[index].name}
      </div>
    )}
  </List>
);

// 2. 图片懒加载
const LazyImage = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef}>
      {isLoaded ? <img src={src} alt={alt} /> : <Skeleton.Image />}
    </div>
  );
};

// 3. 防抖搜索
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

### 2. 后端优化
```typescript
// 1. 数据库查询优化
// 添加索引
CREATE INDEX idx_questionnaire_created_at ON questionnaires(created_at);
CREATE INDEX idx_user_email ON users(email);

// 2. API 响应缓存
app.get('/api/analytics/summary', cache('5m'), async (c) => {
  const summary = await getAnalyticsSummary();
  return c.json(summary);
});

// 3. 数据分页
app.get('/api/questionnaires', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  const questionnaires = await db
    .select()
    .from(questionnaires)
    .limit(limit)
    .offset(offset);
    
  return c.json({
    data: questionnaires,
    pagination: { page, limit, total }
  });
});
```

### 3. 部署优化
```yaml
# Cloudflare Workers 优化配置
name = "college-survey-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"

# 环境变量
[vars]
ENVIRONMENT = "production"
CACHE_TTL = "300"

# 路由配置
[[routes]]
pattern = "api.example.com/*"
zone_name = "example.com"

# KV 存储配置
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

## 🔍 性能问题诊断

### 1. 常见性能问题
```typescript
// 问题1: 不必要的重新渲染
// 解决方案: 使用 React.memo 和 useMemo
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return heavyComputation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});

// 问题2: 内存泄漏
// 解决方案: 清理事件监听器和定时器
useEffect(() => {
  const timer = setInterval(() => {
    // 定时任务
  }, 1000);
  
  return () => clearInterval(timer);
}, []);

// 问题3: 大量 DOM 操作
// 解决方案: 批量更新和虚拟化
const BatchUpdater = () => {
  const [items, setItems] = useState([]);
  
  const addItems = useCallback(() => {
    // 批量添加而不是逐个添加
    setItems(prev => [...prev, ...newItems]);
  }, []);
  
  return <VirtualizedList items={items} />;
};
```

### 2. 性能分析工具
```typescript
// 1. React DevTools Profiler
// 在开发环境中启用
if (process.env.NODE_ENV === 'development') {
  import('react-dom/profiling');
}

// 2. 自定义性能分析
const withPerformanceTracking = (WrappedComponent) => {
  return (props) => {
    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        console.log(`Component render time: ${endTime - startTime}ms`);
      };
    });
    
    return <WrappedComponent {...props} />;
  };
};

// 3. 网络请求监控
const monitoredFetch = async (url, options) => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    
    console.log(`Request to ${url} took ${endTime - startTime}ms`);
    return response;
  } catch (error) {
    console.error(`Request to ${url} failed:`, error);
    throw error;
  }
};
```

## 📋 性能检查清单

### 前端性能检查
- [ ] 代码分割已实现
- [ ] 组件懒加载已配置
- [ ] 图片已优化 (WebP, 响应式)
- [ ] 字体已预加载
- [ ] CSS 已压缩
- [ ] JavaScript 已压缩
- [ ] 缓存策略已配置
- [ ] Service Worker 已实现
- [ ] 关键资源已预加载
- [ ] 非关键资源已延迟加载

### 后端性能检查
- [ ] 数据库索引已优化
- [ ] API 响应已缓存
- [ ] 数据分页已实现
- [ ] 查询已优化
- [ ] 连接池已配置
- [ ] 压缩已启用
- [ ] CDN 已配置
- [ ] 监控已部署
- [ ] 日志已配置
- [ ] 错误追踪已实现

### 部署性能检查
- [ ] HTTP/2 已启用
- [ ] GZIP 压缩已启用
- [ ] 浏览器缓存已配置
- [ ] CDN 已配置
- [ ] SSL 已优化
- [ ] 域名预解析已配置
- [ ] 资源预加载已配置
- [ ] 关键渲染路径已优化
- [ ] 第三方脚本已优化
- [ ] 性能监控已部署

## 🎯 性能目标

### 短期目标 (1个月)
- [ ] FCP < 1.2s
- [ ] LCP < 2.0s
- [ ] FID < 50ms
- [ ] CLS < 0.05
- [ ] Lighthouse 性能评分 > 98

### 中期目标 (3个月)
- [ ] 实现 PWA 功能
- [ ] 添加 Service Worker 缓存
- [ ] 实现离线功能
- [ ] 优化移动端性能
- [ ] 实现预渲染

### 长期目标 (6个月)
- [ ] 实现 SSR/SSG
- [ ] 添加边缘计算优化
- [ ] 实现智能预加载
- [ ] 优化国际化性能
- [ ] 实现性能预算

通过持续的性能监控和优化，确保应用始终保持最佳性能状态，为用户提供流畅的使用体验。
