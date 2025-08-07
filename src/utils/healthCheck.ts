/**
 * 애플리케이션 상태 진단 및 건강 체크 유틸리티
 */

import { supabase } from '@/integrations/supabase/client'
import { analytics } from './analytics'

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical'
  checks: {
    database: boolean
    auth: boolean
    network: boolean
    performance: boolean
    localStorage: boolean
  }
  issues: string[]
  recommendations: string[]
}

/**
 * 전체 시스템 건강 상태 체크
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'healthy',
    checks: {
      database: false,
      auth: false,
      network: false,
      performance: false,
      localStorage: false
    },
    issues: [],
    recommendations: []
  }

  try {
    // 1. 네트워크 연결 확인
    result.checks.network = navigator.onLine
    if (!result.checks.network) {
      result.issues.push('인터넷 연결이 끊어져 있습니다')
      result.recommendations.push('네트워크 연결을 확인해주세요')
    }

    // 2. LocalStorage 접근 확인
    try {
      localStorage.setItem('health_check', 'test')
      localStorage.removeItem('health_check')
      result.checks.localStorage = true
    } catch {
      result.checks.localStorage = false
      result.issues.push('로컬 스토리지에 접근할 수 없습니다')
      result.recommendations.push('브라우저 설정에서 로컬 스토리지를 허용해주세요')
    }

    // 3. 데이터베이스 연결 확인
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1)
      result.checks.database = !error
      if (error) {
        result.issues.push('데이터베이스 연결에 문제가 있습니다')
        result.recommendations.push('잠시 후 다시 시도해주세요')
      }
    } catch {
      result.checks.database = false
      result.issues.push('데이터베이스에 연결할 수 없습니다')
    }

    // 4. 인증 상태 확인
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      result.checks.auth = !error && !!user
      if (error || !user) {
        result.issues.push('인증 세션이 만료되었습니다')
        result.recommendations.push('다시 로그인해주세요')
      }
    } catch {
      result.checks.auth = false
    }

    // 5. 성능 지표 확인
    const metrics = analytics.getMetrics()
    const performanceIssues = analytics.detectPerformanceIssues()
    
    result.checks.performance = performanceIssues.length === 0
    if (performanceIssues.length > 0) {
      result.issues.push(...performanceIssues)
      result.recommendations.push('페이지를 새로고침하거나 브라우저 캐시를 정리해보세요')
    }

    // 전체 상태 결정
    const failedChecks = Object.values(result.checks).filter(check => !check).length
    
    if (failedChecks === 0) {
      result.status = 'healthy'
    } else if (failedChecks <= 2) {
      result.status = 'warning'
    } else {
      result.status = 'critical'
    }

    // Analytics 기록
    analytics.track('health_check_completed', {
      status: result.status,
      failedChecks,
      issuesCount: result.issues.length,
      checks: result.checks
    })

  } catch (error) {
    result.status = 'critical'
    result.issues.push('건강 체크 중 예상치 못한 오류가 발생했습니다')
    
    analytics.trackError(
      error instanceof Error ? error : new Error(String(error)),
      'healthCheck'
    )
  }

  return result
}

/**
 * 빠른 연결 상태 확인
 */
export function quickConnectivityCheck(): boolean {
  return navigator.onLine && !!localStorage
}

/**
 * 메모리 사용량 체크 (가능한 경우)
 */
export function checkMemoryUsage(): { available: boolean; usage?: number } {
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory
    return {
      available: true,
      usage: memory.usedJSHeapSize / memory.totalJSHeapSize
    }
  }
  
  return { available: false }
}

/**
 * 브라우저 호환성 체크
 */
export function checkBrowserCompatibility(): {
  compatible: boolean
  issues: string[]
  features: Record<string, boolean>
} {
  const features = {
    localStorage: typeof Storage !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    promise: typeof Promise !== 'undefined',
    es6Modules: typeof Symbol !== 'undefined',
    webSockets: typeof WebSocket !== 'undefined'
  }

  const issues: string[] = []
  
  Object.entries(features).forEach(([feature, supported]) => {
    if (!supported) {
      issues.push(`${feature} 기능이 지원되지 않습니다`)
    }
  })

  return {
    compatible: issues.length === 0,
    issues,
    features
  }
}

/**
 * 자동 복구 시도
 */
export async function attemptAutoRecovery(): Promise<boolean> {
  try {
    // 1. 로컬 스토리지 정리
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('temp_') || key.startsWith('cache_'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch {
      // 무시
    }

    // 2. 인증 토큰 새로고침 시도
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        throw error
      }
    } catch {
      // 인증 실패는 무시 (사용자가 수동으로 로그인해야 함)
    }

    // 3. 건강 체크 재실행
    const healthResult = await performHealthCheck()
    
    analytics.track('auto_recovery_attempted', {
      success: healthResult.status !== 'critical',
      finalStatus: healthResult.status
    })

    return healthResult.status !== 'critical'
  } catch (error) {
    analytics.trackError(
      error instanceof Error ? error : new Error(String(error)),
      'autoRecovery'
    )
    return false
  }
}