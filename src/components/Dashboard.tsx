import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TripCard } from "./TripCard";
import { Plus, BarChart3, Calendar, MapPin, Building, Utensils, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { TopNavigation } from "@/components/TopNavigation";
export function Dashboard() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'ongoing' | 'planned' | 'completed' | 'all'>('ongoing');
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (user?.id) {
      fetchTrips();
    } else {
      setLoading(false);
      setTrips([]);
    }
  }, [user]);

  // 출장 업데이트 이벤트 리스너
  useEffect(() => {
    const handleTripUpdate = () => {
      if (user?.id) {
        fetchTrips();
      }
    };
    window.addEventListener('tripUpdated', handleTripUpdate);
    return () => window.removeEventListener('tripUpdated', handleTripUpdate);
  }, [user]);
  const fetchTrips = async () => {
    try {
      if (!user?.id) {
        setTrips([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setTrips(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      toast({
        title: "데이터 로딩 실패",
        description: error?.message || "출장 정보를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  // 현재 날짜 기준으로 출장 상태 계산 (한국시간 기준)
  const calculateTripStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    // 한국시간으로 변환 (UTC+9)
    const koreanOffset = 9 * 60;
    const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
    const koreanTime = new Date(utc + (koreanOffset * 60000));
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 시간 부분을 제거하고 날짜만 비교
    koreanTime.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    if (koreanTime < start) {
      return 'planned';
    } else if (koreanTime >= start && koreanTime <= end) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  };

  // 출장 데이터에 실제 상태 적용
  const tripsWithRealStatus = trips.map(trip => ({
    ...trip,
    realStatus: calculateTripStatus(trip.start_date, trip.end_date)
  }));
  const ongoingTrips = tripsWithRealStatus.filter(trip => trip.realStatus === 'ongoing');
  const plannedTrips = tripsWithRealStatus.filter(trip => trip.realStatus === 'planned');
  const completedTrips = tripsWithRealStatus.filter(trip => trip.realStatus === 'completed');
  const totalTrips = trips.length;
  const getActiveTrips = () => {
    switch (activeView) {
      case 'ongoing':
        return ongoingTrips;
      case 'planned':
        return plannedTrips;
      case 'completed':
        return completedTrips;
      case 'all':
        return tripsWithRealStatus;
      default:
        return ongoingTrips;
    }
  };
  const statsCards = [{
    title: "진행중인 출장",
    value: ongoingTrips.length.toString(),
    subtitle: "건",
    icon: Calendar,
    variant: "primary" as const
  }, {
    title: "등록된 출장지",
    value: new Set(tripsWithRealStatus.map(trip => trip.destination)).size.toString(),
    subtitle: "곳",
    icon: MapPin,
    variant: "secondary" as const
  }, {
    title: "예정된 출장",
    value: plannedTrips.length.toString(),
    subtitle: "건",
    icon: Calendar,
    variant: "accent" as const
  }, {
    title: "완료된 출장",
    value: completedTrips.length.toString(),
    subtitle: "건",
    icon: BarChart3,
    variant: "accent" as const
  }];
  return <div className="min-h-screen bg-background">
      <TopNavigation />
      
      <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in-up pb-24">
      {/* 헤더 섹션 - 개선된 타이포그래피와 계층구조 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-headline text-foreground">
            안녕하세요! 👋
          </h1>
          <p className="text-body text-muted-foreground">오늘도 즐거운 출장 되세요</p>
        </div>
        <Button variant="gradient" size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => navigate('/register')}>
          <Plus className="mr-2 h-5 w-5" />
          새 출장 계획
        </Button>
      </div>

      {/* 핵심 통계 - 빅테크 스타일 카드 디자인 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-caption font-medium">진행중</p>
                <p className="text-title font-bold">{ongoingTrips.length}건</p>
                <p className="text-xs text-primary-foreground/60 mt-1">활성 출장</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-md hover:shadow-lg transition-all duration-300 animate-scale-in border-0" style={{
          animationDelay: '0.1s'
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-caption font-medium">내 출장</p>
                <p className="text-title font-bold text-foreground">{plannedTrips.length}건</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {plannedTrips.length > 0 ? plannedTrips.map(trip => trip.destination).slice(0, 2).join(', ') : '없음'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent-light flex items-center justify-center">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-md hover:shadow-lg transition-all duration-300 animate-scale-in border-0 sm:col-span-2 lg:col-span-1" style={{
          animationDelay: '0.2s'
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-caption font-medium">총 출장지</p>
                <p className="text-title font-bold text-foreground">{new Set(tripsWithRealStatus.map(trip => trip.destination)).size}곳</p>
                <p className="text-xs text-muted-foreground mt-1">완료: {completedTrips.length}건</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success-light flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 출장 목록 - 개선된 네비게이션과 필터 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-title font-semibold text-foreground">내 출장</h2>
            <p className="text-caption text-muted-foreground">출장 일정을 한눈에 확인하세요</p>
          </div>
          <Tabs value={activeView} onValueChange={(value: string) => setActiveView(value as 'ongoing' | 'planned' | 'completed' | 'all')} className="w-auto">
            <TabsList className="grid grid-cols-4 h-10 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="ongoing" className="text-xs px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                진행중
              </TabsTrigger>
              <TabsTrigger value="planned" className="text-xs px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                예정
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                완료
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                전체
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 auto-rows-max">
            {[1, 2, 3].map(i => <Card key={i} className="bg-gradient-card border-0 shadow-md animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-5 bg-muted rounded-lg w-3/4"></div>
                    <div className="h-4 bg-muted rounded-md w-1/2"></div>
                    <div className="h-3 bg-muted rounded-md w-2/3"></div>
                    <div className="h-2 bg-muted rounded-full w-full"></div>
                  </div>
                </CardContent>
              </Card>)}
          </div> : getActiveTrips().length > 0 ? <div key={activeView} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 auto-rows-max animate-fade-in">
            {getActiveTrips().map((trip, index) => <div key={trip.id} className="animate-scale-in" style={{
            animationDelay: `${index * 0.05}s`
          }}>
                <TripCard {...trip} />
              </div>)}
          </div> : <Card key={`empty-${activeView}`} className="bg-gradient-card border-0 shadow-md animate-fade-in">
            <CardContent className="p-12 text-center">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Calendar className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-title font-semibold text-foreground">
                    {activeView === 'ongoing' ? '진행중인 출장이 없어요' : activeView === 'planned' ? '예정된 출장이 없어요' : activeView === 'completed' ? '완료된 출장이 없어요' : '첫 출장을 계획해보세요'}
                  </h3>
                  <p className="text-body text-muted-foreground max-w-sm mx-auto">
                    출삐와 함께 스마트한 출장을 시작해보세요
                  </p>
                </div>
                <Button variant="gradient" size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => navigate('/register')}>
                  <Plus className="w-5 h-5 mr-2" />
                  출장 계획하기
                </Button>
              </div>
            </CardContent>
          </Card>}
      </div>

      </div>
    </div>;
}