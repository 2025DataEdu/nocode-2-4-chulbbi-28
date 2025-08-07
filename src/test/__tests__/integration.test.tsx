import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import App from '@/App'

describe('Integration Tests', () => {
  it('completes full trip registration flow', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Start from dashboard
    expect(screen.getByText('출장 관리')).toBeInTheDocument()
    
    // Click on registration button
    const registerButton = screen.getByRole('button', { name: /새 출장 등록/i })
    await user.click(registerButton)
    
    // Should navigate to registration page
    await waitFor(() => {
      expect(screen.getByText('출장 기본 정보를 입력해주세요')).toBeInTheDocument()
    })
    
    // Fill in basic information
    const departureSelect = screen.getByRole('combobox', { name: /출발지/ })
    await user.click(departureSelect)
    await user.click(screen.getByText('서울특별시 중구'))
    
    const destinationSelect = screen.getByRole('combobox', { name: /출장지/ })
    await user.click(destinationSelect)
    await user.click(screen.getByText('부산광역시 해운대구'))
    
    const purposeInput = screen.getByLabelText('출장 목적')
    await user.type(purposeInput, '업무 회의')
    
    const startDateInput = screen.getByLabelText('출발일')
    await user.type(startDateInput, '2024-08-15')
    
    // Go to next step
    let nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    
    // Step 2: Transportation
    await waitFor(() => {
      expect(screen.getByText('이동 정보를 입력해주세요')).toBeInTheDocument()
    })
    
    const transportSelect = screen.getByRole('combobox', { name: /교통수단/ })
    await user.click(transportSelect)
    await user.click(screen.getByText('기차'))
    
    nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    
    // Step 3: Trip Type
    await waitFor(() => {
      expect(screen.getByText('출장 유형을 선택해주세요')).toBeInTheDocument()
    })
    
    const externalTripCard = screen.getByText('관외 출장').closest('div')
    if (externalTripCard) {
      await user.click(externalTripCard)
    }
    
    nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    
    // Step 4: Accommodation
    await waitFor(() => {
      expect(screen.getByText('숙박 정보를 입력해주세요')).toBeInTheDocument()
    })
    
    const accommodationCheckbox = screen.getByLabelText('숙박이 필요합니다')
    await user.click(accommodationCheckbox)
    
    await waitFor(async () => {
      const accommodationTypeSelect = screen.getByRole('combobox', { name: /숙박 유형/ })
      await user.click(accommodationTypeSelect)
      await user.click(screen.getByText('호텔'))
    })
    
    nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    
    // Step 5: Confirmation
    await waitFor(() => {
      expect(screen.getByText('입력 정보를 확인해주세요')).toBeInTheDocument()
      expect(screen.getByText('서울특별시 중구')).toBeInTheDocument()
      expect(screen.getByText('부산광역시 해운대구')).toBeInTheDocument()
      expect(screen.getByText('업무 회의')).toBeInTheDocument()
    })
  })

  it('navigates between dashboard tabs correctly', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Should be on dashboard
    expect(screen.getByText('출장 관리')).toBeInTheDocument()
    
    // Click on different tabs
    const plannedTab = screen.getByRole('tab', { name: /예정/i })
    await user.click(plannedTab)
    
    await waitFor(() => {
      expect(screen.getByText('예정된 출장이 없습니다')).toBeInTheDocument()
    })
    
    const completedTab = screen.getByRole('tab', { name: /완료/i })
    await user.click(completedTab)
    
    await waitFor(() => {
      expect(screen.getByText('완료된 출장이 없습니다')).toBeInTheDocument()
    })
  })

  it('handles sidebar navigation correctly', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Initially should be on dashboard
    expect(screen.getByText('출장 관리')).toBeInTheDocument()
    
    // Navigate using sidebar (if sidebar is rendered)
    const registerLink = screen.queryByRole('link', { name: /출장 등록/ })
    if (registerLink) {
      await user.click(registerLink)
      
      await waitFor(() => {
        expect(screen.getByText('출장 기본 정보를 입력해주세요')).toBeInTheDocument()
      })
    }
  })
})