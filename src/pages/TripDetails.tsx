import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TripDetailsMap } from '@/components/TripDetailsMap'
import { ArrowLeft, Calendar, MapPin, Clock, Users, Edit3, Share2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { GeocodingService } from '@/services/GeocodingService'

interface Trip {
  id: string
  destination: string
  start_date: string
  end_date: string
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  purpose: string
  budget?: number
  notes?: string
  created_at: string
}

export default function TripDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (id && user) {
      fetchTripDetails()
    }
  }, [id, user])

  const fetchTripDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single()

      if (error) {
        console.error('Error fetching trip details:', error)
        navigate('/')
        return
      }

      if (!data) {
        console.log('Trip not found')
        navigate('/')
        return
      }

      setTrip(data)
      
      // 목적지 좌표 가져오기
      console.log('Getting coordinates for:', data.destination)
      const coords = await GeocodingService.geocode(data.destination)
      console.log('Geocoding result:', coords)
      
      if (coords) {
        setCoordinates({ lat: coords.lat, lng: coords.lng })
      } else {
        console.log('No coordinates found, using fallback')
        // 기본 좌표 (서울)
        setCoordinates({ lat: 37.5665, lng: 126.9780 })
      }
    } catch (error) {
      console.error('Error fetching trip details:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge className="bg-accent-light text-accent border-accent/20">예정</Badge>
      case 'ongoing':
        return <Badge className="bg-gradient-primary text-primary-foreground border-0">진행중</Badge>
      case 'completed':
        return <Badge className="bg-success-light text-success border-success/20">완료</Badge>
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>
      default:
        return <Badge variant="secondary">알 수 없음</Badge>
    }
  }

  const calculateProgress = () => {
    if (!trip) return 0
    
    const now = new Date()
    const start = new Date(trip.start_date)
    const end = new Date(trip.end_date)
    
    if (now < start) return 0
    if (now > end) return 100
    
    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    
    return Math.round((elapsed / total) * 100)
  }

  const getDaysRemaining = () => {
    if (!trip) return 0
    
    const now = new Date()
    const end = new Date(trip.end_date)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-headline text-foreground">출장을 찾을 수 없습니다</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          대시보드로 돌아가기
        </Button>
      </div>
    )
  }

  const progress = calculateProgress()
  const daysRemaining = getDaysRemaining()

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-headline text-foreground">{trip.destination}</h1>
            <p className="text-body text-muted-foreground">출장 상세 정보</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            공유
          </Button>
          <Button variant="outline" size="sm">
            <Edit3 className="h-4 w-4 mr-2" />
            수정
          </Button>
        </div>
      </div>

      {/* 출장 기본 정보 */}
      <Card className="border-0 shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-title">출장 개요</CardTitle>
            {getStatusBadge(trip.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 정보 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-caption">
                <MapPin className="h-4 w-4" />
                목적지
              </div>
              <p className="font-medium text-foreground">{trip.destination}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-caption">
                <Calendar className="h-4 w-4" />
                출발일
              </div>
              <p className="font-medium text-foreground">
                {format(new Date(trip.start_date), 'MM월 dd일 (E)', { locale: ko })}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-caption">
                <Calendar className="h-4 w-4" />
                돌아오는 날
              </div>
              <p className="font-medium text-foreground">
                {format(new Date(trip.end_date), 'MM월 dd일 (E)', { locale: ko })}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-caption">
                <Clock className="h-4 w-4" />
                {trip.status === 'completed' ? '완료됨' : 
                 trip.status === 'ongoing' ? '남은 기간' : '시작까지'}
              </div>
              <p className="font-medium text-foreground">
                {trip.status === 'completed' ? '출장 완료' :
                 daysRemaining > 0 ? `${daysRemaining}일` : '오늘'}
              </p>
            </div>
          </div>

          {/* 진행률 (진행중인 경우만) */}
          {trip.status === 'ongoing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-caption text-muted-foreground">출장 진행률</span>
                <span className="text-caption font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* 목적 및 메모 */}
          {trip.purpose && (
            <div className="space-y-2">
              <h3 className="text-caption font-medium text-muted-foreground">출장 목적</h3>
              <p className="text-body text-foreground">{trip.purpose}</p>
            </div>
          )}

          {trip.notes && (
            <div className="space-y-2">
              <h3 className="text-caption font-medium text-muted-foreground">메모</h3>
              <p className="text-body text-foreground whitespace-pre-wrap">{trip.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 지도 및 추천 장소 */}
      <TripDetailsMap 
        destination={trip.destination} 
        latitude={coordinates?.lat} 
        longitude={coordinates?.lng} 
      />
    </div>
  )
}