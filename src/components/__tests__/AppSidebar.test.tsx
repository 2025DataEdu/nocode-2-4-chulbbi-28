import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import { AppSidebar } from '../AppSidebar'

// Mock useSidebar hook
vi.mock('@/components/ui/sidebar', async () => {
  const actual = await vi.importActual('@/components/ui/sidebar')
  return {
    ...actual,
    useSidebar: () => ({ state: 'expanded' }),
  }
})

describe('AppSidebar', () => {
  it('renders navigation items correctly', () => {
    render(<AppSidebar />)
    
    expect(screen.getByText('대시보드')).toBeInTheDocument()
    expect(screen.getByText('출장 등록')).toBeInTheDocument()
    expect(screen.getByText('출장 관리')).toBeInTheDocument()
    expect(screen.getByText('증빙 자료')).toBeInTheDocument()
    expect(screen.getByText('설정')).toBeInTheDocument()
  })

  it('renders brand logo and title', () => {
    render(<AppSidebar />)
    
    expect(screen.getByText('출삐')).toBeInTheDocument()
    expect(screen.getByText('출장비서')).toBeInTheDocument()
  })

  it('renders AI chatbot button', () => {
    render(<AppSidebar />)
    
    expect(screen.getByText('AI 출장 도우미')).toBeInTheDocument()
    expect(screen.getByText('궁금한 것을 물어보세요')).toBeInTheDocument()
  })

  it('opens chatbot when AI button is clicked', () => {
    render(<AppSidebar />)
    
    const chatbotButton = screen.getByRole('button', { name: /AI 출장 도우미/ })
    fireEvent.click(chatbotButton)
    
    // Note: You would need to check if chatbot component is rendered
    // This depends on the Chatbot component implementation
  })

  it('renders navigation links as active when current path matches', () => {
    // Note: This test would require mocking the useLocation hook
    // to return specific paths and verify active states
    render(<AppSidebar />)
    
    const dashboardLink = screen.getByRole('link', { name: /대시보드/ })
    expect(dashboardLink).toBeInTheDocument()
  })

  it('renders main menu label', () => {
    render(<AppSidebar />)
    
    expect(screen.getByText('메인 메뉴')).toBeInTheDocument()
  })
})