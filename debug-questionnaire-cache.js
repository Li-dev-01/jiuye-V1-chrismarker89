// 🔍 问卷缓存调试脚本
// 在浏览器控制台运行此脚本来检查前端是否使用了最新的API数据

console.log('🔍 开始调试问卷缓存问题...');

// 1. 清除所有可能的缓存
function clearAllCaches() {
  console.log('🧹 清除所有缓存...');
  
  // 清除localStorage
  localStorage.clear();
  console.log('✅ localStorage已清除');
  
  // 清除sessionStorage
  sessionStorage.clear();
  console.log('✅ sessionStorage已清除');
  
  // 清除IndexedDB（如果有的话）
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
          console.log(`✅ IndexedDB ${db.name} 已清除`);
        }
      });
    });
  }
  
  console.log('🎉 所有缓存已清除');
}

// 2. 强制重新获取API数据
async function forceRefreshAPIData() {
  console.log('🔄 强制重新获取API数据...');
  
  try {
    // 添加时间戳防止缓存
    const timestamp = Date.now();
    const apiUrl = `http://localhost:53389/api/universal-questionnaire/questionnaires/employment-survey-2024?t=${timestamp}`;
    
    console.log('📡 请求URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API数据获取成功');
    console.log('📊 章节数量:', data.data.sections.length);
    
    // 检查经济类问题
    let economicQuestions = [];
    data.data.sections.forEach((section, sectionIndex) => {
      section.questions?.forEach((question) => {
        const economicKeywords = [
          'debt', 'salary', 'economic', 'financial', 'confidence', 
          'pressure', 'income', 'loan', 'burden', 'huabei', 'credit-card'
        ];
        
        const isEconomic = economicKeywords.some(keyword => 
          question.id.includes(keyword) || 
          question.title.includes('经济') ||
          question.title.includes('负债') ||
          question.title.includes('贷款') ||
          question.title.includes('压力') ||
          question.title.includes('信心') ||
          question.title.includes('花呗')
        );
        
        if (isEconomic) {
          economicQuestions.push({
            section: section.title,
            questionId: question.id,
            title: question.title
          });
        }
      });
    });
    
    console.log('💰 经济类问题数量:', economicQuestions.length);
    console.log('📝 经济类问题列表:');
    economicQuestions.forEach((q, index) => {
      console.log(`${index + 1}. [${q.section}] ${q.questionId}: ${q.title}`);
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ API数据获取失败:', error);
    return null;
  }
}

// 3. 检查前端React状态
function checkReactState() {
  console.log('🔍 检查React组件状态...');
  
  // 查找React组件的根节点
  const reactRoot = document.querySelector('#root');
  if (!reactRoot) {
    console.log('❌ 未找到React根节点');
    return;
  }
  
  // 检查React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools可用');
    
    // 尝试获取React Fiber信息
    const fiberNode = reactRoot._reactInternalFiber || reactRoot._reactInternalInstance;
    if (fiberNode) {
      console.log('✅ 找到React Fiber节点');
    }
  } else {
    console.log('⚠️  React DevTools不可用');
  }
  
  // 检查问卷相关的DOM元素
  const questionnaireElements = document.querySelectorAll('[class*="questionnaire"], [class*="question"], [class*="section"]');
  console.log('📋 找到问卷相关元素数量:', questionnaireElements.length);
  
  // 检查当前显示的问题
  const currentQuestion = document.querySelector('h3, .question-title, [class*="question-title"]');
  if (currentQuestion) {
    console.log('❓ 当前问题:', currentQuestion.textContent);
  }
}

// 4. 强制页面重新加载
function forcePageReload() {
  console.log('🔄 强制页面重新加载...');
  
  // 清除缓存后重新加载
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('✅ Service Worker已注销');
      });
      
      // 延迟重新加载，确保Service Worker完全注销
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
    });
  } else {
    window.location.reload(true);
  }
}

// 5. 主执行函数
async function debugQuestionnaire() {
  console.log('🚀 开始问卷缓存调试...');
  
  // 步骤1：检查当前状态
  checkReactState();
  
  // 步骤2：获取最新API数据
  const apiData = await forceRefreshAPIData();
  
  if (!apiData) {
    console.log('❌ 无法获取API数据，请检查后端服务');
    return;
  }
  
  // 步骤3：清除缓存
  clearAllCaches();
  
  // 步骤4：提示用户操作
  console.log('\n🎯 调试完成，建议操作：');
  console.log('1. 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 强制刷新页面');
  console.log('2. 或者运行 forcePageReload() 函数自动重新加载');
  console.log('3. 重新填写问卷，观察是否出现经济类问题');
  
  console.log('\n📋 预期结果：');
  console.log('- 第3章节应该是"就业信心与经济压力"');
  console.log('- 在职人员章节应该包含花呗、信用卡等负债选项');
  console.log('- 学生章节应该包含学生特有的经济压力问题');
  
  return apiData;
}

// 执行调试
debugQuestionnaire();

// 导出函数供手动调用
window.debugQuestionnaire = debugQuestionnaire;
window.forcePageReload = forcePageReload;
window.clearAllCaches = clearAllCaches;
window.forceRefreshAPIData = forceRefreshAPIData;
