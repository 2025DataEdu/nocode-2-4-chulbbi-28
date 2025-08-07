/**
 * API 요청 유틸리티
 * 재시도 로직과 타임아웃 처리 포함
 */

interface ApiOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 재시도 로직이 포함된 API 요청
 */
export async function apiRequest<T>(
  requestFn: () => Promise<T>,
  options: ApiOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    retries = 3,
    retryDelay = 1000
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 타임아웃 처리
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new ApiError('요청 시간이 초과되었습니다', 408, 'TIMEOUT')), timeout);
      });

      const result = await Promise.race([
        requestFn(),
        timeoutPromise
      ]);

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 마지막 시도이거나 재시도할 수 없는 에러인 경우
      if (attempt === retries || !shouldRetry(error)) {
        break;
      }

      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }

  throw lastError!;
}

/**
 * 재시도 가능한 에러인지 확인
 */
function shouldRetry(error: unknown): boolean {
  if (error instanceof ApiError) {
    // 서버 에러나 네트워크 에러는 재시도
    return error.status ? error.status >= 500 : true;
  }
  
  if (error instanceof Error) {
    // 네트워크 에러는 재시도
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('timeout');
  }

  return false;
}

/**
 * Supabase 요청을 위한 래퍼
 */
export async function supabaseRequest<T>(
  requestFn: () => Promise<{ data: T; error: any }>,
  options?: ApiOptions
): Promise<T> {
  return apiRequest(async () => {
    const { data, error } = await requestFn();
    
    if (error) {
      throw new ApiError(
        error.message || '요청 처리 중 오류가 발생했습니다',
        error.status || 500,
        error.code
      );
    }
    
    return data;
  }, options);
}