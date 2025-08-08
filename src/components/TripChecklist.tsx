import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, CheckCircle2, Clock, AlertCircle, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ChecklistItem {
  id: string
  title: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  category: string
}

interface ChecklistCategory {
  id: string
  title: string
  description: string
  icon: string
  items: ChecklistItem[]
  required: boolean
}

interface TripChecklistProps {
  tripId: string
  tripStatus: string
}

export function TripChecklist({ tripId, tripStatus }: TripChecklistProps) {
  const { toast } = useToast()
  const [checklist, setChecklist] = useState<ChecklistCategory[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)

  // 출장 단계별 체크리스트 템플릿
  const checklistTemplate: ChecklistCategory[] = [
    {
      id: 'planning',
      title: '출장 계획 수립',
      description: '출장의 기본 계획을 수립합니다',
      icon: '📋',
      required: true,
      items: [
        { id: 'destination', title: '목적지 및 일정 확정', completed: false, priority: 'high', category: 'planning' },
        { id: 'purpose', title: '출장 목적 및 업무 내용 정리', completed: false, priority: 'high', category: 'planning' },
        { id: 'budget', title: '예산 계획 수립', completed: false, priority: 'medium', category: 'planning' },
        { id: 'contacts', title: '현지 연락처 확보', completed: false, priority: 'medium', category: 'planning' },
        { id: 'documents', title: '필요 서류 준비 (신분증, 명함 등)', completed: false, priority: 'low', category: 'planning' }
      ]
    },
    {
      id: 'approval',
      title: '승인 및 결재',
      description: '출장 승인 및 관련 절차를 완료합니다',
      icon: '✅',
      required: true,
      items: [
        { id: 'request', title: '출장 승인 요청서 작성', completed: false, priority: 'high', category: 'approval' },
        { id: 'manager_approval', title: '상급자 승인 완료', completed: false, priority: 'high', category: 'approval' },
        { id: 'travel_order', title: '출장명령서 발급', completed: false, priority: 'medium', category: 'approval' },
        { id: 'insurance', title: '출장 보험 가입 확인', completed: false, priority: 'low', category: 'approval' }
      ]
    },
    {
      id: 'booking',
      title: '예약 및 준비',
      description: '교통편, 숙박 등을 예약합니다',
      icon: '🎫',
      required: true,
      items: [
        { id: 'transport', title: '교통편 예약 (항공, 기차, 버스)', completed: false, priority: 'high', category: 'booking' },
        { id: 'accommodation', title: '숙박시설 예약', completed: false, priority: 'high', category: 'booking' },
        { id: 'rental_car', title: '렌터카 예약 (필요시)', completed: false, priority: 'medium', category: 'booking' },
        { id: 'local_transport', title: '현지 교통편 확인', completed: false, priority: 'medium', category: 'booking' },
        { id: 'meeting_room', title: '회의실 예약 (필요시)', completed: false, priority: 'low', category: 'booking' }
      ]
    },
    {
      id: 'preparation',
      title: '출장 준비',
      description: '출장에 필요한 물품을 준비합니다',
      icon: '🎒',
      required: false,
      items: [
        { id: 'packing', title: '출장용품 패킹', completed: false, priority: 'medium', category: 'preparation' },
        { id: 'laptop', title: '노트북 및 업무 장비 준비', completed: false, priority: 'high', category: 'preparation' },
        { id: 'chargers', title: '충전기 및 어댑터 준비', completed: false, priority: 'medium', category: 'preparation' },
        { id: 'business_cards', title: '명함 준비', completed: false, priority: 'medium', category: 'preparation' },
        { id: 'emergency_kit', title: '비상약품 및 구급용품', completed: false, priority: 'low', category: 'preparation' }
      ]
    },
    {
      id: 'execution',
      title: '출장 실행',
      description: '출장을 진행하고 관련 업무를 수행합니다',
      icon: '✈️',
      required: true,
      items: [
        { id: 'departure', title: '출발 및 교통편 이용', completed: false, priority: 'high', category: 'execution' },
        { id: 'checkin', title: '숙박시설 체크인', completed: false, priority: 'medium', category: 'execution' },
        { id: 'business_work', title: '업무 수행 및 미팅 참석', completed: false, priority: 'high', category: 'execution' },
        { id: 'receipt_collection', title: '영수증 수집 및 정리', completed: false, priority: 'high', category: 'execution' },
        { id: 'return', title: '귀환 및 복귀', completed: false, priority: 'high', category: 'execution' }
      ]
    },
    {
      id: 'settlement',
      title: '정산 및 보고',
      description: '출장 경비를 정산하고 보고서를 작성합니다',
      icon: '💰',
      required: true,
      items: [
        { id: 'expense_report', title: '경비 정산서 작성', completed: false, priority: 'high', category: 'settlement' },
        { id: 'receipt_submit', title: '영수증 제출', completed: false, priority: 'high', category: 'settlement' },
        { id: 'trip_report', title: '출장 보고서 작성', completed: false, priority: 'medium', category: 'settlement' },
        { id: 'expense_approval', title: '경비 승인 완료', completed: false, priority: 'medium', category: 'settlement' },
        { id: 'final_settlement', title: '최종 정산 완료', completed: false, priority: 'low', category: 'settlement' }
      ]
    }
  ]

  // 로컬 스토리지에서 체크리스트 상태 로드
  useEffect(() => {
    const savedChecklist = localStorage.getItem(`checklist_${tripId}`)
    if (savedChecklist) {
      try {
        const parsed = JSON.parse(savedChecklist)
        setChecklist(parsed)
        // 기본적으로 첫 번째 카테고리는 확장
        setExpandedCategories(new Set(['planning']))
      } catch (error) {
        console.error('Failed to parse saved checklist:', error)
        initializeChecklist()
      }
    } else {
      initializeChecklist()
    }
  }, [tripId])

  const initializeChecklist = () => {
    setChecklist(checklistTemplate)
    setExpandedCategories(new Set(['planning']))
  }

  // 체크박스 상태 변경
  const handleItemToggle = (categoryId: string, itemId: string) => {
    setChecklist(prev => prev.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: category.items.map(item => 
            item.id === itemId 
              ? { ...item, completed: !item.completed }
              : item
          )
        }
      }
      return category
    }))
    setHasChanges(true)
  }

  // 카테고리 전체 토글
  const handleCategoryToggle = (categoryId: string) => {
    const category = checklist.find(cat => cat.id === categoryId)
    if (!category) return

    const allCompleted = category.items.every(item => item.completed)
    
    setChecklist(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => ({ ...item, completed: !allCompleted }))
        }
      }
      return cat
    }))
    setHasChanges(true)
  }

  // 카테고리 확장/축소
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // 저장
  const saveChecklist = () => {
    try {
      localStorage.setItem(`checklist_${tripId}`, JSON.stringify(checklist))
      setHasChanges(false)
      toast({
        title: "체크리스트 저장 완료",
        description: "체크리스트가 성공적으로 저장되었습니다.",
      })
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "체크리스트 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 전체 진행률 계산
  const totalItems = checklist.reduce((sum, category) => sum + category.items.length, 0)
  const completedItems = checklist.reduce((sum, category) => 
    sum + category.items.filter(item => item.completed).length, 0
  )
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  // 카테고리별 진행률 계산
  const getCategoryProgress = (category: ChecklistCategory) => {
    const completed = category.items.filter(item => item.completed).length
    return category.items.length > 0 ? (completed / category.items.length) * 100 : 0
  }

  // 우선순위별 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  // 우선순위별 라벨
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '높음'
      case 'medium': return '보통'
      case 'low': return '낮음'
      default: return ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            출장 체크리스트
          </CardTitle>
          {hasChanges && (
            <Button onClick={saveChecklist} size="sm" variant="outline">
              <Save className="w-4 h-4 mr-2" />
              저장
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              전체 진행률: {completedItems}/{totalItems} 완료
            </span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {checklist.map((category) => {
          const isExpanded = expandedCategories.has(category.id)
          const categoryProgress = getCategoryProgress(category)
          const completedCount = category.items.filter(item => item.completed).length
          
          return (
            <Collapsible
              key={category.id}
              open={isExpanded}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className="text-lg">{category.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {category.title}
                        {category.required && (
                          <Badge variant="secondary" className="text-xs">필수</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {completedCount}/{category.items.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(categoryProgress)}%
                      </div>
                    </div>
                    <div className="w-16">
                      <Progress value={categoryProgress} className="h-2" />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 ml-6 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={category.items.every(item => item.completed)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <label 
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      전체 선택/해제
                    </label>
                  </div>
                  {category.items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={item.completed}
                        onCheckedChange={() => handleItemToggle(category.id, item.id)}
                      />
                      <label 
                        htmlFor={`item-${item.id}`}
                        className={`flex-1 text-sm cursor-pointer ${
                          item.completed ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {item.title}
                      </label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(item.priority)}`}
                      >
                        {getPriorityLabel(item.priority)}
                      </Badge>
                      {item.completed && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}

        {/* 진행 상태 요약 */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            진행 상태 요약
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>완료: {completedItems}개</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span>미완료: {totalItems - completedItems}개</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>전체: {totalItems}개</span>
            </div>
          </div>
          {progressPercentage === 100 && (
            <div className="mt-3 p-2 bg-green-100 text-green-800 rounded text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              모든 체크리스트가 완료되었습니다! 🎉
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}