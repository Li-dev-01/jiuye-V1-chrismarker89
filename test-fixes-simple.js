// 简单的修复验证脚本
// 在浏览器控制台中运行

console.log('🔧 开始验证第二问卷修复效果...');

// 1. 检查页面是否正常加载
function checkPageLoad() {
    console.log('1️⃣ 检查页面加载...');
    
    const questionnaireContainer = document.querySelector('.second-questionnaire-container');
    if (questionnaireContainer) {
        console.log('✅ 问卷容器已找到');
        return true;
    } else {
        console.log('❌ 问卷容器未找到');
        return false;
    }
}

// 2. 检查当前问题类型
function checkCurrentQuestionType() {
    console.log('2️⃣ 检查当前问题类型...');
    
    // 查找单选按钮
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    // 查找TagSelector组件
    const tagOptions = document.querySelectorAll('[class*="tagOption"]');
    
    console.log(`📊 发现 ${radioButtons.length} 个单选按钮`);
    console.log(`📊 发现 ${checkboxes.length} 个复选框`);
    console.log(`📊 发现 ${tagOptions.length} 个标签选项`);
    
    if (tagOptions.length > 0) {
        // 检查是否有多选题的标识
        const multipleSelectors = document.querySelectorAll('[class*="multiple"]');
        console.log(`📊 发现 ${multipleSelectors.length} 个多选组件`);
        
        if (multipleSelectors.length > 0) {
            console.log('✅ 发现多选题组件');
            return 'checkbox';
        } else {
            console.log('✅ 发现单选题组件');
            return 'radio';
        }
    }
    
    return 'unknown';
}

// 3. 检查导航按钮状态
function checkNavigationButtons() {
    console.log('3️⃣ 检查导航按钮状态...');
    
    const prevButton = document.querySelector('button:contains("上一题")') || 
                      Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('上一题'));
    const nextButton = document.querySelector('button:contains("下一题")') || 
                      Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('下一题'));
    
    console.log(`📊 上一题按钮: ${prevButton ? '存在' : '不存在'}`);
    console.log(`📊 下一题按钮: ${nextButton ? '存在' : '不存在'}`);
    
    if (nextButton) {
        console.log(`📊 下一题按钮状态: ${nextButton.disabled ? '禁用' : '启用'}`);
        console.log(`📊 下一题按钮文本: "${nextButton.textContent}"`);
    }
    
    return { prevButton, nextButton };
}

// 4. 模拟选择选项
function simulateOptionSelection() {
    console.log('4️⃣ 模拟选择选项...');
    
    const tagOptions = document.querySelectorAll('[class*="tagOption"]');
    
    if (tagOptions.length > 0) {
        console.log(`📊 找到 ${tagOptions.length} 个选项`);
        
        // 点击第一个选项
        const firstOption = tagOptions[0];
        console.log(`🖱️ 点击第一个选项: "${firstOption.textContent}"`);
        firstOption.click();
        
        // 等待一下，检查是否自动跳转
        setTimeout(() => {
            console.log('⏱️ 等待1秒后检查是否自动跳转...');
            
            // 检查问题是否改变了
            const currentQuestionText = document.querySelector('[class*="question"]')?.textContent || '';
            console.log(`📝 当前问题: ${currentQuestionText.substring(0, 50)}...`);
            
            // 检查是否还能选择更多选项
            const selectedOptions = document.querySelectorAll('[class*="tagOption"][class*="selected"]');
            console.log(`📊 已选择选项数量: ${selectedOptions.length}`);
            
            if (tagOptions.length > 1 && selectedOptions.length === 1) {
                console.log('🖱️ 尝试选择第二个选项...');
                tagOptions[1].click();
                
                setTimeout(() => {
                    const newSelectedOptions = document.querySelectorAll('[class*="tagOption"][class*="selected"]');
                    console.log(`📊 现在已选择选项数量: ${newSelectedOptions.length}`);
                    
                    if (newSelectedOptions.length > 1) {
                        console.log('✅ 多选功能正常工作！');
                    } else {
                        console.log('❌ 多选功能可能有问题');
                    }
                }, 500);
            }
        }, 1000);
    } else {
        console.log('❌ 未找到可点击的选项');
    }
}

// 5. 检查防刷验证组件
function checkAntiSpamComponent() {
    console.log('5️⃣ 检查防刷验证组件...');
    
    const antiSpamModal = document.querySelector('[class*="anti-spam"]') || 
                         document.querySelector('[class*="verification"]') ||
                         document.querySelector('.ant-modal');
    
    if (antiSpamModal) {
        console.log('✅ 发现防刷验证组件');
        console.log(`📊 组件可见性: ${antiSpamModal.style.display !== 'none' ? '可见' : '隐藏'}`);
    } else {
        console.log('ℹ️ 防刷验证组件当前不可见（正常，只在最后显示）');
    }
}

// 主测试函数
function runTests() {
    console.log('🚀 开始运行修复验证测试...');
    console.log('='.repeat(50));
    
    const results = {
        pageLoad: checkPageLoad(),
        questionType: checkCurrentQuestionType(),
        navigation: checkNavigationButtons(),
        antiSpam: checkAntiSpamComponent()
    };
    
    console.log('='.repeat(50));
    console.log('📋 测试结果汇总:');
    console.log(`✅ 页面加载: ${results.pageLoad ? '正常' : '异常'}`);
    console.log(`✅ 问题类型: ${results.questionType}`);
    console.log(`✅ 导航按钮: ${results.navigation.nextButton ? '存在' : '缺失'}`);
    
    console.log('='.repeat(50));
    console.log('🎯 手动测试建议:');
    console.log('1. 如果当前是单选题，选择一个选项后应该自动跳转');
    console.log('2. 如果当前是多选题，选择选项后不应该自动跳转');
    console.log('3. 多选题应该允许选择多个选项');
    console.log('4. 多选题需要点击"下一题"按钮才能跳转');
    console.log('5. 完成所有问题后应该直接显示防刷验证，不显示"提交方式选择"');
    
    // 如果发现选项，自动进行选择测试
    if (results.questionType !== 'unknown') {
        console.log('='.repeat(50));
        console.log('🤖 开始自动选择测试...');
        simulateOptionSelection();
    }
    
    return results;
}

// 导出测试函数供手动调用
window.testFixes = runTests;

// 自动运行测试
runTests();

console.log('='.repeat(50));
console.log('💡 提示: 可以随时运行 testFixes() 重新测试');
