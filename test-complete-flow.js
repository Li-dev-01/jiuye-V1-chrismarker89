// 完整的第二问卷流程测试
// 在浏览器控制台中运行

console.log('🎯 开始完整的第二问卷流程测试...');

// 检查环境配置
function checkEnvironment() {
    console.log('='.repeat(50));
    console.log('1️⃣ 检查环境配置');
    
    console.log('📊 环境变量:');
    console.log('- VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('- DEV模式:', import.meta.env.DEV);
    console.log('- 当前页面:', window.location.href);
    
    // 计算API基础URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.DEV ? 'http://localhost:53389' : 'https://employment-survey-api-prod.chrismarker89.workers.dev');
    
    console.log('📊 计算出的API基础URL:', apiBaseUrl);
    
    return apiBaseUrl;
}

// 测试API连接
async function testApiConnection(apiBaseUrl) {
    console.log('='.repeat(50));
    console.log('2️⃣ 测试API连接');
    
    try {
        const response = await fetch(`${apiBaseUrl}/api/universal-questionnaire/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questionnaireId: 'employment-survey-2024',
                sectionResponses: [{
                    sectionId: 'test',
                    questionResponses: [{ questionId: 'test', value: 'test' }]
                }],
                metadata: {
                    participantGroup: 'freshGraduate',
                    startedAt: new Date().toISOString(),
                    responseTimeSeconds: 1,
                    userAgent: 'Test'
                }
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ API连接正常，响应:', result);
            return true;
        } else {
            console.log('❌ API响应错误:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.log('❌ API连接失败:', error.message);
        return false;
    }
}

// 检查页面状态
function checkPageState() {
    console.log('='.repeat(50));
    console.log('3️⃣ 检查页面状态');
    
    const container = document.querySelector('.second-questionnaire-container');
    console.log('📊 问卷容器:', container ? '存在' : '不存在');
    
    const currentQuestion = document.querySelector('[class*="question"]');
    if (currentQuestion) {
        console.log('📊 当前问题:', currentQuestion.textContent.substring(0, 50) + '...');
    }
    
    const options = document.querySelectorAll('[class*="tagOption"]');
    console.log('📊 选项数量:', options.length);
    
    const nextButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('下一题') || btn.textContent.includes('完成')
    );
    console.log('📊 下一题按钮:', nextButton ? '存在' : '不存在');
    
    if (nextButton) {
        console.log('📊 按钮状态:', nextButton.disabled ? '禁用' : '启用');
        console.log('📊 按钮文本:', nextButton.textContent);
    }
    
    return { container, currentQuestion, options, nextButton };
}

// 模拟问卷填写
function simulateQuestionnaireFlow() {
    console.log('='.repeat(50));
    console.log('4️⃣ 模拟问卷填写流程');
    
    const pageState = checkPageState();
    
    if (!pageState.container) {
        console.log('❌ 问卷容器不存在，无法继续测试');
        return;
    }
    
    if (pageState.options.length > 0) {
        console.log('🖱️ 模拟选择第一个选项...');
        pageState.options[0].click();
        
        setTimeout(() => {
            console.log('⏱️ 等待1秒后检查状态...');
            
            const newPageState = checkPageState();
            
            // 检查是否是多选题
            const selectedOptions = document.querySelectorAll('[class*="tagOption"][class*="selected"]');
            console.log('📊 已选择选项数量:', selectedOptions.length);
            
            if (newPageState.options.length > 1 && selectedOptions.length === 1) {
                console.log('🖱️ 尝试选择第二个选项（测试多选）...');
                newPageState.options[1].click();
                
                setTimeout(() => {
                    const finalSelectedOptions = document.querySelectorAll('[class*="tagOption"][class*="selected"]');
                    console.log('📊 最终选择选项数量:', finalSelectedOptions.length);
                    
                    if (finalSelectedOptions.length > 1) {
                        console.log('✅ 多选功能正常');
                    } else {
                        console.log('ℹ️ 这是单选题');
                    }
                    
                    // 如果有下一题按钮，点击它
                    const nextBtn = Array.from(document.querySelectorAll('button')).find(btn => 
                        btn.textContent.includes('下一题') || btn.textContent.includes('完成')
                    );
                    
                    if (nextBtn && !nextBtn.disabled) {
                        console.log('🖱️ 点击下一题按钮...');
                        nextBtn.click();
                    }
                }, 500);
            }
        }, 1000);
    } else {
        console.log('❌ 没有找到可选择的选项');
    }
}

// 监听网络请求
function setupNetworkMonitoring() {
    console.log('='.repeat(50));
    console.log('5️⃣ 设置网络请求监听');
    
    // 监听fetch请求
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log('🌐 Fetch请求:', args[0]);
        
        const promise = originalFetch.apply(this, args);
        
        promise.then(response => {
            console.log('📡 响应状态:', response.status, response.statusText);
            if (!response.ok) {
                console.log('❌ 请求失败:', args[0]);
            }
        }).catch(error => {
            console.log('❌ 网络错误:', error.message);
        });
        
        return promise;
    };
    
    console.log('✅ 网络监听已启用');
}

// 主测试函数
async function runCompleteTest() {
    console.log('🚀 开始完整流程测试...');
    
    // 1. 检查环境
    const apiBaseUrl = checkEnvironment();
    
    // 2. 测试API连接
    const apiWorking = await testApiConnection(apiBaseUrl);
    
    if (!apiWorking) {
        console.log('❌ API连接失败，停止测试');
        return;
    }
    
    // 3. 设置网络监听
    setupNetworkMonitoring();
    
    // 4. 检查页面状态
    checkPageState();
    
    // 5. 模拟问卷流程
    simulateQuestionnaireFlow();
    
    console.log('='.repeat(50));
    console.log('🏁 测试设置完成');
    console.log('💡 现在可以手动完成问卷，观察控制台日志');
    console.log('💡 预期结果:');
    console.log('  - 单选题自动跳转');
    console.log('  - 多选题需要手动点击"下一题"');
    console.log('  - 最后显示防刷验证');
    console.log('  - 验证成功后跳转到故事墙');
}

// 导出函数
window.runCompleteTest = runCompleteTest;
window.checkEnvironment = checkEnvironment;
window.testApiConnection = testApiConnection;
window.checkPageState = checkPageState;

// 自动运行测试
runCompleteTest();

console.log('='.repeat(50));
console.log('💡 可用命令:');
console.log('- runCompleteTest() - 重新运行完整测试');
console.log('- checkEnvironment() - 检查环境配置');
console.log('- testApiConnection() - 测试API连接');
console.log('- checkPageState() - 检查页面状态');
