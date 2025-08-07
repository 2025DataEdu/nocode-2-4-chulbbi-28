import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TopNavigation } from "@/components/TopNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TripCard } from "@/components/TripCard";
import { FileText, Calendar, MapPin, Plus, Filter, Search } from "lucide-react";
import { calculateTripStatus } from "@/utils/validation";

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  purpose: string;
  budget?: number;
  spent?: number;
  distance_km?: number;
  created_at: string;
}

export default function Manage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'planned' | 'ongoing' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'destination' | 'status'>('date');

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user]);

  const fetchTrips = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
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

  // 검색 및 필터링
  const filteredTrips = trips
    .filter(trip => {
      const matchesSearch = trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trip.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'all') return matchesSearch;
      
      const realStatus = calculateTripStatus(trip.start_date, trip.end_date);
      return matchesSearch && realStatus === activeTab;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case 'destination':
          return a.destination.localeCompare(b.destination);
        case 'status':
          const statusA = calculateTripStatus(a.start_date, a.end_date);
          const statusB = calculateTripStatus(b.start_date, b.end_date);
          return statusA.localeCompare(statusB);
        default:
          return 0;
      }
    });

  // 통계 계산
  const stats = {
    total: trips.length,
    planned: trips.filter(trip => calculateTripStatus(trip.start_date, trip.end_date) === 'planned').length,
    ongoing: trips.filter(trip => calculateTripStatus(trip.start_date, trip.end_date) === 'ongoing').length,
    completed: trips.filter(trip => calculateTripStatus(trip.start_date, trip.end_date) === 'completed').length,
    totalBudget: trips.reduce((sum, trip) => sum + (trip.budget || 0), 0),
    totalSpent: trips.reduce((sum, trip) => sum + (trip.spent || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-headline font-bold text-foreground mb-2">출장 관리</h1>
          <p className="text-body text-muted-foreground">진행 중이거나 완료된 출장을 관리하세요.</p>
        </div>

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">전체 출장</p>
                  <p className="text-title font-bold text-foreground">{stats.total}건</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">진행중</p>
                  <p className="text-title font-bold text-foreground">{stats.ongoing}건</p>
                </div>
                <Calendar className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">예정</p>
                  <p className="text-title font-bold text-foreground">{stats.planned}건</p>
                </div>
                <MapPin className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">완료</p>
                  <p className="text-title font-bold text-foreground">{stats.completed}건</p>
                </div>
                <Badge variant="secondary" className="px-2 py-1">
                  {stats.completed > 0 ? `${Math.round((stats.totalSpent / stats.totalBudget) * 100)}%` : '0%'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <Card className="shadow-md border-0 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="출장지나 목적으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: 'date' | 'destination' | 'status') => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">날짜순</SelectItem>
                    <SelectItem value="destination">목적지순</SelectItem>
                    <SelectItem value="status">상태순</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 출장 목록 */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle>출장 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">전체 ({stats.total})</TabsTrigger>
                <TabsTrigger value="planned">예정 ({stats.planned})</TabsTrigger>
                <TabsTrigger value="ongoing">진행중 ({stats.ongoing})</TabsTrigger>
                <TabsTrigger value="completed">완료 ({stats.completed})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                {filteredTrips.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        id={trip.id}
                        destination={trip.destination}
                        start_date={trip.start_date}
                        end_date={trip.end_date}
                        status={trip.status}
                        realStatus={calculateTripStatus(trip.start_date, trip.end_date)}
                        budget={trip.budget}
                        spent={trip.spent}
                        purpose={trip.purpose}
                        distance_km={trip.distance_km}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {searchTerm ? '검색 결과가 없습니다' : '출장이 없습니다'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? '다른 검색어로 시도해보세요' : '첫 출장을 계획해보세요'}
                    </p>
                    <Button asChild>
                      <Link to="/register">
                        <Plus className="h-4 w-4 mr-2" />
                        새 출장 등록
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}