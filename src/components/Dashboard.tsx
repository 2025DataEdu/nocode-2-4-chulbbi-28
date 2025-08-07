import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TripCard } from "./TripCard"
import { Plus, BarChart3, Calendar, MapPin, Building, Utensils, Camera } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"



export function Dashboard() {
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'ongoing' | 'planned' | 'completed' | 'all'>('ongoing')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchTrips()
    }
  }, [user])

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTrips(data || [])
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const ongoingTrips = trips.filter(trip => trip.status === 'ongoing')
  const plannedTrips = trips.filter(trip => trip.status === 'planned')
  const completedTrips = trips.filter(trip => trip.status === 'completed')
  const totalTrips = trips.length

  const getActiveTrips = () => {
    switch(activeView) {
      case 'ongoing': return ongoingTrips
      case 'planned': return plannedTrips
      case 'completed': return completedTrips
      case 'all': return trips
      default: return ongoingTrips
    }
  }

  const statsCards = [
    {
      title: "진행중인 출장",
      value: ongoingTrips.length.toString(),
      subtitle: "건",
      icon: Calendar,
      variant: "primary" as const,
    },
    {
      title: "등록된 출장지",
      value: new Set(trips.map(trip => trip.destination)).size.toString(),
      subtitle: "곳",
      icon: MapPin,
      variant: "secondary" as const,
    },
    {
      title: "예정된 출장",
      value: plannedTrips.length.toString(),
      subtitle: "건", 
      icon: Calendar,
      variant: "accent" as const,
    },
    {
      title: "완료된 출장",
      value: completedTrips.length.toString(),
      subtitle: "건",
      icon: BarChart3,
      variant: "accent" as const,
    }
  ]

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 헤더 섹션 - 트리플 스타일로 친근하게 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            안녕하세요! 👋
          </h1>
          <p className="text-muted-foreground">오늘도 즐거운 출장 되세요</p>
        </div>
        <Button 
          className="bg-gradient-primary hover:shadow-medium transition-smooth w-full sm:w-auto"
          onClick={() => navigate('/register')}
        >
          <Plus className="mr-2 h-4 w-4" />
          새 출장 계획
        </Button>
      </div>

      {/* 간단한 요약 통계 - 핵심 정보만 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-primary text-primary-foreground animate-fade-in hover:shadow-medium transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">진행중</p>
                <p className="text-2xl font-bold">{ongoingTrips.length}건</p>
              </div>
              <Calendar className="h-8 w-8 text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in hover:shadow-medium transition-smooth" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">방문 예정</p>
                <p className="text-2xl font-bold text-foreground">{plannedTrips.length}건</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {plannedTrips.length > 0 ? plannedTrips.map(trip => trip.destination).slice(0, 2).join(', ') : '없음'}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in hover:shadow-medium transition-smooth sm:col-span-2 lg:col-span-1" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">총 출장지</p>
                <p className="text-2xl font-bold text-foreground">{new Set(trips.map(trip => trip.destination)).size}곳</p>
                <p className="text-xs text-muted-foreground mt-1">완료: {completedTrips.length}건</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 출장 목록 - 탭 대신 심플한 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">내 출장</h2>
          <Tabs value={activeView} onValueChange={(value: string) => setActiveView(value as 'ongoing' | 'planned' | 'completed' | 'all')} className="w-auto">
            <TabsList className="grid grid-cols-4 h-9">
              <TabsTrigger value="ongoing" className="text-xs px-2">
                진행중
              </TabsTrigger>
              <TabsTrigger value="planned" className="text-xs px-2">
                예정
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-2">
                완료
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2">
                전체
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : getActiveTrips().length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {getActiveTrips().map((trip, index) => (
              <div 
                key={trip.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TripCard {...trip} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center animate-fade-in">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                {activeView === 'ongoing' ? '진행중인 출장이 없어요' :
                 activeView === 'planned' ? '예정된 출장이 없어요' :
                 activeView === 'completed' ? '완료된 출장이 없어요' :
                 '첫 출장을 계획해보세요'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                출삐와 함께 스마트한 출장을 시작해보세요
              </p>
              <Button 
                className="bg-gradient-primary hover:shadow-medium transition-smooth mt-4"
                onClick={() => navigate('/register')}
              >
                <Plus className="w-4 h-4 mr-2" />
                출장 계획하기
              </Button>
            </div>
          </Card>
        )}
      </div>

    </div>
  )
}