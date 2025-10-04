// 测试新增经济类问题和分支逻辑
// 在浏览器控制台中运行

console.log('🎯 开始测试新增的经济类问题和分支逻辑...');

// 检查问卷定义中的新问题
function checkNewQuestions() {
    console.log('='.repeat(50));
    console.log('1️⃣ 检查新增的经济类问题');
    
    // 检查是否有问卷定义
    const questionnaireContainer = document.querySelector('.second-questionnaire-container');
    if (!questionnaireContainer) {
        console.log('❌ 问卷容器不存在');
        return false;
    }
    
    // 新增问题ID列表
    const newQuestions = [
        'debt-situation',
        'family-support', 
        'unemployment-financial-impact',
        'survival-strategies',
        'living-cost-pressure',
        'emergency-fund',
        'side-income',
        'employment-confidence-6months',
        'employment-confidence-1year',
        'employment-confidence-3years',
        'confidence-factors'
    ];
    
    console.log('📊 预期新增问题数量:', newQuestions.length);
    console.log('📊 新增问题列表:', newQuestions);
    
    return true;
}

// 模拟触发经济压力分析分支
function simulateEconomicPressureBranch() {
    console.log('='.repeat(50));
    console.log('2️⃣ 模拟触发经济压力分析分支');
    
    // 查找family-support问题
    const familySupportOptions = document.querySelectorAll('[data-question-id="family-support"] .tag-option');
    
    if (familySupportOptions.length > 0) {
        console.log('✅ 找到family-support问题选项:', familySupportOptions.length);
        
        // 选择"部分依赖家庭支持"来触发经济压力分析
        const dependentOption = Array.from(familySupportOptions).find(option => 
            option.textContent.includes('部分依赖家庭支持')
        );
        
        if (dependentOption) {
            console.log('🖱️ 模拟选择"部分依赖家庭支持"选项...');
            dependentOption.click();
            
            setTimeout(() => {
                console.log('⏱️ 等待分支逻辑处理...');
                checkBranchLogicResult();
            }, 1000);
        } else {
            console.log('❌ 未找到"部分依赖家庭支持"选项');
        }
    } else {
        console.log('❌ 未找到family-support问题');
    }
}

// 检查分支逻辑结果
function checkBranchLogicResult() {
    console.log('='.repeat(50));
    console.log('3️⃣ 检查分支逻辑结果');
    
    // 检查是否出现了经济压力分析相关问题
    const economicQuestions = [
        'living-cost-pressure',
        'emergency-fund', 
        'side-income'
    ];
    
    let foundEconomicQuestions = 0;
    
    economicQuestions.forEach(questionId => {
        const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
        if (questionElement) {
            console.log(`✅ 找到经济压力问题: ${questionId}`);
            foundEconomicQuestions++;
        } else {
            console.log(`❌ 未找到经济压力问题: ${questionId}`);
        }
    });
    
    if (foundEconomicQuestions > 0) {
        console.log(`🎉 分支逻辑生效！找到 ${foundEconomicQuestions} 个经济压力相关问题`);
    } else {
        console.log('⚠️ 分支逻辑可能未生效，或问题尚未显示');
    }
}

// 检查未来信心指数问题
function checkConfidenceQuestions() {
    console.log('='.repeat(50));
    console.log('4️⃣ 检查未来信心指数问题');
    
    const confidenceQuestions = [
        'employment-confidence-6months',
        'employment-confidence-1year', 
        'employment-confidence-3years',
        'confidence-factors'
    ];
    
    let foundConfidenceQuestions = 0;
    
    confidenceQuestions.forEach(questionId => {
        const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
        if (questionElement) {
            console.log(`✅ 找到信心指数问题: ${questionId}`);
            foundConfidenceQuestions++;
        } else {
            console.log(`❌ 未找到信心指数问题: ${questionId}`);
        }
    });
    
    console.log(`📊 信心指数问题统计: ${foundConfidenceQuestions}/${confidenceQuestions.length}`);
}

// 检查多选题功能
function checkMultiSelectQuestions() {
    console.log('='.repeat(50));
    console.log('5️⃣ 检查多选题功能');
    
    const multiSelectQuestions = [
        'debt-situation',
        'unemployment-financial-impact',
        'survival-strategies', 
        'side-income',
        'confidence-factors'
    ];
    
    multiSelectQuestions.forEach(questionId => {
        const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
        if (questionElement) {
            const options = questionElement.querySelectorAll('.tag-option');
            console.log(`✅ ${questionId}: 找到 ${options.length} 个选项`);
            
            // 检查是否是多选题
            const questionTitle = questionElement.querySelector('.question-title');
            if (questionTitle && questionTitle.textContent.includes('可多选')) {
                console.log(`📋 ${questionId}: 确认为多选题`);
            }
        }
    });
}

