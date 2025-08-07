import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TripCard } from "./TripCard"
import { Plus, BarChart3, Calendar, Wallet } from "lucide-react"

// Mock data for demonstration
const mockTrips = [
  {
    id: '1',
    destination: '부산 해운대',
    startDate: '2024-01-15',
    endDate: '2024-01-17',
    status: 'ongoing' as const,
    budget: 500000,
    spent: 320000,
    type: '관외' as const
  },
  {
    id: '2', 
    destination: '대전 정부청사',
    startDate: '2024-01-20',
    endDate: '2024-01-20',
    status: 'planned' as const,
    budget: 150000,
    spent: 0,
    type: '관내' as const
  },
  {
    id: '3',
    destination: '제주 서귀포',
    startDate: '2024-01-05',
    endDate: '2024-01-08',
    status: 'completed' as const,
    budget: 800000,
    spent: 750000,
    type: '관외' as const
  }
]

const statsCards = [
  {
    title: "진행중인 출장",
    value: "1",
    subtitle: "건",
    icon: Calendar,
    variant: "primary" as const,
    emoji: "✈️"
  },
  {
    title: "이번 달 예산",
    value: "1,450,000",
    subtitle: "원",
    icon: Wallet,
    variant: "secondary" as const,
    emoji: "💰"
  },
  {
    title: "총 출장 건수",
    value: "12", 
    subtitle: "건",
    icon: BarChart3,
    variant: "accent" as const,
    emoji: "📊"
  }
]

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'all' | 'ongoing' | 'planned' | 'completed'>('all')
  
  const filteredTrips = mockTrips.filter(trip => 
    activeTab === 'all' || trip.status === activeTab
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 헤더 섹션 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            안녕하세요! 👋
          </h1>
          <p className="text-muted-foreground">
            출장 관리를 쉽고 간편하게 시작해보세요
          </p>
        </div>
        
        <Button size="lg" className="bg-gradient-primary hover:shadow-medium transition-smooth">
          <Plus className="w-5 h-5 mr-2" />
          새 출장 등록
        </Button>
      </div>

      {/* 통계 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className={`group hover:shadow-medium transition-smooth animate-scale-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="text-2xl">{stat.emoji}</div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.subtitle}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 출장 목록 섹션 */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-semibold text-foreground">
            내 출장 현황 🎒
          </h2>
          
          {/* 필터 탭 */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            {[
              { key: 'all', label: '전체' },
              { key: 'ongoing', label: '진행중' },
              { key: 'planned', label: '계획됨' },
              { key: 'completed', label: '완료' }
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.key as any)}
                className={`transition-smooth ${
                  activeTab === tab.key 
                    ? 'bg-background shadow-soft' 
                    : 'hover:bg-background/50'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 출장 카드 그리드 */}
        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip, index) => (
              <div 
                key={trip.id}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TripCard {...trip} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">🎒</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {activeTab === 'all' ? '등록된 출장이 없습니다' : `${activeTab} 출장이 없습니다`}
                </h3>
                <p className="text-muted-foreground mt-2">
                  새로운 출장을 등록하여 시작해보세요!
                </p>
              </div>
              <Button className="bg-gradient-primary hover:shadow-medium transition-smooth">
                <Plus className="w-4 h-4 mr-2" />
                첫 출장 등록하기
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}