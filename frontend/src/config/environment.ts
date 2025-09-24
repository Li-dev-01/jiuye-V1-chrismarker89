/**
 * 环境配置管理
 * 区分开发环境和生产环境的不同行为
 */

export const ENV_CONFIG = {
  // 当前环境
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // 开发者功能开关
  enableDevPanel: process.env.NODE_ENV === 'development',
  enableDirectLogin: true, // 始终允许直接登录，便于开发和紧急访问
  
  // 多项目管理中心配置
  multiProjectCenter: {
    enabled: true,
    url: 'https://2f8c5c17.mylogin.pages.dev',
    // 生产环境强制使用多项目中心，开发环境可选
    enforceInProduction: true,
    allowBypassInDev: true
  },
  
  // 统一登录配置
  loginMethods: {
    // 统一管理入口（唯一入口）
    management: {
      enabled: true,
      route: '/management',
      description: '统一项目管理入口'
    },

    // 自动登录（来自多项目中心）
    autoLogin: {
      enabled: true,
      route: '/auth/auto-login',
      description: '来自多项目管理中心的自动登录'
    },

    // 开发者快捷登录
    devQuickLogin: {
      enabled: process.env.NODE_ENV === 'development',
      description: '开发环境快捷角色切换'
    }
  },
  
  // 开发者工具配置
  devTools: {
    showAccessPanel: process.env.NODE_ENV === 'development',
    showDebugInfo: process.env.NODE_ENV === 'development',
    allowRoleSwitch: process.env.NODE_ENV === 'development',
    
    // 预设开发账号
    devAccounts: [
      {
        role: 'super_admin',
        email: 'dev-superadmin@localhost',
        name: '开发-超级管理员',
        redirectPath: '/admin/dashboard'
      },
      {
        role: 'admin', 
        email: 'dev-admin@localhost',
        name: '开发-管理员',
        redirectPath: '/admin/dashboard'
      },
      {
        role: 'reviewer',
        email: 'dev-reviewer@localhost', 
        name: '开发-审核员',
        redirectPath: '/reviewer/dashboard'
      }
    ]
  },
  
  // 访问策略
  accessPolicy: {
    // 生产环境访问策略
    production: {
      preferMultiProjectCenter: true,
      allowDirectAccess: true, // 仍允许直接访问，以防多项目中心故障
      showWarningForDirectAccess: true
    },
    
    // 开发环境访问策略  
    development: {
      preferMultiProjectCenter: false,
      allowDirectAccess: true,
      showDevTools: true,
      enableQuickSwitch: true
    }
  }
};

/**
 * 获取当前环境的访问策略
 */
export const getCurrentAccessPolicy = () => {
  return ENV_CONFIG.isDevelopment 
    ? ENV_CONFIG.accessPolicy.development 
    : ENV_CONFIG.accessPolicy.production;
};

/**
 * 检查是否应该显示开发者工具
 */
export const shouldShowDevTools = () => {
  return ENV_CONFIG.isDevelopment && ENV_CONFIG.devTools.showAccessPanel;
};

/**
 * 获取推荐的登录方式
 */
export const getRecommendedLoginMethod = () => {
  const policy = getCurrentAccessPolicy();
  
  if (ENV_CONFIG.isDevelopment) {
    return {
      primary: 'direct',
      alternatives: ['autoLogin', 'devQuickLogin'],
      message: '开发环境：推荐使用直接登录或开发面板'
    };
  } else {
    return {
      primary: 'autoLogin',
      alternatives: ['direct'],
      message: '生产环境：推荐通过多项目管理中心登录'
    };
  }
};

export default ENV_CONFIG;
