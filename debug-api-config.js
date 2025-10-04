// 调试API配置
// 在浏览器控制台中运行

console.log('🔍 调试API配置...');

// 检查环境变量
console.log('📊 环境变量:');
console.log('- import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('- import.meta.env.DEV:', import.meta.env.DEV);
console.log('- import.meta.env.PROD:', import.meta.env.PROD);
console.log('- import.meta.env.MODE:', import.meta.env.MODE);

// 检查当前页面URL
console.log('📊 当前页面:');
console.log('- window.location.origin:', window.location.origin);
console.log('- window.location.href:', window.location.href);

// 模拟API配置逻辑
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:53389' : 'https://employment-survey-api-prod.chrismarker89.workers.dev');

console.log('📊 计算出的API_BASE_URL:', API_BASE_URL);

// 检查axios实例配置
if (window.axios && window.axios.defaults) {
    console.log('📊 Axios默认配置:');
    console.log('- baseURL:', window.axios.defaults.baseURL);
    console.log('- timeout:', window.axios.defaults.timeout);
}

// 测试API请求
async function testApiRequest() {
    console.log('🧪 测试API请求...');
    
    try {
        // 直接测试本地API
        const localResponse = await fetch('http://localhost:53389/api/universal-questionnaire/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questionnaireId: 'test',
                sectionResponses: [{ sectionId: 'test', questionResponses: [] }],
                metadata: { participantGroup: 'test', startedAt: new Date().toISOString(), responseTimeSeconds: 1 }
            })
        });
        
        console.log('✅ 本地API响应状态:', localResponse.status);
        
        if (localResponse.ok) {
            const localResult = await localResponse.json();
            console.log('✅ 本地API响应:', localResult);
        }
        
    } catch (error) {
        console.log('❌ 本地API测试失败:', error.message);
    }
    
    try {
        // 测试生产API（应该失败）
        const prodResponse = await fetch('https://employment-survey-api-prod.chrismarker89.workers.dev/api/universal-questionnaire/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questionnaireId: 'test',
                sectionResponses: [{ sectionId: 'test', questionResponses: [] }],
                metadata: { participantGroup: 'test', startedAt: new Date().toISOString(), responseTimeSeconds: 1 }
            })
        });
        
        console.log('📊 生产API响应状态:', prodResponse.status);
        
    } catch (error) {
        console.log('❌ 生产API测试失败（预期）:', error.message);
    }
}

// 检查网络请求拦截
function checkNetworkRequests() {
    console.log('🔍 监听网络请求...');
    
    // 重写fetch以监听请求
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log('🌐 Fetch请求:', args[0]);
        return originalFetch.apply(this, args);
    };
    
    console.log('✅ 网络请求监听已启用');
}

// 运行所有检查
console.log('='.repeat(50));
testApiRequest();
checkNetworkRequests();

console.log('='.repeat(50));
console.log('💡 提示: 现在提交问卷，观察控制台中的网络请求日志');
