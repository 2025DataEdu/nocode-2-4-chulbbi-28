/**
 * 성능 테스트 및 벤치마크
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { debounce, throttle, memoize, measurePerformance } from '@/utils/performanceUtils';

describe('Performance Utilities', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
  });

  describe('debounce', () => {
    it('should delay function execution', async () => {
      let counter = 0;
      const debouncedFn = debounce(() => counter++, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(counter).toBe(0);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(counter).toBe(1);
    });
  });

  describe('throttle', () => {
    it('should limit function calls', async () => {
      let counter = 0;
      const throttledFn = throttle(() => counter++, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(counter).toBe(1);

      await new Promise(resolve => setTimeout(resolve, 150));
      throttledFn();
      expect(counter).toBe(2);
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      let callCount = 0;
      const expensiveFn = (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoizedFn = memoize(expensiveFn);

      expect(memoizedFn(5)).toBe(10);
      expect(memoizedFn(5)).toBe(10);
      expect(callCount).toBe(1);

      expect(memoizedFn(10)).toBe(20);
      expect(callCount).toBe(2);
    });
  });

  describe('measurePerformance', () => {
    it('should measure execution time', () => {
      const result = measurePerformance('test-operation', () => {
        return Array.from({ length: 1000 }, (_, i) => i).reduce((a, b) => a + b, 0);
      });

      expect(result).toBe(499500);
    });
  });

  describe('Performance Monitor', () => {
    it('should record and retrieve metrics', () => {
      performanceMonitor.recordMetric('test-metric', 100, { test: true });
      
      const metrics = performanceMonitor.getMetrics('test-metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test-metric');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].context).toEqual({ test: true });
    });

    it('should generate performance report', () => {
      performanceMonitor.recordMetric('page_load_time', 1500);
      performanceMonitor.recordMetric('api_response_time', 200);
      performanceMonitor.recordMetric('component_render_time', 50);

      const report = performanceMonitor.generateReport();
      
      expect(report.pageLoadTime).toBe(1500);
      expect(report.apiResponseTimes).toContain(200);
      expect(report.renderTime).toBe(50);
    });

    it('should limit metrics storage', () => {
      // 메트릭 저장소 한계 테스트
      for (let i = 0; i < 1100; i++) {
        performanceMonitor.recordMetric('bulk-test', i);
      }

      const metrics = performanceMonitor.getMetrics('bulk-test');
      expect(metrics.length).toBeLessThanOrEqual(500);
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should measure component render performance', async () => {
    const startTime = performance.now();
    
    // 간단한 컴포넌트 렌더링 테스트 (JSX 없이)
    const testElement = document.createElement('div');
    testElement.setAttribute('data-testid', 'performance-test');
    
    for (let i = 0; i < 100; i++) {
      const itemElement = document.createElement('div');
      itemElement.textContent = `Item ${i}`;
      testElement.appendChild(itemElement);
    }
    
    document.body.appendChild(testElement);

    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // 100ms 이하로 렌더링되어야 함

    performanceMonitor.recordComponentRender('TestComponent', renderTime);
    
    // 정리
    document.body.removeChild(testElement);
  });

  it('should measure data processing performance', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random() * 100,
      category: `category-${i % 10}`
    }));

    const startTime = performance.now();
    
    // 데이터 처리 성능 테스트
    const processed = largeDataset
      .filter(item => item.value > 50)
      .map(item => ({ ...item, processed: true }))
      .sort((a, b) => b.value - a.value);

    const processingTime = performance.now() - startTime;
    
    expect(processingTime).toBeLessThan(50); // 50ms 이하로 처리되어야 함
    expect(processed.length).toBeGreaterThan(0);
    
    performanceMonitor.recordMetric('data_processing_time', processingTime, {
      dataSize: largeDataset.length,
      processedSize: processed.length
    });
  });
});