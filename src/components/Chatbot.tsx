import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { MessageSquare, Send, X, Bot, User, RotateCcw, ChevronDown, Move, GripVertical } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { FormattedMessage } from "@/components/FormattedMessage"

interface ChatbotProps {
  isOpen?: boolean
  onClose?: () => void
  position?: 'floating' | 'sidebar'
}

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export function Chatbot({ isOpen: externalIsOpen, onClose: externalOnClose, position = 'floating' }: ChatbotProps = {}) {
  const { user } = useAuth()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `**안녕하세요! 출장비서 출삐입니다.**
**목적지와 일정을 함께 말씀해주세요.**

**예시:** **서울 출장, 8월 6일 - 8일 매일 9시 - 6시**
출장 규정 확인 후 자동 등록해드립니다.
궁금한 점은 언제든 물어보세요.`,
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [chatbotSize, setChatbotSize] = useState({ width: 320, height: 600 })
  const [isResizing, setIsResizing] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatbotRef = useRef<HTMLDivElement>(null)
  
  // 외부에서 제어하는 경우 vs 내부 상태로 제어하는 경우
  const isOpen = position === 'sidebar' ? externalIsOpen : internalIsOpen
  const setIsOpen = position === 'sidebar' ? (value: boolean) => {
    if (!value && externalOnClose) externalOnClose()
  } : setInternalIsOpen
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        scrollAreaRef.current!.scrollTop = scrollAreaRef.current!.scrollHeight
        setShowScrollButton(false)
      }, 100)
    }
  }

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom && scrollHeight > clientHeight)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // 리사이즈 기능 - 더 나은 드래그 경험을 위한 상태
  const [isDragging, setIsDragging] = useState(false)
  
  const handleResizeStart = (e: React.MouseEvent) => {
    if (position !== 'floating') return
    
    e.preventDefault()
    setIsResizing(true)
    setIsDragging(true)
    
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = chatbotSize.width
    const startHeight = chatbotSize.height
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      
      const newWidth = Math.min(Math.max(startWidth + deltaX, 280), window.innerWidth * 0.8)
      const newHeight = Math.min(Math.max(startHeight + deltaY, 400), window.innerHeight * 0.8)
      
      setChatbotSize({ width: newWidth, height: newHeight })
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setShowSuggestions(false) // 메시지 전송 후 추천 질문 숨기기
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = '40px'
    }
    
    setIsLoading(true)

    try {
      // 네트워크 연결 확인
      if (!navigator.onLine) {
        throw new Error('인터넷 연결을 확인해주세요');
      }
      
      // 타임아웃을 포함한 안전한 API 호출
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃
      
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          message: inputMessage.trim(),
          userId: user?.id || null,
          context: {
            previousMessages: messages.slice(-5).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }
        }
      });

      clearTimeout(timeoutId);

      if (error) {
        throw new Error(error.message || '챗봇 서비스에 연결할 수 없습니다');
      }

      if (data?.success && data?.reply) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.reply,
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
        
        // 출장이 성공적으로 저장된 경우 토스트 표시
        if (data.tripSaved) {
          toast.success('출장이 성공적으로 등록되었습니다!')
          // 대시보드 업데이트 이벤트 발송
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('tripUpdated'))
          }, 1000)
        }
      } else {
        throw new Error(data.error || '응답을 받을 수 없습니다.')
      }
    } catch (error) {
      console.error('Chatbot error:', error)
      
      // 에러 메시지 개선
      let errorMessage = '죄송합니다. 현재 서비스에 문제가 있습니다. 잠시 후 다시 시도해주세요.'
      
      if (error instanceof Error) {
        if (error.message.includes('인터넷 연결')) {
          errorMessage = '인터넷 연결을 확인해주세요.'
        } else if (error.message.includes('timeout')) {
          errorMessage = '응답 시간이 초과되었습니다. 다시 시도해주세요.'
        } else if (error.message.includes('NetworkError')) {
          errorMessage = '네트워크 오류가 발생했습니다. 연결 상태를 확인해주세요.'
        }
      }
      
      toast.error(errorMessage)
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    // shift+enter는 줄바꿈으로 처리 (기본 동작 유지)
  }
  
  const handleClearChat = () => {
    setMessages([{
      id: '1',
      content: `**안녕하세요! 출장비서 출삐입니다.**
**목적지와 일정을 함께 말씀해주세요.**

**예시:** **서울 출장, 8월 6일 - 8일 매일 9시 - 6시**
출장 규정 확인 후 자동 등록해드립니다.
궁금한 점은 언제든 물어보세요.`,
      role: 'assistant',
      timestamp: new Date()
    }])
    setShowSuggestions(true) // 대화 초기화 시 추천 질문 다시 보이기
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  // 대화 맥락 기반 추천 질문 생성
  const getContextualSuggestions = () => {
    if (messages.length <= 1) {
      // 초기 상태
      return [
        {
          category: "출장 관련",
          questions: [
            "숙소 추천해줘",
            "영수증 잃어버렸는데 여비 나올까?",
            "당일치기 출장 여비는 얼마야?"
          ]
        },
        {
          category: "여비 규정",
          questions: [
            "숙박비 한도가 얼마야?",
            "관외 출장 일비는 얼마야?",
            "교통비 규정 알려줘"
          ]
        }
      ]
    }

    const lastMessage = messages[messages.length - 1]
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || ''
    const lastAssistantMessage = lastMessage.role === 'assistant' ? lastMessage.content.toLowerCase() : ''
    
    // 숙소 관련 대화 후
    if (lastUserMessage.includes('숙소') || lastUserMessage.includes('호텔') || lastAssistantMessage.includes('호텔') || lastAssistantMessage.includes('숙박')) {
      return [
        {
          category: "숙소 관련",
          questions: [
            "다른 지역 숙소도 추천해줘",
            "숙박비 한도가 얼마야?",
            "호텔 예약은 언제까지 해야 해?"
          ]
        },
        {
          category: "출장 계획",
          questions: [
            "교통편도 알아봐줘",
            "출장 일정 짜줘",
            "출장비 총액 계산해줘"
          ]
        }
      ]
    }
    
    // 여비 규정 관련 대화 후
    if (lastUserMessage.includes('여비') || lastUserMessage.includes('규정') || lastUserMessage.includes('한도') || lastAssistantMessage.includes('한도') || lastAssistantMessage.includes('여비')) {
      return [
        {
          category: "여비 상세",
          questions: [
            "다른 항목 여비도 알려줘",
            "영수증 없으면 어떻게 해?",
            "관외출장과 관내출장 차이가 뭐야?"
          ]
        },
        {
          category: "출장 실행",
          questions: [
            "출장 등록해줘",
            "출장비 미리 계산해줘",
            "체크리스트 알려줘"
          ]
        }
      ]
    }
    
    // 출장 등록 관련 대화 후  
    if (lastUserMessage.includes('등록') || lastUserMessage.includes('출장') || lastAssistantMessage.includes('등록') || lastAssistantMessage.includes('저장')) {
      return [
        {
          category: "등록 후속",
          questions: [
            "출장 계획 확인해줘",
            "필요한 준비물 알려줘",
            "출장비 예상 금액은?"
          ]
        },
        {
          category: "추가 정보",
          questions: [
            "숙소 추천해줘",
            "현지 맛집 알려줘",
            "교통편 정보 줘"
          ]
        }
      ]
    }
    
    // 영수증 관련 대화 후
    if (lastUserMessage.includes('영수증') || lastUserMessage.includes('잃어버') || lastAssistantMessage.includes('영수증')) {
      return [
        {
          category: "영수증 처리",
          questions: [
            "영수증 재발급 방법은?",
            "카드 내역서도 인정돼?",
            "영수증 없이 정산 가능한 항목은?"
          ]
        },
        {
          category: "정산 관련",
          questions: [
            "정산 기한이 언제야?",
            "정산 서류 어떻게 제출해?",
            "출장비 언제 나와?"
          ]
        }
      ]
    }
    
    // 기본 추천 (맥락에 맞지 않는 경우)
    return [
      {
        category: "인기 질문",
        questions: [
          "출장 등록해줘",
          "숙소 추천해줘",
          "여비 규정 알려줘"
        ]
      },
      {
        category: "자주 묻는 질문",
        questions: [
          "영수증 분실 시 처리 방법은?",
          "출장비 계산해줘",
          "출장 체크리스트 알려줘"
        ]
      }
    ]
  }

  const suggestionQuestions = getContextualSuggestions()

  const handleSuggestionClick = (question: string) => {
    setInputMessage(question)
    setShowSuggestions(false)
    // 자동으로 입력창에 포커스
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  if (!isOpen && position === 'floating') {
    return (
      <Button
        onClick={() => setInternalIsOpen(true)}
        className="fixed bottom-4 right-4 h-12 w-12 sm:h-14 sm:w-14 sm:bottom-6 sm:right-6 rounded-full bg-gradient-primary hover:shadow-medium transition-smooth z-50"
        size="lg"
      >
        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    )
  }

  if (!isOpen) {
    return null
  }

  const cardClassName = position === 'sidebar' 
    ? "w-full h-full shadow-none border-0 rounded-none flex flex-col overflow-hidden"
    : `fixed bottom-4 right-4 shadow-elegant z-50 flex flex-col ${isResizing ? 'select-none' : ''}`
  
  const cardStyle = position === 'floating' ? {
    width: `${chatbotSize.width}px`,
    height: `${chatbotSize.height}px`,
    maxHeight: '80vh'
  } : undefined

  return (
    <div className={position === 'floating' ? 'fixed bottom-4 right-4 z-50' : 'w-full h-full'}>
      {position === 'floating' ? (
        <ResizablePanelGroup direction="horizontal" className="min-w-[280px] max-w-[600px] shadow-elegant rounded-lg overflow-hidden">
          <ResizablePanel defaultSize={100} minSize={30} maxSize={100}>
            <Card 
              ref={chatbotRef} 
              className="w-full h-full shadow-none border-0 rounded-none flex flex-col overflow-hidden"
              style={{ height: `${chatbotSize.height}px` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-primary text-primary-foreground flex-shrink-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  출장비서 출삐
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearChat}
                    className="h-6 w-6 p-0 hover:bg-white/20"
                    title="대화 새로고침"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInternalIsOpen(false)}
                    className="h-6 w-6 p-0 hover:bg-white/20"
                    title="닫기"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                  ref={scrollAreaRef}
                  onScroll={handleScroll}
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[200px] sm:max-w-[240px] p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-primary text-primary-foreground ml-1 sm:ml-2'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <FormattedMessage content={message.content} />
                      </div>

                      {message.role === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted p-3 rounded-lg text-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 아래로 스크롤 버튼 */}
                {showScrollButton && (
                  <Button
                    onClick={scrollToBottom}
                    className="absolute bottom-20 right-6 h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 z-10"
                    size="sm"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                )}

                {/* 추천 질문 섹션 */}
                {showSuggestions && (
                  <div className="px-4 pb-2">
                    <div className="text-xs text-muted-foreground mb-2">💡 추천 질문</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {suggestionQuestions.map((category, categoryIndex) => (
                        <div key={categoryIndex}>
                          <div className="text-xs font-medium text-muted-foreground mb-1">{category.category}</div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {category.questions.map((question, questionIndex) => (
                              <button
                                key={questionIndex}
                                onClick={() => handleSuggestionClick(question)}
                                className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded transition-colors"
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 border-t border-border flex-shrink-0">
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      placeholder="메시지를 입력하세요..."
                      disabled={isLoading}
                      className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      rows={1}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      size="sm"
                      className="bg-gradient-primary hover:shadow-medium transition-smooth"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={0} minSize={0} maxSize={0} className="hidden" />
        </ResizablePanelGroup>
      ) : (
        <Card 
          ref={chatbotRef} 
          className={cardClassName} 
          style={cardStyle}
        >
          {/* 사이드바 모드에는 리사이즈 핸들이 없음 */}
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-primary text-primary-foreground rounded-t-lg flex-shrink-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              출장비서 출삐
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="h-6 w-6 p-0 hover:bg-white/20"
                title="대화 새로고침"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {position !== 'sidebar' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInternalIsOpen(false)}
                  className="h-6 w-6 p-0 hover:bg-white/20"
                  title="닫기"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
              ref={scrollAreaRef}
              onScroll={handleScroll}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[200px] sm:max-w-[240px] p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-primary text-primary-foreground ml-1 sm:ml-2'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <FormattedMessage content={message.content} />
                  </div>

                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 아래로 스크롤 버튼 */}
            {showScrollButton && (
              <Button
                onClick={scrollToBottom}
                className="absolute bottom-20 right-6 h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 z-10"
                size="sm"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}

            {/* 추천 질문 섹션 */}
            {showSuggestions && (
              <div className="px-4 pb-2">
                <div className="text-xs text-muted-foreground mb-2">💡 추천 질문</div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {suggestionQuestions.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <div className="text-xs font-medium text-muted-foreground mb-1">{category.category}</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {category.questions.map((question, questionIndex) => (
                          <button
                            key={questionIndex}
                            onClick={() => handleSuggestionClick(question)}
                            className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded transition-colors"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-border flex-shrink-0">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  disabled={isLoading}
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  rows={1}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="bg-gradient-primary hover:shadow-medium transition-smooth"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}