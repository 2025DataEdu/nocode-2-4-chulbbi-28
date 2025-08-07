import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TripCard } from "./TripCard"
import { Plus, BarChart3, Calendar, MapPin } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"



export function Dashboard() {
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

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
        .eq('status', 'ongoing')
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
  const totalTrips = trips.length

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
      title: "총 출장 건수",
      value: totalTrips.toString(), 
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
            출장 현황 📋
          </h1>
          <p className="text-muted-foreground">
            진행중인 출장을 관리하고 계획하세요
          </p>
        </div>
        
        <Button 
          size="lg" 
          className="bg-gradient-primary hover:shadow-medium transition-smooth"
          onClick={() => window.location.href = '/register'}
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

      {/* 진행중인 출장 섹션 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">
          진행중인 출장
        </h2>

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
        ) : ongoingTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ongoingTrips.map((trip, index) => (
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
              <div className="text-6xl">✈️</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  진행중인 출장이 없습니다
                </h3>
                <p className="text-muted-foreground mt-2">
                  새로운 출장을 등록하여 시작해보세요!
                </p>
              </div>
              <Button 
                className="bg-gradient-primary hover:shadow-medium transition-smooth"
                onClick={() => window.location.href = '/register'}
              >
                <Plus className="w-4 h-4 mr-2" />
                첫 출장 등록하기
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* 지도 섹션 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">
          출장지 지도
        </h2>
        <Card className="p-6">
          <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">지도 기능 준비중입니다</p>
              <p className="text-sm text-muted-foreground">
                네이버 지도 API 연동 예정
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}