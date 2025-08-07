import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import Register from '../Register'

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders first step correctly', () => {
    render(<Register />)
    
    expect(screen.getByText('출장 기본 정보를 입력해주세요')).toBeInTheDocument()
    expect(screen.getByLabelText('출발지')).toBeInTheDocument()
    expect(screen.getByLabelText('출장지')).toBeInTheDocument()
    expect(screen.getByLabelText('출장 목적')).toBeInTheDocument()
  })

  it('shows progress steps correctly', () => {
    render(<Register />)
    
    expect(screen.getByText('기본 정보')).toBeInTheDocument()
    expect(screen.getByText('이동 정보')).toBeInTheDocument()
    expect(screen.getByText('출장 유형')).toBeInTheDocument()
    expect(screen.getByText('숙박 정보')).toBeInTheDocument()
    expect(screen.getByText('확인')).toBeInTheDocument()
  })

  it('calculates distance when departure and destination are selected', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    // Select departure location
    const departureSelect = screen.getByRole('combobox', { name: /출발지/ })
    await user.click(departureSelect)
    await user.click(screen.getByText('서울특별시 중구'))
    
    // Select destination location
    const destinationSelect = screen.getByRole('combobox', { name: /출장지/ })
    await user.click(destinationSelect)
    await user.click(screen.getByText('부산광역시 해운대구'))
    
    await waitFor(() => {
      expect(screen.getByText('예상 거리:')).toBeInTheDocument()
      expect(screen.getByText('예상 시간:')).toBeInTheDocument()
      expect(screen.getByText('관외 출장')).toBeInTheDocument()
    })
  })

  it('shows internal trip for same region locations', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    // Select departure location in Seoul
    const departureSelect = screen.getByRole('combobox', { name: /출발지/ })
    await user.click(departureSelect)
    await user.click(screen.getByText('서울특별시 중구'))
    
    // Select destination location also in Seoul
    const destinationSelect = screen.getByRole('combobox', { name: /출장지/ })
    await user.click(destinationSelect)
    await user.click(screen.getByText('서울특별시 강남구'))
    
    await waitFor(() => {
      expect(screen.getByText('관내 출장')).toBeInTheDocument()
    })
  })

  it('handles day trip checkbox correctly', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    const dayTripCheckbox = screen.getByLabelText('하루 출장입니다')
    await user.click(dayTripCheckbox)
    
    // End date input should be hidden for day trips
    expect(screen.queryByLabelText('종료일')).not.toBeInTheDocument()
  })

  it('navigates to next step when next button is clicked', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    const nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('이동 정보를 입력해주세요')).toBeInTheDocument()
    })
  })

  it('shows transportation options in step 2', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    // Navigate to step 2
    const nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('교통수단')).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /교통수단/ })).toBeInTheDocument()
    })
  })

  it('shows custom transport input when "기타" is selected', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    // Navigate to step 2
    let nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    
    // Select "기타" transport option
    const transportSelect = screen.getByRole('combobox', { name: /교통수단/ })
    await user.click(transportSelect)
    await user.click(screen.getByText('기타'))
    
    await waitFor(() => {
      expect(screen.getByLabelText('기타 교통수단')).toBeInTheDocument()
    })
  })

  it('shows trip type selection in step 3', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    // Navigate to step 3
    let nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('출장 유형을 선택해주세요')).toBeInTheDocument()
      expect(screen.getByText('관내 출장')).toBeInTheDocument()
      expect(screen.getByText('관외 출장')).toBeInTheDocument()
    })
  })

  it('shows accommodation options in step 4', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    // Navigate to step 4
    let nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    await user.click(nextButton)
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('숙박 정보를 입력해주세요')).toBeInTheDocument()
      expect(screen.getByLabelText('숙박이 필요합니다')).toBeInTheDocument()
    })
  })

  it('shows accommodation details when accommodation is needed', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    // Navigate to step 4
    let nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    await user.click(nextButton)
    await user.click(nextButton)
    
    // Check accommodation needed
    const accommodationCheckbox = screen.getByLabelText('숙박이 필요합니다')
    await user.click(accommodationCheckbox)
    
    await waitFor(() => {
      expect(screen.getByText('숙박 유형')).toBeInTheDocument()
      expect(screen.getByLabelText('숙박 상세 정보')).toBeInTheDocument()
    })
  })

  it('shows confirmation details in final step', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    // Navigate to final step
    let nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    await user.click(nextButton)
    await user.click(nextButton)
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('입력 정보를 확인해주세요')).toBeInTheDocument()
      expect(screen.getByText('장소 정보')).toBeInTheDocument()
      expect(screen.getByText('일정 정보')).toBeInTheDocument()
    })
  })

  it('allows going back to previous steps', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    // Navigate to step 2
    let nextButton = screen.getByRole('button', { name: /다음/ })
    await user.click(nextButton)
    
    // Go back to step 1
    const backButton = screen.getByRole('button', { name: /이전/ })
    await user.click(backButton)
    
    await waitFor(() => {
      expect(screen.getByText('출장 기본 정보를 입력해주세요')).toBeInTheDocument()
    })
  })
})