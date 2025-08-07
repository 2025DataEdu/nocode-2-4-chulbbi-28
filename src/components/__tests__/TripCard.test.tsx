import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { TripCard } from '../TripCard'

const mockTripData = {
  id: 'test-trip-1',
  destination: '서울특별시 강남구',
  startDate: '2024-08-15',
  endDate: '2024-08-16',
  status: 'ongoing' as const,
  budget: 500000,
  spent: 200000,
  type: '관외' as const,
}

describe('TripCard', () => {
  it('renders trip information correctly', () => {
    render(<TripCard {...mockTripData} />)
    
    expect(screen.getByText('서울특별시 강남구')).toBeInTheDocument()
    expect(screen.getByText('2024-08-15 ~ 2024-08-16')).toBeInTheDocument()
    expect(screen.getByText('관외 출장')).toBeInTheDocument()
  })

  it('displays correct status badge', () => {
    render(<TripCard {...mockTripData} />)
    
    expect(screen.getByText('진행중')).toBeInTheDocument()
  })

  it('shows budget information correctly', () => {
    render(<TripCard {...mockTripData} />)
    
    expect(screen.getByText('200,000원 / 500,000원')).toBeInTheDocument()
    expect(screen.getByText('40.0% 사용')).toBeInTheDocument()
  })

  it('displays planned status correctly', () => {
    const plannedTrip = { ...mockTripData, status: 'planned' as const }
    render(<TripCard {...plannedTrip} />)
    
    expect(screen.getByText('계획됨')).toBeInTheDocument()
  })

  it('displays completed status correctly', () => {
    const completedTrip = { ...mockTripData, status: 'completed' as const }
    render(<TripCard {...completedTrip} />)
    
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('handles high budget usage correctly', () => {
    const highSpentTrip = { ...mockTripData, spent: 450000 }
    render(<TripCard {...highSpentTrip} />)
    
    expect(screen.getByText('90.0% 사용')).toBeInTheDocument()
  })

  it('shows internal trip type correctly', () => {
    const internalTrip = { ...mockTripData, type: '관내' as const }
    render(<TripCard {...internalTrip} />)
    
    expect(screen.getByText('관내 출장')).toBeInTheDocument()
  })

  it('handles zero budget correctly', () => {
    const zeroBudgetTrip = { ...mockTripData, budget: 0, spent: 0 }
    render(<TripCard {...zeroBudgetTrip} />)
    
    expect(screen.getByText('0원 / 0원')).toBeInTheDocument()
    expect(screen.getByText('0.0% 사용')).toBeInTheDocument()
  })
})