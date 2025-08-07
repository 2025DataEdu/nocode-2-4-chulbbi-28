/**
 * 애플리케이션 성능 메트릭 수집 및 분석
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

interface PerformanceReport {
  pageLoadTime: number;
  renderTime: number;
  apiResponseTimes: number[];
  memoryUsage: number;
  interactionResponsiveness: number;
  errors: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    // 네비게이션 타이밍 관찰
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
              this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
              this.recordMetric('first_paint', navEntry.responseStart - navEntry.fetchStart);
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation observer failed:', error);
      }

      // LCP (Largest Contentful Paint) 관찰
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('largest_contentful_paint', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer failed:', error);
      }

      // FID (First Input Delay) 관찰
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              const fidEntry = entry as PerformanceEventTiming;
              this.recordMetric('first_input_delay', fidEntry.processingStart - fidEntry.startTime);
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer failed:', error);
      }
    }
  }

  recordMetric(name: string, value: number, context?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context
    };

    this.metrics.push(metric);

    // 메트릭 저장소 크기 제한
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // 개발 환경에서 로깅
    if (import.meta.env.DEV) {
      console.log(`📊 Performance: ${name} = ${value.toFixed(2)}ms`, context);
    }
  }

  recordApiCall(endpoint: string, duration: number, success: boolean) {
    this.recordMetric('api_response_time', duration, {
      endpoint,
      success,
      isError: !success
    });
  }

  recordComponentRender(componentName: string, renderTime: number) {
    this.recordMetric('component_render_time', renderTime, {
      component: componentName
    });
  }

  recordUserInteraction(action: string, responseTime: number) {
    this.recordMetric('user_interaction_time', responseTime, {
      action
    });
  }

  generateReport(): PerformanceReport {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // 최근 5분

    const pageLoadMetrics = recentMetrics.filter(m => m.name === 'page_load_time');
    const renderMetrics = recentMetrics.filter(m => m.name === 'component_render_time');
    const apiMetrics = recentMetrics.filter(m => m.name === 'api_response_time');
    const interactionMetrics = recentMetrics.filter(m => m.name === 'user_interaction_time');

    return {
      pageLoadTime: pageLoadMetrics.length > 0 
        ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length 
        : 0,
      renderTime: renderMetrics.length > 0
        ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
        : 0,
      apiResponseTimes: apiMetrics.map(m => m.value),
      memoryUsage: this.getMemoryUsage(),
      interactionResponsiveness: interactionMetrics.length > 0
        ? interactionMetrics.reduce((sum, m) => sum + m.value, 0) / interactionMetrics.length
        : 0,
      errors: recentMetrics.filter(m => m.context?.isError).length
    };
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

// React Hook
import { useState, useEffect } from 'react';

export function usePerformanceMonitor() {
  const [report, setReport] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    const updateReport = () => {
      setReport(performanceMonitor.generateReport());
    };

    updateReport();
    const interval = setInterval(updateReport, 10000); // 10초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  return {
    report,
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    recordApiCall: performanceMonitor.recordApiCall.bind(performanceMonitor),
    recordComponentRender: performanceMonitor.recordComponentRender.bind(performanceMonitor),
    recordUserInteraction: performanceMonitor.recordUserInteraction.bind(performanceMonitor)
  };
}