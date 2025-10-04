// 数据源调试脚本
console.log('🔍 调试数据源配置...');

// 检查环境变量
console.log('Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- VITE_DATA_SOURCE:', process.env.VITE_DATA_SOURCE);
console.log('- import.meta.env.DEV:', typeof window !== 'undefined' ? 'browser' : 'node');

// 模拟配置检查
const DATA_SOURCE_CONFIG = {
  CURRENT_SOURCE: 'mock',
  FORCE_MOCK_IN_DEV: true,
};

function getCurrentDataSource() {
  // 开发模式下强制使用模拟数据
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && DATA_SOURCE_CONFIG.FORCE_MOCK_IN_DEV) {
    return 'mock';
  }
  
  // 检查环境变量
  const envDataSource = process.env.VITE_DATA_SOURCE;
  if (envDataSource && ['mock', 'api'].includes(envDataSource)) {
    return envDataSource;
  }
  
  return DATA_SOURCE_CONFIG.CURRENT_SOURCE;
}

function useMockData() {
  return getCurrentDataSource() === 'mock';
}

console.log('📊 数据源配置结果:');
console.log('- getCurrentDataSource():', getCurrentDataSource());
console.log('- useMockData():', useMockData());
console.log('- FORCE_MOCK_IN_DEV:', DATA_SOURCE_CONFIG.FORCE_MOCK_IN_DEV);
