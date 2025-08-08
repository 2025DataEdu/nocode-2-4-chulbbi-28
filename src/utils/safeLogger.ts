/**
 * 안전한 로깅 유틸리티
 * 프로덕션 환경에서는 민감한 정보를 제외하고 로깅
 */

interface LogContext {
  userId?: string;
  sessionId?: string;
  route?: string;
  timestamp?: string;
  [key: string]: any;
}

class SafeLogger {
  private isDev = import.meta.env.DEV;
  
  /**
   * 개발 환경에서만 console.log 출력
   */
  log(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`[LOG] ${message}`, context);
    }
  }

  /**
   * 개발 환경에서만 console.warn 출력
   */
  warn(message: string, context?: LogContext) {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  /**
   * 에러 로깅 (프로덕션에서도 출력하되 민감한 정보 제외)
   */
  error(message: string, error?: any, context?: LogContext) {
    const sanitizedContext = this.sanitizeContext(context);
    const errorInfo = this.sanitizeError(error);
    
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, errorInfo, sanitizedContext);
    } else {
      // 프로덕션에서는 기본적인 에러 정보만 출력
      console.error(`[ERROR] ${message}`, { 
        name: errorInfo?.name,
        message: errorInfo?.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 성능 메트릭 로깅
   */
  performance(operation: string, duration: number, context?: LogContext) {
    if (this.isDev) {
      console.log(`⚡ ${operation}: ${duration.toFixed(2)}ms`, context);
    }
  }

  /**
   * 민감한 정보 제거
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;
    
    const { userId, sessionId, ...safeContext } = context;
    
    return {
      ...safeContext,
      // 개발 환경에서만 사용자 식별 정보 포함
      ...(this.isDev && { userId, sessionId }),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 에러 객체에서 안전한 정보만 추출
   */
  private sanitizeError(error: any) {
    if (!error) return undefined;
    
    return {
      name: error.name,
      message: error.message,
      stack: this.isDev ? error.stack : undefined,
      ...(error.code && { code: error.code })
    };
  }
}

export const safeLogger = new SafeLogger();