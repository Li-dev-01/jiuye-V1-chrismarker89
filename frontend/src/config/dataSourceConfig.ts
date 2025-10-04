/**
 * 数据源配置文件
 * 控制可视化系统使用模拟数据还是真实API
 */

// 数据源类型
export type DataSourceType = 'mock' | 'api';

// 数据源配置
export const DATA_SOURCE_CONFIG = {
  // 当前数据源类型
  // 'mock' - 使用模拟数据（开发和演示阶段）
  // 'api' - 使用真实API数据（生产阶段）
  CURRENT_SOURCE: 'api' as DataSourceType,  // ✅ 已切换到真实API

  // 开发模式下强制使用模拟数据 - 已禁用，使用真实API
  FORCE_MOCK_IN_DEV: false,  // ✅ 已禁用，允许开发环境使用真实API
  
  // 数据源切换提示
  SHOW_DATA_SOURCE_INDICATOR: true,
  
  // 模拟数据配置
  MOCK_CONFIG: {
    // 模拟网络延迟（毫秒）
    NETWORK_DELAY: {
      MIN: 200,
      MAX: 800
    },
    
    // 模拟数据更新频率（毫秒）
    UPDATE_INTERVAL: 30000,
    
    // 模拟错误率（0-1）
    ERROR_RATE: 0.02
  },
  
  // API配置
  API_CONFIG: {
    // 请求超时时间（毫秒）
    TIMEOUT: 10000,
    
    // 重试次数
    RETRY_ATTEMPTS: 3,
    
    // 缓存时间（毫秒）
    CACHE_TTL: 5 * 60 * 1000
  }
};

// 获取当前数据源类型
export const getCurrentDataSource = (): DataSourceType => {
  // 开发模式下强制使用模拟数据
  if (import.meta.env.DEV && DATA_SOURCE_CONFIG.FORCE_MOCK_IN_DEV) {
    return 'mock';
  }
  
  // 检查环境变量
  const envDataSource = import.meta.env.VITE_DATA_SOURCE as DataSourceType;
  if (envDataSource && ['mock', 'api'].includes(envDataSource)) {
    return envDataSource;
  }
  
  return DATA_SOURCE_CONFIG.CURRENT_SOURCE;
};

// 是否使用模拟数据
export const useMockData = (): boolean => {
  return getCurrentDataSource() === 'mock';
};

// 获取数据源显示名称
export const getDataSourceDisplayName = (): string => {
  const source = getCurrentDataSource();
  return source === 'mock' ? '模拟数据' : '真实数据';
};

// 获取数据源颜色标识
export const getDataSourceColor = (): string => {
  const source = getCurrentDataSource();
  return source === 'mock' ? 'orange' : 'green';
};

// 获取数据源描述
export const getDataSourceDescription = (): string => {
  const source = getCurrentDataSource();
  return source === 'mock' 
    ? '当前使用模拟数据进行演示，待问卷数据收集完成后将自动切换为真实数据分析'
    : '当前使用真实问卷数据进行分析，数据来源于实际用户填写的问卷';
};

// 数据源切换函数（仅开发环境）
export const switchDataSource = (source: DataSourceType): void => {
  if (import.meta.env.DEV) {
    // 在开发环境中，可以通过localStorage临时切换数据源
    localStorage.setItem('dev_data_source', source);
    window.location.reload();
  } else {
    console.warn('数据源切换仅在开发环境中可用');
  }
};

// 从localStorage获取开发环境数据源设置
export const getDevDataSource = (): DataSourceType | null => {
  if (import.meta.env.DEV) {
    const stored = localStorage.getItem('dev_data_source') as DataSourceType;
    return stored && ['mock', 'api'].includes(stored) ? stored : null;
  }
  return null;
};

// 数据源状态信息
export interface DataSourceStatus {
  type: DataSourceType;
  displayName: string;
  color: string;
  description: string;
  isProduction: boolean;
  canSwitch: boolean;
}

// 获取数据源状态
export const getDataSourceStatus = (): DataSourceStatus => {
  const type = getCurrentDataSource();
  const devSource = getDevDataSource();
  
  return {
    type: devSource || type,
    displayName: getDataSourceDisplayName(),
    color: getDataSourceColor(),
    description: getDataSourceDescription(),
    isProduction: !import.meta.env.DEV,
    canSwitch: import.meta.env.DEV
  };
};

// 数据质量指标（模拟数据专用）
export const MOCK_DATA_QUALITY = {
  completeness: 95.8,
  accuracy: 92.3,
  consistency: 89.7,
  timeliness: 98.1,
  validity: 94.5
};

// 模拟数据统计信息
export const MOCK_DATA_STATS = {
  totalQuestions: 45,
  totalResponses: 1247,
  completionRate: 89.3,
  averageTime: 12.5, // 分钟
  dataSize: '2.3MB',
  lastUpdate: new Date().toISOString()
};

// 数据源配置验证
export const validateDataSourceConfig = (): boolean => {
  try {
    const source = getCurrentDataSource();
    const isValid = ['mock', 'api'].includes(source);
    
    if (!isValid) {
      console.error(`Invalid data source: ${source}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Data source configuration validation failed:', error);
    return false;
  }
};

// 初始化数据源配置
export const initializeDataSource = (): void => {
  const isValid = validateDataSourceConfig();
  
  if (!isValid) {
    console.warn('Data source configuration is invalid, falling back to mock data');
    DATA_SOURCE_CONFIG.CURRENT_SOURCE = 'mock';
  }
  
  const status = getDataSourceStatus();
  console.log(`📊 Data Source Initialized:`, {
    type: status.type,
    displayName: status.displayName,
    isProduction: status.isProduction,
    canSwitch: status.canSwitch
  });
};

// 导出默认配置
export default DATA_SOURCE_CONFIG;
