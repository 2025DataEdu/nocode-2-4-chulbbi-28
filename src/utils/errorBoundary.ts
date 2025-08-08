/**
 * 에러 바운더리 및 전역 에러 처리 유틸리티
 */

import { logError } from './errorHandler';

export interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

/**
 * 전역 에러 핸들러 설정
 */
export function setupGlobalErrorHandlers() {
  // 처리되지 않은 Promise 거부 에러
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'Unhandled Promise Rejection');
    
    // 개발 환경에서만 콘솔에 표시
    if (import.meta.env.DEV) {
      console.warn('Unhandled promise rejection:', event.reason);
    }
    
    // 기본 브라우저 동작 방지 (선택사항)
    event.preventDefault();
  });

  // 일반적인 JavaScript 에러
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'Global Error');
    
    if (import.meta.env.DEV) {
      console.warn('Global error:', event.error || event.message);
    }
  });
}

/**
 * 컴포넌트 에러 정보 포맷팅
 */
export function formatErrorInfo(error: Error, errorInfo: ErrorInfo): string {
  return `
Error: ${error.message}
Stack: ${error.stack || 'No stack trace'}
Component Stack: ${errorInfo.componentStack || 'No component stack'}
`;
}

/**
 * 에러 복구 전략
 */
export function getErrorRecoveryAction(error: Error): 'retry' | 'reload' | 'navigate' | 'ignore' {
  const message = error.message.toLowerCase();
  
  // 네트워크 에러 - 재시도 권장
  if (message.includes('network') || message.includes('fetch')) {
    return 'retry';
  }
  
  // 청크 로드 에러 - 페이지 새로고침 권장
  if (message.includes('chunk') || message.includes('loading')) {
    return 'reload';
  }
  
  // 인증 에러 - 로그인 페이지로 이동
  if (message.includes('auth') || message.includes('unauthorized')) {
    return 'navigate';
  }
  
  // 기타 에러 - 무시하고 계속
  return 'ignore';
}