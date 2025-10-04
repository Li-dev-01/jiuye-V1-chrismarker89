// 测试第二问卷提交功能
// 在浏览器控制台中运行

console.log('🧪 开始测试第二问卷提交功能...');

// 模拟完整的问卷流程
async function testQuestionnaireSubmission() {
    console.log('='.repeat(50));
    console.log('🚀 开始模拟问卷提交测试');
    
    // 1. 检查API配置
    console.log('1️⃣ 检查API配置...');
    
    try {
        // 测试后端API连接
        const testResponse = await fetch('http://localhost:53389/api/universal-questionnaire/submit', {
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
        
        const testResult = await testResponse.json();
        if (testResult.success) {
            console.log('✅ 后端API连接正常');
        } else {
            console.log('❌ 后端API返回错误:', testResult.message);
        }
    } catch (error) {
        console.log('❌ 后端API连接失败:', error.message);
        return;
    }
    
    // 2. 检查前端API服务配置
    console.log('2️⃣ 检查前端API服务配置...');
    
    // 检查API基础URL
    const apiBaseUrl = window.location.origin.includes('localhost:5175') ? 
        'http://localhost:53389' : 'https://employment-survey-api-prod.chrismarker89.workers.dev';
    console.log(`📊 API基础URL: ${apiBaseUrl}`);
    
    // 3. 模拟问卷数据
    console.log('3️⃣ 构建模拟问卷数据...');
    
    const mockResponses = {
        'age-group': '23-25',
        'education-level': 'bachelor',
        'current-status': 'unemployed',
        'job-search-difficulties': ['lack-experience', 'skill-mismatch'],
        'preferred-industries': ['internet-tech', 'finance']
    };
    
    const mockMetadata = {
        startedAt: new Date().toISOString(),
        responseTimeSeconds: 120,
        userExperienceRating: 8,
        technicalFeedback: '测试反馈'
    };
    
    console.log('📊 模拟响应数据:', mockResponses);
    console.log('📊 模拟元数据:', mockMetadata);
    
    // 4. 测试数据构建
    console.log('4️⃣ 测试数据构建...');
    
    try {
        // 模拟 secondQuestionnaireService.buildResponseData
        const responseData = {
            questionnaireId: 'employment-survey-2024',
            participantGroup: 'freshGraduate',
            basicDemographics: mockResponses,
            employmentStatus: {},
            unemploymentReasons: {},
            jobSearchBehavior: {},
            psychologicalState: {},
            supportNeeds: {},
            groupSpecificData: {},
            ...mockMetadata
        };
        
        console.log('✅ 响应数据构建成功');
        
        // 5. 测试API数据格式
        console.log('5️⃣ 测试API数据格式...');
        
        const apiData = {
            questionnaireId: responseData.questionnaireId,
            sectionResponses: [
                {
                    sectionId: 'second-questionnaire-responses',
                    questionResponses: Object.entries(mockResponses).map(([questionId, value]) => ({
                        questionId,
                        value
                    }))
                }
            ],
            metadata: {
                participantGroup: responseData.participantGroup,
                startedAt: responseData.startedAt,
                responseTimeSeconds: responseData.responseTimeSeconds,
                userExperienceRating: responseData.userExperienceRating,
                technicalFeedback: responseData.technicalFeedback,
                submittedAt: new Date().toISOString(),
                userAgent: navigator.userAgent,
                deviceInfo: {
                    platform: navigator.platform,
                    language: navigator.language
                }
            }
        };
        
        console.log('📊 API数据格式:', apiData);
        
        // 6. 测试实际提交
        console.log('6️⃣ 测试实际提交...');
        
        const submitResponse = await fetch(`${apiBaseUrl}/api/universal-questionnaire/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiData)
        });
        
        const submitResult = await submitResponse.json();
        
        if (submitResult.success) {
            console.log('✅ 问卷提交成功!');
            console.log('📊 提交结果:', submitResult);
        } else {
            console.log('❌ 问卷提交失败:', submitResult.message);
        }
        
    } catch (error) {
        console.log('❌ 测试过程中出错:', error);
    }
    
    console.log('='.repeat(50));
    console.log('🏁 测试完成');
}

// 检查当前页面状态
function checkCurrentPageState() {
    console.log('📋 当前页面状态检查:');
    
    const questionnaireContainer = document.querySelector('.second-questionnaire-container');
    console.log(`📊 问卷容器: ${questionnaireContainer ? '存在' : '不存在'}`);
    
    const currentQuestion = document.querySelector('[class*="question"]');
    if (currentQuestion) {
        console.log(`📊 当前问题: ${currentQuestion.textContent.substring(0, 50)}...`);
    }
    
    const tagOptions = document.querySelectorAll('[class*="tagOption"]');
    console.log(`📊 选项数量: ${tagOptions.length}`);
    
    const nextButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('下一题') || btn.textContent.includes('完成')
    );
    console.log(`📊 下一题按钮: ${nextButton ? '存在' : '不存在'}`);
    
    if (nextButton) {
        console.log(`📊 按钮状态: ${nextButton.disabled ? '禁用' : '启用'}`);
        console.log(`📊 按钮文本: "${nextButton.textContent}"`);
    }
}

// 导出函数供手动调用
window.testSubmission = testQuestionnaireSubmission;
window.checkPageState = checkCurrentPageState;

// 自动运行检查
checkCurrentPageState();

console.log('='.repeat(50));
console.log('💡 提示:');
console.log('- 运行 testSubmission() 测试提交功能');
console.log('- 运行 checkPageState() 检查页面状态');
console.log('- 完成问卷后观察是否能正常提交');
