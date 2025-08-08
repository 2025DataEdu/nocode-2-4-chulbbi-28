import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Send, X, Bot, User, RotateCcw, ChevronDown } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

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
      content: `안녕하세요! 출장비서 출삐입니다.
목적지와 일정을 함께 말씀해주세요.

예시: "서울 출장, 8월 6일~8일 매일 9시~6시"
출장 규정 확인 후 자동 등록해드립니다.
궁금한 점은 언제든 물어보세요.`,
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
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
      content: `안녕하세요! 출장비서 출삐입니다.
목적지와 일정을 함께 말씀해주세요.

예시: "서울 출장, 8월 6일~8일 매일 9시~6시"
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

  const suggestionQuestions = [
    {
      category: "출장 유형",
      questions: [
        "혼자 출장이신가요?",
        "동행자가 있나요?",
        "회사 공식 출장인가요?"
      ]
    },
    {
      category: "여가 활동",
      questions: [
        "여가시간에는 무얼 하고 싶으신가요?",
        "맛집 추천을 원하시나요?",
        "쇼핑몰이나 관광지도 알고 싶으신가요?"
      ]
    },
    {
      category: "숙박 및 교통",
      questions: [
        "호텔 추천이 필요하신가요?",
        "대중교통 정보가 필요한가요?",
        "렌터카가 필요하신가요?"
      ]
    },
    {
      category: "식사 및 모임",
      questions: [
        "비즈니스 미팅 장소를 찾고 계신가요?",
        "현지 맛집을 추천해드릴까요?",
        "회식 장소가 필요하신가요?"
      ]
    }
  ]

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
    : "fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-80 h-[500px] sm:h-[600px] max-h-[80vh] shadow-elegant z-50 flex flex-col"

  return (
    <Card className={cardClassName}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-primary text-primary-foreground rounded-t-lg flex-shrink-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          출장비서 출삐
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          className="h-6 w-6 p-0 hover:bg-white/20"
          title="대화 새로고침"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
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
                {message.content}
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
        {showSuggestions && messages.length === 1 && (
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
  )
}