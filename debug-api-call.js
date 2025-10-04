// 调试前端API调用问题
// 在浏览器控制台中运行

console.log('🔍 开始调试前端API调用问题...');

// 检查环境变量
function checkEnvironment() {
    console.log('='.repeat(50));
    console.log('1️⃣ 检查环境变量');
    
    console.log('📊 import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('📊 import.meta.env.DEV:', import.meta.env.DEV);
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.DEV ? 'http://localhost:53389' : 'https://employment-survey-api-prod.chrismarker89.workers.dev');
    
    console.log('📊 计算出的baseUrl:', baseUrl);
    
    return baseUrl;
}

// 测试API调用
async function testApiCall() {
    console.log('='.repeat(50));
    console.log('2️⃣ 测试API调用');
    
    const baseUrl = checkEnvironment();
    const apiUrl = `${baseUrl}/api/universal-questionnaire/questionnaires/employment-survey-2024`;
    
    console.log('🌐 API URL:', apiUrl);
    
    try {
        console.log('📡 发送请求...');
        const response = await fetch(apiUrl);
        
        console.log('📊 响应状态:', response.status, response.statusText);
        console.log('📊 响应头:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API调用成功');
            console.log('📊 数据结构:', {
                success: data.success,
                dataType: typeof data.data,
                sectionsCount: data.data?.sections?.length,
                questionnaireId: data.data?.id
            });
            
            if (data.data?.sections) {
                console.log('📊 章节列表:');
                data.data.sections.forEach((section, index) => {
                    console.log(`  ${index + 1}. ${section.id} - ${section.title} (${section.questions?.length || 0} 问题)`);
                });
                
                // 检查经济类问题
                const economicQuestions = [];
                data.data.sections.forEach(section => {
                    section.questions?.forEach(question => {
                        if (question.id.includes('debt') || 
                            question.id.includes('salary') || 
                            question.id.includes('economic') ||
                            question.id.includes('financial') ||
                            question.id.includes('confidence')) {
                            economicQuestions.push({
                                sectionId: section.id,
                                questionId: question.id,
                                title: question.title
                            });
                        }
                    });
                });
                
                console.log('💰 找到的经济类问题:', economicQuestions.length);
                economicQuestions.forEach(q => {
                    console.log(`  - ${q.questionId}: ${q.title}`);
                });
            }
            
            return data;
        } else {
            console.log('❌ API调用失败:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('❌ 错误内容:', errorText);
            return null;
        }
    } catch (error) {
        console.log('❌ 网络错误:', error.message);
        console.log('❌ 错误详情:', error);
        return null;
    }
}

// 检查前端服务状态
function checkFrontendService() {
    console.log('='.repeat(50));
    console.log('3️⃣ 检查前端服务状态');
    
    console.log('📊 当前页面URL:', window.location.href);
    console.log('📊 页面协议:', window.location.protocol);
    console.log('📊 页面主机:', window.location.host);
    
    // 检查是否在开发环境
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    console.log('📊 是否开发环境:', isDev);
    
    // 检查端口
    const port = window.location.port;
    console.log('📊 前端端口:', port);
}

// 模拟SecondQuestionnaireService调用
async function simulateServiceCall() {
    console.log('='.repeat(50));
    console.log('4️⃣ 模拟SecondQuestionnaireService调用');
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.DEV ? 'http://localhost:53389' : 'https://employment-survey-api-prod.chrismarker89.workers.dev');
    
    console.log('🔧 使用baseUrl:', baseUrl);
    
    try {
        // 模拟axios调用
        const response = await fetch(`${baseUrl}/api/universal-questionnaire/questionnaires/employment-survey-2024`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ 模拟服务调用成功');
            console.log('📊 返回数据:', {
                id: result.data?.id,
                title: result.data?.title,
                sectionsCount: result.data?.sections?.length
            });
            
            return result.data;
        } else {
            console.log('❌ 模拟服务调用失败:', response.status);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.log('❌ 模拟服务调用异常:', error.message);
        throw error;
    }
}

// 检查页面中的问卷状态
function checkQuestionnaireState() {
    console.log('='.repeat(50));
    console.log('5️⃣ 检查页面中的问卷状态');
    
    // 检查是否有问卷容器
    const container = document.querySelector('.second-questionnaire-container');
    console.log('📊 问卷容器:', container ? '存在' : '不存在');
    
    // 检查当前显示的问题
    const currentQuestion = document.querySelector('.question-title');
    if (currentQuestion) {
        console.log('📊 当前问题:', currentQuestion.textContent);
    }
    
    // 检查章节信息
    const sectionInfo = document.querySelector('.section-info');
    if (sectionInfo) {
        console.log('📊 章节信息:', sectionInfo.textContent);
    }
    
    // 检查进度信息
    const progressInfo = document.querySelector('.progress-info');
    if (progressInfo) {
        console.log('📊 进度信息:', progressInfo.textContent);
    }
    
    // 检查控制台中的调试信息
    console.log('💡 建议检查浏览器控制台中的其他日志信息');
}

// 主调试函数
async function runApiDebug() {
    console.log('🚀 开始API调试...');
    
    // 1. 检查环境
    checkEnvironment();
    
    // 2. 检查前端服务
    checkFrontendService();
    
    // 3. 测试API调用
    const apiResult = await testApiCall();
    
    // 4. 模拟服务调用
    if (apiResult) {
        try {
            const serviceResult = await simulateServiceCall();
            console.log('✅ 服务调用模拟成功');
        } catch (error) {
            console.log('❌ 服务调用模拟失败:', error.message);
        }
    }
    
    // 5. 检查页面状态
    checkQuestionnaireState();
    
    console.log('='.repeat(50));
    console.log('🏁 调试完成');
    console.log('💡 如果API调用成功但页面仍显示模拟数据，可能是:');
    console.log('  1. 前端缓存问题 - 刷新页面');
    console.log('  2. 错误处理逻辑问题 - 检查catch块');
    console.log('  3. 数据格式不匹配 - 检查类型定义');
    console.log('  4. 异步加载时序问题 - 检查loading状态');
}

// 导出函数
window.runApiDebug = runApiDebug;
window.testApiCall = testApiCall;
window.simulateServiceCall = simulateServiceCall;

// 自动运行
runApiDebug();
