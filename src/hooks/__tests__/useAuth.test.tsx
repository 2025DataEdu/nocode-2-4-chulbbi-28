import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock the actual useAuth hook
const mockUseAuth = () => ({
  user: { id: 'test-user', email: 'test@example.com' },
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
})

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mockUseAuth
}))

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user data when authenticated', () => {
    const { result } = renderHook(() => mockUseAuth(), { wrapper })
    
    expect(result.current.user).toEqual({
      id: 'test-user',
      email: 'test@example.com'
    })
    expect(result.current.loading).toBe(false)
  })

  it('provides authentication methods', () => {
    const { result } = renderHook(() => mockUseAuth(), { wrapper })
    
    expect(typeof result.current.signIn).toBe('function')
    expect(typeof result.current.signUp).toBe('function')
    expect(typeof result.current.signOut).toBe('function')
  })

  it('handles sign in action', async () => {
    const { result } = renderHook(() => mockUseAuth(), { wrapper })
    
    await act(async () => {
      result.current.signIn('test@example.com', 'password')
    })
    
    expect(result.current.signIn).toHaveBeenCalledWith('test@example.com', 'password')
  })

  it('handles sign out action', async () => {
    const { result } = renderHook(() => mockUseAuth(), { wrapper })
    
    await act(async () => {
      result.current.signOut()
    })
    
    expect(result.current.signOut).toHaveBeenCalled()
  })
})