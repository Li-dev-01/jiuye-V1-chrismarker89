// 性能监控工具

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.measureBasicMetrics();
  }

  private initializeObservers() {
    // 监控 LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // 监控 FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // 监控 CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.cumulativeLayoutShift = clsValue;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  }

  private measureBasicMetrics() {
    // 等待页面加载完成后测量基本指标
    if (document.readyState === 'complete') {
      this.collectBasicMetrics();
    } else {
      window.addEventListener('load', () => {
        this.collectBasicMetrics();
      });
    }
  }

  private collectBasicMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    }

    // 获取 FCP (First Contentful Paint)
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      this.metrics.firstContentfulPaint = fcpEntry.startTime;
    }
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public getResourceTimings(): ResourceTiming[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources.map(resource => ({
      name: resource.name,
      duration: resource.responseEnd - resource.requestStart,
      size: resource.transferSize || 0,
      type: this.getResourceType(resource.name)
    }));
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  public measureComponentRender(componentName: string, renderFn: () => void): number {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Component ${componentName} render time: ${duration.toFixed(2)}ms`);
    return duration;
  }

  public measureAsyncOperation(operationName: string, operation: () => Promise<any>): Promise<any> {
    const startTime = performance.now();
    
    return operation().then(result => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`Async operation ${operationName} took: ${duration.toFixed(2)}ms`);
      return result;
    }).catch(error => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`Async operation ${operationName} failed after: ${duration.toFixed(2)}ms`);
      throw error;
    });
  }

  public getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  public reportMetrics(): void {
    // 只在开发模式下偶尔显示性能指标
    if (!import.meta.env.DEV || Math.random() > 0.1) {
      return;
    }

    const metrics = this.getMetrics();
    const resources = this.getResourceTimings();
    const memory = this.getMemoryUsage();

    console.group('Performance Metrics');
    console.log('Basic Metrics:', metrics);
    console.log('Resource Timings:', resources);
    if (memory) {
      console.log('Memory Usage:', memory);
    }
    console.groupEnd();

    // 在生产环境中，这里可以发送数据到监控服务
    // 暂时禁用服务器上报，避免405错误
    // if (process.env.NODE_ENV === 'production') {
    //   this.sendMetricsToServer(metrics, resources, memory);
    // }
  }

  private sendMetricsToServer(metrics: any, resources: any, memory: any): void {
    // 发送性能数据到服务器
    fetch('/api/performance-metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics,
        resources,
        memory,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(error => {
      console.warn('Failed to send performance metrics:', error);
    });
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor();

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  performanceMonitor.reportMetrics();
  performanceMonitor.cleanup();
});

// 导出性能监控装饰器
export function withPerformanceMonitoring<T extends React.ComponentType<any>>(
  WrappedComponent: T,
  componentName?: string
): T {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;
  
  const WithPerformanceMonitoring = (props: any) => {
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        console.log(`Component ${displayName} lifecycle time: ${(endTime - startTime).toFixed(2)}ms`);
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return WithPerformanceMonitoring as T;
}

// 导出性能监控 Hook
export function usePerformanceMonitoring(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`Component ${componentName} mount time: ${(endTime - startTime).toFixed(2)}ms`);
    };
  }, [componentName]);
}

export default performanceMonitor;
