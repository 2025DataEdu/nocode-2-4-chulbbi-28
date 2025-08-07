import { describe, it, expect } from 'vitest'

// Mock distance calculation utility
const calculateDistance = (departure: string, destination: string) => {
  const locations = [
    { value: 'seoul-jung', label: '서울특별시 중구', region: 'seoul' },
    { value: 'seoul-gangnam', label: '서울특별시 강남구', region: 'seoul' },
    { value: 'busan-haeundae', label: '부산광역시 해운대구', region: 'busan' },
  ]
  
  const depLocation = locations.find(loc => loc.value === departure)
  const destLocation = locations.find(loc => loc.value === destination)
  
  if (!depLocation || !destLocation) return null
  
  if (depLocation.region === destLocation.region) {
    return { distance: '15-30km', duration: '30분-1시간', type: 'internal' }
  } else {
    return { distance: '200-400km', duration: '3-5시간', type: 'external' }
  }
}

describe('Distance Calculation Utilities', () => {
  it('calculates internal trip distance correctly', () => {
    const result = calculateDistance('seoul-jung', 'seoul-gangnam')
    
    expect(result).toEqual({
      distance: '15-30km',
      duration: '30분-1시간',
      type: 'internal'
    })
  })

  it('calculates external trip distance correctly', () => {
    const result = calculateDistance('seoul-jung', 'busan-haeundae')
    
    expect(result).toEqual({
      distance: '200-400km',
      duration: '3-5시간',
      type: 'external'
    })
  })

  it('returns null for invalid locations', () => {
    const result = calculateDistance('invalid-location', 'seoul-jung')
    
    expect(result).toBeNull()
  })

  it('returns null when departure or destination is not found', () => {
    const result = calculateDistance('nonexistent', 'also-nonexistent')
    
    expect(result).toBeNull()
  })
})