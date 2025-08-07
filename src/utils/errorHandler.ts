/**
 * 에러 처리 유틸리티
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
}

/**
 * Supabase 에러를 사용자 친화적 메시지로 변환
 */
export function handleSupabaseError(error: any): AppError {
  const defaultError: AppError = {
    code: 'UNKNOWN_ERROR',
    message: error?.message || '알 수 없는 오류가 발생했습니다.',
    userMessage: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  };

  if (!error) return defaultError;

  // 인증 오류
  if (error.message?.includes('invalid_credentials')) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: error.message,
      userMessage: '이메일 또는 비밀번호가 올바르지 않습니다.'
    };
  }

  // 이메일 중복
  if (error.message?.includes('already_registered')) {
    return {
      code: 'EMAIL_ALREADY_EXISTS',
      message: error.message,
      userMessage: '이미 등록된 이메일입니다.'
    };
  }

  // 권한 오류
  if (error.message?.includes('row-level security policy')) {
    return {
      code: 'PERMISSION_DENIED',
      message: error.message,
      userMessage: '접근 권한이 없습니다. 다시 로그인해주세요.'
    };
  }

  // 네트워크 오류
  if (error.message?.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: error.message,
      userMessage: '인터넷 연결을 확인해주세요.'
    };
  }

  // 입력 형식 오류
  if (error.message?.includes('invalid input syntax')) {
    return {
      code: 'INVALID_INPUT',
      message: error.message,
      userMessage: '입력한 정보의 형식이 올바르지 않습니다.'
    };
  }

  return defaultError;
}

/**
 * 폼 검증 에러 처리
 */
export function handleValidationError(errors: Array<{ field: string; message: string }>): string {
  if (errors.length === 0) return '';
  
  // 첫 번째 에러 메시지 반환
  return errors[0].message;
}

/**
 * 네트워크 연결 상태 확인
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * 에러 로깅 (개발 환경에서만)
 */
export function logError(error: any, context?: string): void {
  if (import.meta.env.DEV) {
    console.group(`🚨 Error${context ? ` in ${context}` : ''}`);
    console.error(error);
    console.groupEnd();
  }
}