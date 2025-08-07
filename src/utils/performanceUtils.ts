/**
 * 성능 모니터링 및 최적화 유틸리티
 */

// 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 스로틀 함수
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 메모이제이션 유틸리티
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// 성능 측정
export function measurePerformance<T>(
  name: string,
  operation: () => T
): T {
  const startTime = performance.now();
  const result = operation();
  const endTime = performance.now();
  
  if (import.meta.env.DEV) {
    console.log(`⚡ ${name}: ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return result;
}

// 비동기 성능 측정
export async function measureAsyncPerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  
  if (import.meta.env.DEV) {
    console.log(`⚡ ${name}: ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return result;
}

// 브라우저 호환성 체크
export const browserSupport = {
  // Web API 지원 확인
  hasIntersectionObserver: () => 'IntersectionObserver' in window,
  hasLocalStorage: () => {
    try {
      return 'localStorage' in window && window.localStorage !== null;
    } catch {
      return false;
    }
  },
  hasIndexedDB: () => 'indexedDB' in window,
  hasServiceWorker: () => 'serviceWorker' in navigator,
  hasWebGL: () => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  },
};

// 성능 최적화를 위한 이미지 로딩
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// 배치 처리 유틸리티
export function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize: number = 10
): R[] {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = batch.map(processor);
    results.push(...batchResults);
    
    // 브라우저에게 제어권 양보
    if (i + batchSize < items.length) {
      setTimeout(() => {}, 0);
    }
  }
  
  return results;
}