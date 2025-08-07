import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, X, Bot, User } from "lucide-react"
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '안녕하세요! 출장비서 출삐입니다. 출장 관련해서 궁금한 것이 있으시면 언제든 물어보세요! 😊',
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // 외부에서 제어하는 경우 vs 내부 상태로 제어하는 경우
  const isOpen = position === 'sidebar' ? externalIsOpen : internalIsOpen
  const setIsOpen = position === 'sidebar' ? (value: boolean) => {
    if (!value && externalOnClose) externalOnClose()
  } : setInternalIsOpen
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
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
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          message: inputMessage,
          userId: user?.id,
          context: {
            previousMessages: messages.slice(-5) // 최근 5개 메시지만 컨텍스트로 전송
          }
        }
      })

      if (error) {
        throw error
      }

      if (data.success && data.reply) {
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
          // 출장 목록 새로고침을 위해 페이지 새로고침 (더 나은 방법은 상태 관리 사용)
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      } else {
        throw new Error(data.error || '응답을 받을 수 없습니다.')
      }
    } catch (error) {
      console.error('Chatbot error:', error)
      toast.error('챗봇 오류: ' + (error as Error).message)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '죄송합니다. 현재 서비스에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
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
    ? "fixed bottom-4 left-4 w-[calc(100vw-2rem)] sm:w-80 h-[70vh] sm:h-96 shadow-elegant z-50 flex flex-col md:bottom-20 md:left-6"
    : "fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-80 h-[70vh] sm:h-96 shadow-elegant z-50 flex flex-col"

  return (
    <Card className={cardClassName}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          출장비서 출삐
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 p-0 hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
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
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
              className="flex-1"
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