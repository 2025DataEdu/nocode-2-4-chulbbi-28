import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { handleSupabaseError, logError } from '@/utils/errorHandler'
import { apiRequest } from '@/utils/apiUtils'

interface UseAsyncOperationOptions {
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  errorMessage?: string
}

/**
 * 비동기 작업을 처리하기 위한 커스텀 훅
 * 로딩 상태, 에러 처리, 토스트 메시지를 자동으로 관리
 */
export function useAsyncOperation<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  options: UseAsyncOperationOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = '작업이 완료되었습니다',
    errorMessage = '작업 중 오류가 발생했습니다'
  } = options

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiRequest(() => operation(...args))
      
      if (showSuccessToast) {
        toast.success(successMessage)
      }
      
      return result
    } catch (err) {
      const appError = handleSupabaseError(err)
      setError(appError.userMessage)
      
      if (showErrorToast) {
        toast.error(appError.userMessage)
      }
      
      logError(err, 'useAsyncOperation')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [operation, showSuccessToast, showErrorToast, successMessage, errorMessage])

  const reset = useCallback(() => {
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    execute,
    isLoading,
    error,
    reset
  }
}