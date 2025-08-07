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
  planned: { label: '계획됨', variant: 'secondary' as const },
  ongoing: { label: '진행중', variant: 'default' as const },
  completed: { label: '완료', variant: 'outline' as const }
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
    <Card className="group hover:shadow-medium transition-smooth cursor-pointer animate-fade-in border-0 shadow-soft">
      <CardContent className="p-6">
        {/* 헤더 - 목적지와 상태 */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-foreground truncate mb-1">
              {destination}
            </h3>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{type} 출장</span>
            </div>
          </div>
          <Badge 
            variant={config.variant} 
            className="ml-2 text-xs font-medium"
          >
            {config.label}
          </Badge>
        </div>
        
        {/* 날짜 */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {startDate} ~ {endDate}
          </span>
        </div>
        
        {/* 예산 정보 - 심플하게 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">예산 사용</span>
            <span className="text-sm font-semibold text-foreground">
              {spent.toLocaleString()}원 / {budget.toLocaleString()}원
            </span>
          </div>
          
          {/* 프로그레스 바 - 더 큰 사이즈 */}
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
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
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {spentPercentage.toFixed(0)}% 사용
            </span>
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-smooth">
              탭하여 자세히 보기 →
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}