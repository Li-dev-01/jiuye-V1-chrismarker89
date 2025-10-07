// 🧪 增强版经济类问题验证脚本
// 在浏览器控制台运行此脚本来验证经济类问题是否正确显示

console.log('🔍 开始验证增强版经济类问题...');

// 1. 检查API数据
async function checkAPIData() {
  try {
    const response = await fetch('http://localhost:53389/api/universal-questionnaire/questionnaires/employment-survey-2024');
    const data = await response.json();
    
    console.log('📊 API响应状态:', response.status);
    console.log('📊 总章节数:', data.data.sections.length);
    
    // 统计经济类问题
    let economicQuestions = [];
    let totalQuestions = 0;
    
    data.data.sections.forEach((section, sectionIndex) => {
      console.log(`\n📋 章节 ${sectionIndex + 1}: ${section.title}`);
      console.log(`   ID: ${section.id}`);
      console.log(`   问题数: ${section.questions?.length || 0}`);
      
      if (section.condition) {
        console.log(`   条件: ${section.condition.dependsOn} ${section.condition.operator} ${section.condition.value}`);
      }
      
      totalQuestions += section.questions?.length || 0;
      
      section.questions?.forEach((question, qIndex) => {
        // 检查是否为经济类问题
        const economicKeywords = [
          'debt', 'salary', 'economic', 'financial', 'confidence', 
          'family-support', 'pressure', 'income', 'loan', 'burden',
          'huabei', 'credit-card', 'student-loan', 'mortgage'
        ];
        
        const isEconomic = economicKeywords.some(keyword => 
          question.id.includes(keyword) || 
          question.title.includes('经济') ||
          question.title.includes('负债') ||
          question.title.includes('贷款') ||
          question.title.includes('压力') ||
          question.title.includes('信心') ||
          question.title.includes('花呗') ||
          question.title.includes('收入')
        );
        
        if (isEconomic) {
          economicQuestions.push({
            section: section.title,
            sectionId: section.id,
            questionId: question.id,
            title: question.title,
            type: question.type,
            optionsCount: question.options?.length || 0
          });
        }
        
        console.log(`     ${qIndex + 1}. ${question.id} (${question.type}): ${question.title.substring(0, 50)}...`);
      });
    });
    
    console.log('\n💰 经济类问题统计:');
    console.log(`   总问题数: ${totalQuestions}`);
    console.log(`   经济类问题数: ${economicQuestions.length}`);
    console.log(`   经济类问题占比: ${((economicQuestions.length / totalQuestions) * 100).toFixed(1)}%`);
    
    console.log('\n📝 经济类问题详情:');
    economicQuestions.forEach((q, index) => {
      console.log(`${index + 1}. [${q.section}] ${q.questionId}`);
      console.log(`   标题: ${q.title}`);
      console.log(`   类型: ${q.type}, 选项数: ${q.optionsCount}`);
    });
    
    return { totalSections: data.data.sections.length, economicQuestions };
    
  } catch (error) {
    console.error('❌ API检查失败:', error);
    return null;
  }
}

// 2. 检查前端问卷状态
function checkFrontendState() {
  console.log('\n🔍 检查前端问卷状态...');
  
  // 检查是否在问卷页面
  if (!window.location.pathname.includes('questionnaire-v2')) {
    console.log('⚠️  当前不在问卷页面，请访问: http://localhost:5177/questionnaire-v2/survey');
    return false;
  }
  
  // 检查React组件状态
  const questionnaireContainer = document.querySelector('[data-testid="questionnaire-container"]') || 
                                 document.querySelector('.questionnaire-container') ||
                                 document.querySelector('main');
  
  if (questionnaireContainer) {
    console.log('✅ 找到问卷容器');
    
    // 检查当前章节信息
    const sectionTitle = document.querySelector('h2, .section-title, [class*="title"]');
    const questionTitle = document.querySelector('h3, .question-title, [class*="question"]');
    const progressInfo = document.querySelector('[class*="progress"], [class*="step"]');
    
    if (sectionTitle) {
      console.log('📋 当前章节:', sectionTitle.textContent);
    }
    if (questionTitle) {
      console.log('❓ 当前问题:', questionTitle.textContent.substring(0, 100));
    }
    if (progressInfo) {
      console.log('📊 进度信息:', progressInfo.textContent);
    }
    
    return true;
  } else {
    console.log('❌ 未找到问卷容器');
    return false;
  }
}

// 3. 模拟完整问卷流程
function simulateQuestionnaireFlow() {
  console.log('\n🎮 开始模拟问卷流程...');
  
  // 这里可以添加自动填写逻辑
  console.log('💡 提示: 手动完成问卷以验证经济类问题是否出现');
  console.log('🎯 重点验证:');
  console.log('   1. 基础信息后是否出现"就业信心与经济压力"章节');
  console.log('   2. 负债问题是否包含花呗、信用卡、白条等选项');
  console.log('   3. 选择学生身份后是否出现学生特有经济压力问题');
  console.log('   4. 选择高经济压力后是否触发应对策略章节');
  console.log('   5. 最终是否跳转到故事墙而非完成页面');
}

// 4. 主执行函数
async function runCompleteTest() {
  console.log('🚀 开始完整的经济类问题验证...');
  
  // 检查API数据
  const apiResult = await checkAPIData();
  
  if (apiResult) {
    console.log(`\n✅ API验证通过: ${apiResult.totalSections}个章节, ${apiResult.economicQuestions.length}个经济类问题`);
  } else {
    console.log('\n❌ API验证失败');
    return;
  }
  
  // 检查前端状态
  const frontendOK = checkFrontendState();
  
  if (frontendOK) {
    console.log('\n✅ 前端状态正常');
  } else {
    console.log('\n⚠️  前端状态异常，请检查页面');
  }
  
  // 模拟流程
  simulateQuestionnaireFlow();
  
  console.log('\n🎉 验证脚本执行完成！');
  console.log('📋 下一步: 手动完成问卷以验证所有经济类问题是否正确显示');
}

// 执行测试
runCompleteTest();
