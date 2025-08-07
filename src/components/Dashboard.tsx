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
    <div className="space-y-8 animate-fade-in">
      {/* 헤더 섹션 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            출장 관리
          </h1>
          <p className="text-muted-foreground">
            출장을 효율적으로 관리하세요
          </p>
        </div>
        
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary-hover text-primary-foreground hover:shadow-medium transition-smooth"
          onClick={() => navigate('/register')}
        >
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
              <stat.icon className="h-5 w-5 text-muted-foreground" />
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

      {/* 출장 관리 탭 */}
      <Tabs value={activeView} onValueChange={(value: string) => setActiveView(value as 'ongoing' | 'planned' | 'completed' | 'all')}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ongoing">진행중 ({ongoingTrips.length})</TabsTrigger>
          <TabsTrigger value="planned">예정 ({plannedTrips.length})</TabsTrigger>
          <TabsTrigger value="completed">완료 ({completedTrips.length})</TabsTrigger>
          <TabsTrigger value="all">전체 ({totalTrips})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeView} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getActiveTrips().map((trip, index) => (
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
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {activeView === 'ongoing' ? '진행중인 출장이 없습니다' :
                     activeView === 'planned' ? '예정된 출장이 없습니다' :
                     activeView === 'completed' ? '완료된 출장이 없습니다' :
                     '등록된 출장이 없습니다'}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    새로운 출장을 등록하여 시작해보세요
                  </p>
                </div>
                <Button 
                  className="bg-primary hover:bg-primary-hover text-primary-foreground hover:shadow-medium transition-smooth"
                  onClick={() => navigate('/register')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  출장 등록하기
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 출장지 정보 및 추천 섹션 - 진행중인 출장이 있을 때만 표시 */}
      {activeView === 'ongoing' && ongoingTrips.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            출장지 정보 및 추천
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 지도 섹션 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                출장지 지도
              </h3>
              <div className="h-80 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">지도 기능 준비중</p>
                  <p className="text-sm text-muted-foreground">
                    네이버 지도 API 연동 예정
                  </p>
                </div>
              </div>
            </Card>

            {/* 추천 정보 섹션 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">추천 정보</h3>
              <div className="space-y-6">
                {/* 숙소 추천 */}
                <div>
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    추천 숙소
                  </h4>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-foreground font-medium">비즈니스 호텔 A</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      • 출장지에서 도보 5분 거리
                      • 무료 WiFi 및 비즈니스 센터 완비
                      • 조식 포함 (1박 120,000원)
                    </p>
                  </div>
                </div>

                {/* 식당 추천 */}
                <div>
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    비즈니스 미팅 적합 식당
                  </h4>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-foreground font-medium">한정식 레스토랑 B</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      • 조용한 분위기로 비즈니스 미팅에 적합
                      • 개별 룸 예약 가능
                      • 1인당 35,000원 (점심 코스)
                    </p>
                  </div>
                </div>

                {/* 관광지 추천 */}
                <div>
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    주변 관광지
                  </h4>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-foreground font-medium">문화유적지 C</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      • 출장 여유시간에 방문 추천
                      • 대중교통으로 15분 거리
                      • 입장료 무료, 사진 촬영 가능
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}