import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, DollarSign, Clock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { safeParseNumber } from "@/utils/validation"
import { normalizeRegion } from "@/utils/distance"

interface TripCardProps {
  id: string
  destination: string
  start_date: string
  end_date: string
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  realStatus?: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  budget?: number
  spent?: number
  purpose?: string
  [key: string]: any // Supabase에서 추가 필드들을 위해
}

const statusConfig = {
  planned: { label: "예정", variant: "outline" as const },
  ongoing: { label: "진행중", variant: "default" as const },
  completed: { label: "완료", variant: "secondary" as const },
  cancelled: { label: "취소됨", variant: "destructive" as const }
}

export function TripCard({ 
  id, 
  destination, 
  start_date, 
  end_date, 
  status, 
  realStatus,
  budget = 0, 
  spent = 0, 
  purpose = "출장",
  distance_km = 0
}: TripCardProps) {
  const navigate = useNavigate()
  const actualStatus = realStatus || status
  const config = statusConfig[actualStatus] || statusConfig.planned
  const [allowanceData, setAllowanceData] = useState<any>(null)
  const [estimatedBudget, setEstimatedBudget] = useState<number>(0)
  
  
  // 출장비 규정 조회 및 예상 예산 계산
  useEffect(() => {
    const fetchAllowanceAndCalculate = async () => {
      try {
        const region = normalizeRegion(destination)
        const { data: allowance } = await supabase
          .from('business_trip_allowances')
          .select('*')
          .eq('organization', '기본')
          .eq('region', region)
          .single()
        
        if (allowance) {
          setAllowanceData(allowance)
          
          // 출장 일수 계산
          const startDate = new Date(start_date)
          const endDate = new Date(end_date)
          const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
          
          // 예상 예산 계산 (안전한 숫자 변환)
          const mealCost = safeParseNumber(allowance.daily_meal_allowance) * daysDiff
          const lodgingCost = safeParseNumber(allowance.daily_lodging_allowance) * Math.max(0, daysDiff - 1) // 숙박은 하루 적게
          const transportCost = safeParseNumber(distance_km) * safeParseNumber(allowance.transportation_rate_per_km) * 2 // 왕복
          
          const totalEstimated = mealCost + lodgingCost + transportCost
          setEstimatedBudget(Math.max(0, totalEstimated))
        } else {
          setEstimatedBudget(0)
        }
      } catch (error) {
        console.error('출장비 규정 조회 실패:', error)
      }
    }
    
    fetchAllowanceAndCalculate()
  }, [destination, start_date, end_date, distance_km])
  
  const spentPercentage = estimatedBudget > 0 ? (spent / estimatedBudget) * 100 : 0
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate(`/trip/${id}`)
  }

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in bg-gradient-card border-0 shadow-md overflow-hidden"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        {/* 헤더 - 목적지와 상태 */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-title font-bold text-foreground truncate mb-2">
              {destination}
            </h3>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-caption text-muted-foreground">{purpose}</span>
            </div>
          </div>
          <Badge 
            variant={config.variant} 
            className="ml-2 text-xs font-medium shadow-sm"
          >
            {config.label}
          </Badge>
        </div>
        
        {/* 날짜 */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg backdrop-blur-sm">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-caption font-medium text-foreground">
            {new Date(start_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ~ {new Date(end_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        
        {/* 예산 정보 - 향상된 시각적 표현 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted-foreground">지출 / 여비</span>
            <span className="text-caption font-bold text-foreground">
              {spent.toLocaleString()}원 / {estimatedBudget.toLocaleString()}원
            </span>
          </div>
          
          {/* 프로그레스 바 - Material Design 스타일 */}
          <div className="relative">
            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ease-out rounded-full relative ${
                  spentPercentage > 90 
                    ? 'bg-gradient-to-r from-destructive to-destructive/80' 
                    : spentPercentage > 70 
                      ? 'bg-gradient-to-r from-warning to-warning/80' 
                      : 'bg-gradient-primary'
                } shadow-sm`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">
              {spentPercentage.toFixed(0)}% 사용
            </span>
            <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
              자세히 보기 →
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}