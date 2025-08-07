import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import { Dashboard } from '../Dashboard'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard header correctly', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('출장 관리')).toBeInTheDocument()
    expect(screen.getByText('출장을 효율적으로 관리하세요')).toBeInTheDocument()
  })

  it('renders new trip registration button', () => {
    render(<Dashboard />)
    
    const registerButton = screen.getByRole('button', { name: /새 출장 등록/i })
    expect(registerButton).toBeInTheDocument()
  })

  it('navigates to register page when registration button is clicked', () => {
    render(<Dashboard />)
    
    const registerButton = screen.getByRole('button', { name: /새 출장 등록/i })
    fireEvent.click(registerButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/register')
  })

  it('renders statistics cards', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('진행중인 출장')).toBeInTheDocument()
    expect(screen.getByText('등록된 출장지')).toBeInTheDocument()
    expect(screen.getByText('예정된 출장')).toBeInTheDocument()
    expect(screen.getByText('완료된 출장')).toBeInTheDocument()
  })

  it('renders trip management tabs', () => {
    render(<Dashboard />)
    
    expect(screen.getByRole('tab', { name: /진행중/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /예정/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /완료/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /전체/i })).toBeInTheDocument()
  })

  it('displays empty state when no trips are available', () => {
    render(<Dashboard />)
    
    waitFor(() => {
      expect(screen.getByText('진행중인 출장이 없습니다')).toBeInTheDocument()
      expect(screen.getByText('새로운 출장을 등록하여 시작해보세요')).toBeInTheDocument()
    })
  })

  it('switches tabs correctly', () => {
    render(<Dashboard />)
    
    const plannedTab = screen.getByRole('tab', { name: /예정/i })
    fireEvent.click(plannedTab)
    
    waitFor(() => {
      expect(screen.getByText('예정된 출장이 없습니다')).toBeInTheDocument()
    })
  })

  it('shows recommendation section only for ongoing trips', async () => {
    render(<Dashboard />)
    
    // Initially should not show recommendations
    expect(screen.queryByText('출장지 정보 및 추천')).not.toBeInTheDocument()
    
    // Note: In a real test, you would mock the trips data to include ongoing trips
    // and verify that the recommendation section appears
  })
})