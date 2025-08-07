import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, DollarSign, Clock } from "lucide-react"

interface TripCardProps {
  id: string
  destination: string
  startDate: string
  endDate: string
  status: 'planned' | 'ongoing' | 'completed'
  budget: number
  spent?: number
  type: '관내' | '관외'
}

const statusConfig = {
  planned: { label: '계획됨', variant: 'secondary' as const, emoji: '📅' },
  ongoing: { label: '진행중', variant: 'default' as const, emoji: '✈️' },
  completed: { label: '완료', variant: 'outline' as const, emoji: '✅' }
}

export function TripCard({ 
  id, 
  destination, 
  startDate, 
  endDate, 
  status, 
  budget, 
  spent = 0, 
  type 
}: TripCardProps) {
  const config = statusConfig[status]
  const spentPercentage = budget > 0 ? (spent / budget) * 100 : 0
  
  return (
    <Card className="group hover:shadow-medium transition-smooth cursor-pointer animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.emoji}</span>
            <CardTitle className="text-lg font-semibold truncate">
              {destination}
            </CardTitle>
          </div>
          <Badge variant={config.variant} className="shrink-0">
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 날짜 정보 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span>{startDate} ~ {endDate}</span>
        </div>
        
        {/* 출장 타입 */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <Badge variant="outline" className="text-xs">
            {type} 출장
          </Badge>
        </div>
        
        {/* 예산 정보 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>예산</span>
            </div>
            <span className="font-medium">
              {spent.toLocaleString()}원 / {budget.toLocaleString()}원
            </span>
          </div>
          
          {/* 예산 사용률 프로그레스 바 */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                spentPercentage > 90 
                  ? 'bg-destructive' 
                  : spentPercentage > 70 
                    ? 'bg-gradient-secondary' 
                    : 'bg-gradient-primary'
              }`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
          
          <div className="text-xs text-muted-foreground text-right">
            {spentPercentage.toFixed(1)}% 사용
          </div>
        </div>
        
        {/* 액션 힌트 */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-smooth">
          <Clock className="w-3 h-3" />
          <span>클릭하여 상세보기</span>
        </div>
      </CardContent>
    </Card>
  )
}