// 模拟完整的经济问题流程
function simulateEconomicQuestionFlow() {
    console.log('='.repeat(50));
    console.log('6️⃣ 模拟完整的经济问题流程');
    
    // 步骤1：选择在职状态
    const workingOption = Array.from(document.querySelectorAll('.tag-option')).find(option => 
        option.textContent.includes('全职工作')
    );
    
    if (workingOption) {
        console.log('🖱️ 选择"全职工作"状态...');
        workingOption.click();
        
        setTimeout(() => {
            // 步骤2：填写薪酬信息
            const salaryOption = Array.from(document.querySelectorAll('.tag-option')).find(option => 
                option.textContent.includes('8000-12000元')
            );
            
            if (salaryOption) {
                console.log('🖱️ 选择薪酬范围...');
                salaryOption.click();
                
                setTimeout(() => {
                    // 步骤3：选择负债情况
                    const debtOptions = document.querySelectorAll('[data-question-id="debt-situation"] .tag-option');
                    if (debtOptions.length > 0) {
                        console.log('🖱️ 选择负债情况（多选）...');
                        debtOptions[0].click(); // 选择第一个选项
                        
                        setTimeout(() => {
                            debtOptions[1].click(); // 选择第二个选项
                            console.log('✅ 多选功能测试完成');
                        }, 500);
                    }
                }, 1000);
            }
        }, 1000);
    }
}

// 生成测试报告
function generateTestReport() {
    console.log('='.repeat(50));
    console.log('📋 生成测试报告');
    
    const report = {
        timestamp: new Date().toISOString(),
        newQuestionsFound: 0,
        branchLogicWorking: false,
        multiSelectWorking: false,
        confidenceQuestionsFound: 0,
        recommendations: []
    };
    
    // 检查新问题
    const newQuestionIds = [
        'debt-situation', 'family-support', 'unemployment-financial-impact',
        'survival-strategies', 'living-cost-pressure', 'emergency-fund',
        'side-income', 'employment-confidence-6months', 'employment-confidence-1year',
        'employment-confidence-3years', 'confidence-factors'
    ];
    
    newQuestionIds.forEach(questionId => {
        if (document.querySelector(`[data-question-id="${questionId}"]`)) {
            report.newQuestionsFound++;
        }
    });
    
    // 检查多选功能
    const multiSelectElements = document.querySelectorAll('[data-question-id*="debt-situation"] .tag-option.selected');
    report.multiSelectWorking = multiSelectElements.length > 1;
    
    // 生成建议
    if (report.newQuestionsFound < newQuestionIds.length) {
        report.recommendations.push('部分新问题未显示，检查问卷定义同步');
    }
    
    if (!report.multiSelectWorking) {
        report.recommendations.push('多选功能需要验证');
    }
    
    console.log('📊 测试报告:', report);
    
    return report;
}

// 主测试函数
async function runEconomicQuestionsTest() {
    console.log('🚀 开始经济类问题测试...');
    
    // 1. 检查新问题
    const hasQuestions = checkNewQuestions();
    
    if (!hasQuestions) {
        console.log('❌ 基础检查失败，停止测试');
        return;
    }
    
    // 2. 检查多选题功能
    checkMultiSelectQuestions();
    
    // 3. 检查信心指数问题
    checkConfidenceQuestions();
    
    // 4. 模拟经济压力分支
    simulateEconomicPressureBranch();
    
    // 5. 等待一段时间后生成报告
    setTimeout(() => {
        const report = generateTestReport();
        
        console.log('='.repeat(50));
        console.log('🏁 测试完成');
        console.log('💡 建议:');
        console.log('  1. 完成整个问卷流程，观察新问题是否正确显示');
        console.log('  2. 测试多选题是否可以选择多个选项');
        console.log('  3. 验证分支逻辑是否根据经济状况显示相关问题');
        console.log('  4. 检查未来信心指数问题是否出现在问卷末尾');
        
    }, 3000);
}

// 导出函数
window.runEconomicQuestionsTest = runEconomicQuestionsTest;
window.checkNewQuestions = checkNewQuestions;
window.simulateEconomicPressureBranch = simulateEconomicPressureBranch;
window.checkConfidenceQuestions = checkConfidenceQuestions;

// 自动运行测试
runEconomicQuestionsTest();

console.log('='.repeat(50));
console.log('💡 可用命令:');
console.log('- runEconomicQuestionsTest() - 重新运行完整测试');
console.log('- checkNewQuestions() - 检查新问题');
console.log('- simulateEconomicPressureBranch() - 模拟经济压力分支');
console.log('- checkConfidenceQuestions() - 检查信心指数问题');
