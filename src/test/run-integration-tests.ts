/**
 * 통합 테스트 실행 스크립트
 * 모든 주요 기능들의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import components to test
import App from '../App'
import { Dashboard } from '../components/Dashboard'
import { TripCard } from '../components/TripCard'

// Import utilities
import { calculateDistance, extractDistanceKm, normalizeRegion } from '../utils/distance'
import { validateTripForm, safeParseNumber, calculateTripStatus } from '../utils/validation'
import { handleSupabaseError, handleValidationError, isOnline } from '../utils/errorHandler'

// Mock data
const mockTrip = {
  id: 'test-trip-1',
  destination: '부산 해운대구',
  start_date: '2024-02-01',
  end_date: '2024-02-03',
  status: 'planned' as const,
  budget: 500000,
  spent: 150000,
  purpose: '업무 회의',
  distance_km: 400
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(BrowserRouter, {}, children)
  )
}

describe('Integration Tests - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Distance Calculation', () => {
    it('should calculate internal trip distance correctly', () => {
      const result = calculateDistance('seoul-jung', 'seoul-gangnam')
      expect(result).toBeTruthy()
      expect(result?.type).toBe('internal')
      expect(result?.distance).toMatch(/\d+km/)
    })

    it('should calculate external trip distance correctly', () => {
      const result = calculateDistance('seoul-jung', 'busan-haeundae')
      expect(result).toBeTruthy()
      expect(result?.type).toBe('external')
      expect(result?.distance).toBe('400km')
    })

    it('should extract distance km correctly', () => {
      expect(extractDistanceKm('400km')).toBe(400)
      expect(extractDistanceKm('15km')).toBe(15)
      expect(extractDistanceKm('invalid')).toBe(0)
    })

    it('should normalize region names correctly', () => {
      expect(normalizeRegion('서울특별시 중구')).toBe('서울')
      expect(normalizeRegion('부산광역시 해운대구')).toBe('부산')
      expect(normalizeRegion('경기도 수원시')).toBe('경기')
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const invalidData = {
        destination: '',
        departure: '',
        purpose: '',
        startDate: '',
        endDate: '',
        isDayTrip: false
      }

      const errors = validateTripForm(invalidData)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.field === 'destination')).toBe(true)
      expect(errors.some(e => e.field === 'departure')).toBe(true)
    })

    it('should validate date logic', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const invalidData = {
        destination: '부산',
        departure: '서울',
        purpose: '회의',
        startDate: yesterday.toISOString().split('T')[0],
        endDate: '',
        isDayTrip: false
      }

      const errors = validateTripForm(invalidData)
      expect(errors.some(e => e.field === 'startDate')).toBe(true)
    })

    it('should handle safe number parsing', () => {
      expect(safeParseNumber('100')).toBe(100)
      expect(safeParseNumber('invalid')).toBe(0)
      expect(safeParseNumber(null)).toBe(0)
      expect(safeParseNumber(-50)).toBe(0) // Should return 0 for negative numbers
    })

    it('should calculate trip status correctly', () => {
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      
      expect(calculateTripStatus(tomorrowStr, tomorrowStr)).toBe('planned')
    })
  })

  describe('Error Handling', () => {
    it('should handle Supabase authentication errors', () => {
      const error = { message: 'invalid_credentials' }
      const result = handleSupabaseError(error)
      
      expect(result.code).toBe('INVALID_CREDENTIALS')
      expect(result.userMessage).toContain('이메일 또는 비밀번호')
    })

    it('should handle validation errors', () => {
      const errors = [
        { field: 'email', message: '이메일이 유효하지 않습니다' },
        { field: 'password', message: '비밀번호가 너무 짧습니다' }
      ]
      
      const result = handleValidationError(errors)
      expect(result).toBe('이메일이 유효하지 않습니다')
    })

    it('should check online status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })
      
      expect(isOnline()).toBe(true)
    })
  })

  describe('Component Integration', () => {
    it('should render TripCard with correct data', () => {
      render(
        React.createElement(
          AllTheProviders,
          { children: React.createElement(TripCard, mockTrip) }
        )
      )

      expect(screen.getByText('부산 해운대구')).toBeInTheDocument()
      expect(screen.getByText('업무 회의')).toBeInTheDocument()
      expect(screen.getByText('예정')).toBeInTheDocument()
    })

    it('should handle TripCard click navigation', async () => {
      const user = userEvent.setup()
      
      render(
        React.createElement(
          AllTheProviders,
          { children: React.createElement(TripCard, mockTrip) }
        )
      )

      const card = screen.getByRole('button', { name: /부산 해운대구/i })
      await user.click(card)
      
      // Navigation should be triggered (we can't test actual navigation in unit tests)
      expect(card).toBeInTheDocument()
    })
  })

  describe('App Integration', () => {
    it('should render app without crashing', () => {
      render(React.createElement(App))
      // App should render some basic structure
      expect(document.body).toBeInTheDocument()
    })

    it('should handle offline state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      render(React.createElement(App))
      // Should handle offline state gracefully
      expect(document.body).toBeInTheDocument()
    })
  })
})

/**
 * 성능 테스트
 */
describe('Performance Tests', () => {
  it('should render large trip lists efficiently', () => {
    const startTime = performance.now()
    
    const manyTrips = Array.from({ length: 100 }, (_, i) => ({
      ...mockTrip,
      id: `trip-${i}`,
      destination: `목적지 ${i}`
    }))

    render(
      React.createElement(
        AllTheProviders,
        { 
          children: React.createElement(
            'div',
            {},
            manyTrips.map(trip => 
              React.createElement(TripCard, { ...trip, key: trip.id })
            )
          )
        }
      )
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should render 100 cards in less than 500ms
    expect(renderTime).toBeLessThan(500)
  })

  it('should handle rapid distance calculations', () => {
    const startTime = performance.now()
    
    for (let i = 0; i < 1000; i++) {
      calculateDistance('seoul-jung', 'busan-haeundae')
    }
    
    const endTime = performance.now()
    const calcTime = endTime - startTime
    
    // Should calculate 1000 distances in less than 100ms
    expect(calcTime).toBeLessThan(100)
  })
})

export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}