/**
 * 悬浮组件管理器
 * 统一管理所有悬浮组件的生命周期和状态
 */

interface FloatingComponentConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  retryCount: number;
  maxRetries: number;
  lastError?: Error;
  lastErrorTime?: Date;
}

interface FloatingComponentListener {
  onStateChange: (componentId: string, enabled: boolean) => void;
  onError: (componentId: string, error: Error) => void;
  onRetry: (componentId: string, retryCount: number) => void;
}

/**
 * 悬浮组件管理器类
 */
export class FloatingComponentManager {
  private static instance: FloatingComponentManager;
  private components: Map<string, FloatingComponentConfig> = new Map();
  private listeners: FloatingComponentListener[] = [];
  private globalEnabled: boolean = true;

  private constructor() {
    this.initializeDefaultComponents();
  }

  static getInstance(): FloatingComponentManager {
    if (!FloatingComponentManager.instance) {
      FloatingComponentManager.instance = new FloatingComponentManager();
    }
    return FloatingComponentManager.instance;
  }

  /**
   * 初始化默认组件配置
   */
  private initializeDefaultComponents(): void {
    this.registerComponent({
      id: 'floating-status-bar',
      name: '悬浮状态栏',
      enabled: true,
      priority: 1,
      retryCount: 0,
      maxRetries: 3
    });

    this.registerComponent({
      id: 'floating-user-panel',
      name: '悬浮用户面板',
      enabled: false, // 默认禁用
      priority: 2,
      retryCount: 0,
      maxRetries: 3
    });

    this.registerComponent({
      id: 'global-state-indicator',
      name: '全局状态指示器',
      enabled: false, // 默认禁用
      priority: 3,
      retryCount: 0,
      maxRetries: 2
    });
  }

  /**
   * 注册悬浮组件
   */
  registerComponent(config: FloatingComponentConfig): void {
    this.components.set(config.id, { ...config });
    console.log(`FloatingComponentManager: Registered component ${config.name} (${config.id})`);
  }

  /**
   * 启用组件
   */
  enableComponent(componentId: string): boolean {
    const component = this.components.get(componentId);
    if (!component) {
      console.warn(`FloatingComponentManager: Component ${componentId} not found`);
      return false;
    }

    if (!this.globalEnabled) {
      console.warn(`FloatingComponentManager: Global floating components are disabled`);
      return false;
    }

    component.enabled = true;
    component.retryCount = 0; // 重置重试计数
    this.notifyStateChange(componentId, true);
    console.log(`FloatingComponentManager: Enabled component ${component.name}`);
    return true;
  }

  /**
   * 禁用组件
   */
  disableComponent(componentId: string): boolean {
    const component = this.components.get(componentId);
    if (!component) {
      console.warn(`FloatingComponentManager: Component ${componentId} not found`);
      return false;
    }

    component.enabled = false;
    this.notifyStateChange(componentId, false);
    console.log(`FloatingComponentManager: Disabled component ${component.name}`);
    return true;
  }

  /**
   * 检查组件是否启用
   */
  isComponentEnabled(componentId: string): boolean {
    if (!this.globalEnabled) {
      return false;
    }

    const component = this.components.get(componentId);
    return component ? component.enabled : false;
  }

  /**
   * 报告组件错误
   */
  reportError(componentId: string, error: Error): void {
    const component = this.components.get(componentId);
    if (!component) {
      console.warn(`FloatingComponentManager: Component ${componentId} not found for error reporting`);
      return;
    }

    component.lastError = error;
    component.lastErrorTime = new Date();
    component.retryCount++;

    console.error(`FloatingComponentManager: Error in ${component.name}:`, error);

    // 如果超过最大重试次数，禁用组件
    if (component.retryCount >= component.maxRetries) {
      console.warn(`FloatingComponentManager: Component ${component.name} exceeded max retries, disabling`);
      this.disableComponent(componentId);
    }

    this.notifyError(componentId, error);
  }

  /**
   * 报告组件重试
   */
  reportRetry(componentId: string): void {
    const component = this.components.get(componentId);
    if (!component) {
      return;
    }

    console.log(`FloatingComponentManager: Component ${component.name} retrying (${component.retryCount}/${component.maxRetries})`);
    this.notifyRetry(componentId, component.retryCount);
  }

  /**
   * 获取组件状态
   */
  getComponentStatus(componentId: string): FloatingComponentConfig | null {
    return this.components.get(componentId) || null;
  }

  /**
   * 获取所有组件状态
   */
  getAllComponentsStatus(): FloatingComponentConfig[] {
    return Array.from(this.components.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * 全局启用/禁用悬浮组件
   */
  setGlobalEnabled(enabled: boolean): void {
    this.globalEnabled = enabled;
    
    if (!enabled) {
      // 禁用所有组件
      for (const [componentId, component] of this.components) {
        if (component.enabled) {
          this.notifyStateChange(componentId, false);
        }
      }
    }

    console.log(`FloatingComponentManager: Global floating components ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 检查全局是否启用
   */
  isGlobalEnabled(): boolean {
    return this.globalEnabled;
  }

  /**
   * 重置组件状态
   */
  resetComponent(componentId: string): boolean {
    const component = this.components.get(componentId);
    if (!component) {
      return false;
    }

    component.retryCount = 0;
    component.lastError = undefined;
    component.lastErrorTime = undefined;
    
    console.log(`FloatingComponentManager: Reset component ${component.name}`);
    return true;
  }

  /**
   * 重置所有组件状态
   */
  resetAllComponents(): void {
    for (const [componentId] of this.components) {
      this.resetComponent(componentId);
    }
    console.log('FloatingComponentManager: Reset all components');
  }

  /**
   * 添加监听器
   */
  addListener(listener: FloatingComponentListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除监听器
   */
  removeListener(listener: FloatingComponentListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(componentId: string, enabled: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener.onStateChange(componentId, enabled);
      } catch (error) {
        console.error('FloatingComponentManager: Error in state change listener:', error);
      }
    });
  }

  /**
   * 通知错误
   */
  private notifyError(componentId: string, error: Error): void {
    this.listeners.forEach(listener => {
      try {
        listener.onError(componentId, error);
      } catch (listenerError) {
        console.error('FloatingComponentManager: Error in error listener:', listenerError);
      }
    });
  }

  /**
   * 通知重试
   */
  private notifyRetry(componentId: string, retryCount: number): void {
    this.listeners.forEach(listener => {
      try {
        listener.onRetry(componentId, retryCount);
      } catch (error) {
        console.error('FloatingComponentManager: Error in retry listener:', error);
      }
    });
  }

  /**
   * 获取健康状态报告
   */
  getHealthReport(): {
    globalEnabled: boolean;
    totalComponents: number;
    enabledComponents: number;
    errorComponents: number;
    components: Array<{
      id: string;
      name: string;
      enabled: boolean;
      hasError: boolean;
      retryCount: number;
      maxRetries: number;
    }>;
  } {
    const components = this.getAllComponentsStatus();
    
    return {
      globalEnabled: this.globalEnabled,
      totalComponents: components.length,
      enabledComponents: components.filter(c => c.enabled).length,
      errorComponents: components.filter(c => c.lastError).length,
      components: components.map(c => ({
        id: c.id,
        name: c.name,
        enabled: c.enabled,
        hasError: !!c.lastError,
        retryCount: c.retryCount,
        maxRetries: c.maxRetries
      }))
    };
  }
}

// 导出单例实例
export const floatingComponentManager = FloatingComponentManager.getInstance();

export default floatingComponentManager;
