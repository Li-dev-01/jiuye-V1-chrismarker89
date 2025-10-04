// 🔄 强制问卷重置脚本
// 在浏览器控制台运行此脚本来强制重置问卷状态

console.log('🔄 开始强制重置问卷状态...');

// 1. 清除所有存储
function clearAllStorage() {
  console.log('🧹 清除所有本地存储...');
  
  // 清除localStorage
  const localStorageKeys = Object.keys(localStorage);
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ 清除localStorage: ${key}`);
  });
  
  // 清除sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage);
  sessionStorageKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`✅ 清除sessionStorage: ${key}`);
  });
  
  // 清除cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  console.log('✅ 清除所有cookies');
}

// 2. 强制刷新API数据
async function forceRefreshAPI() {
  console.log('🔄 强制刷新API数据...');
  
  try {
    // 添加随机参数防止缓存
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const apiUrl = `http://localhost:53389/api/universal-questionnaire/questionnaires/employment-survey-2024?t=${timestamp}&r=${random}`;
    
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
    console.log('✅ API数据刷新成功');
    console.log('📊 章节数量:', data.data.sections.length);
    
    // 验证经济类问题
    let economicQuestions = 0;
    data.data.sections.forEach(section => {
      section.questions?.forEach(question => {
        if (question.id.includes('debt') || 
            question.id.includes('economic') || 
            question.id.includes('confidence') ||
            question.title.includes('经济') ||
            question.title.includes('负债') ||
            question.title.includes('花呗') ||
            question.title.includes('信心')) {
          economicQuestions++;
        }
      });
    });
    
    console.log('💰 经济类问题数量:', economicQuestions);
    
    if (economicQuestions > 0) {
      console.log('✅ 确认包含经济类问题');
    } else {
      console.log('❌ 未发现经济类问题');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ API刷新失败:', error);
    return null;
  }
}

// 3. 重置React状态
function resetReactState() {
  console.log('🔄 尝试重置React状态...');
  
  // 查找React根节点
  const reactRoot = document.querySelector('#root');
  if (reactRoot) {
    // 触发React重新渲染
    const event = new CustomEvent('questionnaire-reset', {
      detail: { timestamp: Date.now() }
    });
    reactRoot.dispatchEvent(event);
    console.log('✅ 触发React重置事件');
  }
  
  // 如果有React DevTools，尝试强制更新
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔧 React DevTools可用，尝试强制更新');
  }
}

// 4. 强制页面重新加载
function forceReload() {
  console.log('🔄 强制页面重新加载...');
  
  // 清除Service Worker缓存
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('✅ Service Worker已注销');
      });
    });
  }
  
  // 清除浏览器缓存
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log(`✅ 缓存已清除: ${name}`);
      });
    });
  }
  
  // 延迟重新加载
  setTimeout(() => {
    window.location.href = 'http://localhost:5177/questionnaire-v2/survey?reset=true&t=' + Date.now();
  }, 1000);
}

// 5. 检查当前问卷状态
function checkCurrentState() {
  console.log('🔍 检查当前问卷状态...');
  
  // 检查URL
  console.log('📍 当前URL:', window.location.href);
  
  // 检查页面元素
  const questionnaireElements = document.querySelectorAll('[class*="questionnaire"], [class*="question"], [class*="section"]');
  console.log('📋 问卷元素数量:', questionnaireElements.length);
  
  // 检查是否在防刷验证页面
  const antiSpamElement = document.querySelector('[class*="anti-spam"], [class*="verification"]');
  if (antiSpamElement) {
    console.log('🛡️ 当前在防刷验证页面');
    return 'anti-spam';
  }
  
  // 检查当前问题
  const currentQuestion = document.querySelector('h3, .question-title, [class*="question-title"]');
  if (currentQuestion) {
    console.log('❓ 当前问题:', currentQuestion.textContent.substring(0, 100));
    return 'in-progress';
  }
  
  return 'unknown';
}

// 6. 主执行函数
async function forceQuestionnaireReset() {
  console.log('🚀 开始强制问卷重置流程...');
  
  // 检查当前状态
  const currentState = checkCurrentState();
  console.log('📊 当前状态:', currentState);
  
  // 清除所有存储
  clearAllStorage();
  
  // 刷新API数据
  const apiData = await forceRefreshAPI();
  
  if (!apiData) {
    console.log('❌ API数据获取失败，请检查后端服务');
    return;
  }
  
  // 重置React状态
  resetReactState();
  
  // 提示用户操作
  console.log('\n🎯 重置完成，请选择下一步操作：');
  console.log('1. 运行 forceReload() 强制重新加载页面');
  console.log('2. 手动刷新页面 (Ctrl+Shift+R 或 Cmd+Shift+R)');
  console.log('3. 直接访问: http://localhost:5177/questionnaire-v2/survey');
  
  console.log('\n📋 预期结果：');
  console.log('- 问卷应该从第一个问题开始');
  console.log('- 第3章节应该是"就业信心与经济压力"');
  console.log('- 应该包含花呗、信用卡等现代债务选项');
  
  return {
    apiData,
    currentState,
    resetComplete: true
  };
}

// 7. 快速重置函数
function quickReset() {
  clearAllStorage();
  forceReload();
}

// 执行重置
forceQuestionnaireReset();

// 导出函数供手动调用
window.forceQuestionnaireReset = forceQuestionnaireReset;
window.forceReload = forceReload;
window.quickReset = quickReset;
window.clearAllStorage = clearAllStorage;

console.log('\n💡 可用命令：');
console.log('- forceQuestionnaireReset() - 完整重置流程');
console.log('- quickReset() - 快速重置并重新加载');
console.log('- forceReload() - 强制重新加载页面');
console.log('- clearAllStorage() - 仅清除存储');
