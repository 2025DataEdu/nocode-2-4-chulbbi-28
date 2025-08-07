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
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in bg-gradient-card border-0 shadow-md overflow-hidden">
      <CardContent className="p-6">
        {/* 헤더 - 목적지와 상태 */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-title font-bold text-foreground truncate mb-2">
              {destination}
            </h3>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-caption text-muted-foreground">{type} 출장</span>
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
            {startDate} ~ {endDate}
          </span>
        </div>
        
        {/* 예산 정보 - 향상된 시각적 표현 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted-foreground">예산 사용</span>
            <span className="text-caption font-bold text-foreground">
              {spent.toLocaleString()}원 / {budget.toLocaleString()}원
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