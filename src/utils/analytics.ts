/**
 * 애플리케이션 분석 및 성능 모니터링 유틸리티
 */

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp: number
  userId?: string
  sessionId: string
}

interface PerformanceMetrics {
  pageLoadTime: number
  apiResponseTime: number
  errorCount: number
  userInteractions: number
}

class Analytics {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private metrics: PerformanceMetrics = {
    pageLoadTime: 0,
    apiResponseTime: 0,
    errorCount: 0,
    userInteractions: 0
  }

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializePerformanceTracking()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializePerformanceTracking() {
    // 페이지 로드 시간 측정
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
        this.metrics.pageLoadTime = loadTime
        this.track('page_load', { loadTime })
      })
    }
  }

  /**
   * 이벤트 추적
   */
  track(event: string, properties?: Record<string, any>, userId?: string) {
    if (import.meta.env.DEV) {
      console.log(`📊 Analytics: ${event}`, properties)
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId,
      sessionId: this.sessionId
    }

    this.events.push(analyticsEvent)

    // 이벤트 저장소 크기 제한 (메모리 절약)
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500)
    }
  }

  /**
   * 에러 추적
   */
  trackError(error: Error, context?: string, additionalData?: Record<string, any>) {
    this.metrics.errorCount++
    
    this.track('error_occurred', {
      error: error.message,
      stack: error.stack,
      context,
      errorCount: this.metrics.errorCount,
      ...additionalData
    })
  }

  /**
   * API 응답 시간 추적
   */
  trackApiCall(endpoint: string, duration: number, success: boolean) {
    this.metrics.apiResponseTime = (this.metrics.apiResponseTime + duration) / 2 // 평균 계산
    
    this.track('api_call', {
      endpoint,
      duration,
      success,
      averageResponseTime: this.metrics.apiResponseTime
    })
  }

  /**
   * 사용자 인터랙션 추적
   */
  trackUserInteraction(action: string, element?: string, properties?: Record<string, any>) {
    this.metrics.userInteractions++
    
    this.track('user_interaction', {
      action,
      element,
      interactionCount: this.metrics.userInteractions,
      ...properties
    })
  }

  /**
   * 출장 관련 이벤트 추적
   */
  trackTripEvent(eventType: 'created' | 'updated' | 'deleted' | 'viewed', tripData?: Record<string, any>) {
    this.track(`trip_${eventType}`, {
      tripId: tripData?.id,
      destination: tripData?.destination,
      budget: tripData?.budget,
      ...tripData
    })
  }

  /**
   * 현재 세션 메트릭스 반환
   */
  getMetrics(): PerformanceMetrics & { sessionId: string; eventCount: number } {
    return {
      ...this.metrics,
      sessionId: this.sessionId,
      eventCount: this.events.length
    }
  }

  /**
   * 이벤트 히스토리 반환 (개발환경에서만)
   */
  getEventHistory(): AnalyticsEvent[] {
    return import.meta.env.DEV ? [...this.events] : []
  }

  /**
   * 성능 문제 감지
   */
  detectPerformanceIssues(): string[] {
    const issues: string[] = []

    if (this.metrics.pageLoadTime > 3000) {
      issues.push('페이지 로드 시간이 3초를 초과합니다')
    }

    if (this.metrics.apiResponseTime > 2000) {
      issues.push('API 응답 시간이 평균 2초를 초과합니다')
    }

    if (this.metrics.errorCount > 5) {
      issues.push('세션 중 5개 이상의 에러가 발생했습니다')
    }

    return issues
  }

  /**
   * 분석 데이터 초기화
   */
  reset() {
    this.events = []
    this.metrics = {
      pageLoadTime: 0,
      apiResponseTime: 0,
      errorCount: 0,
      userInteractions: 0
    }
    this.sessionId = this.generateSessionId()
  }
}

// 싱글톤 인스턴스 생성
export const analytics = new Analytics()

/**
 * React Hook for analytics
 */
import { useEffect } from 'react'

export function useAnalytics(pageName: string) {
  useEffect(() => {
    analytics.track('page_view', { pageName })
    
    return () => {
      analytics.track('page_leave', { 
        pageName,
        timeSpent: Date.now() // 실제로는 시작 시간을 저장해야 함
      })
    }
  }, [pageName])

  return {
    trackEvent: analytics.track.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackUserInteraction: analytics.trackUserInteraction.bind(analytics),
    trackTripEvent: analytics.trackTripEvent.bind(analytics)
  }
}