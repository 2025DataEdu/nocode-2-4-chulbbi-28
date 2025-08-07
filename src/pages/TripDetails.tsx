import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TripDetailsMap } from '@/components/TripDetailsMap'
import { ArrowLeft, Calendar, MapPin, Clock, Users, Edit3, Share2, Save, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { GeocodingService } from '@/services/GeocodingService'
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    purpose: '',
    notes: '',
    budget: '',
    status: 'planned' as 'planned' | 'ongoing' | 'completed' | 'cancelled'
  })

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
    
    const now = getKoreanTime()
    const start = new Date(trip.start_date + 'T00:00:00')
    const end = new Date(trip.end_date + 'T23:59:59')
    
    if (now < start) return 0
    if (now > end) return 100
    
    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    
    return Math.round((elapsed / total) * 100)
  }

  // 한국시간 기준 현재 시간 가져오기
  const getKoreanTime = () => {
    const now = new Date()
    // 한국시간(UTC+9) 기준으로 변환
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000))
    return koreanTime
  }

  // 실제 날짜에 따른 현재 출장 상태 계산
  const calculateRealStatus = () => {
    if (!trip) return trip?.status || 'planned'
    
    const now = getKoreanTime()
    const start = new Date(trip.start_date + 'T00:00:00')
    const end = new Date(trip.end_date + 'T23:59:59')
    
    // 현재 날짜 기준으로 실제 상태 결정
    if (now < start) {
      return 'planned' // 아직 시작 전
    } else if (now >= start && now <= end) {
      return 'ongoing' // 진행 중
    } else {
      return 'completed' // 완료
    }
  }

  const getDaysRemaining = () => {
    if (!trip) return 0
    
    const now = getKoreanTime()
    const start = new Date(trip.start_date + 'T00:00:00')
    const end = new Date(trip.end_date + 'T23:59:59')
    const realStatus = calculateRealStatus()
    
    if (realStatus === 'ongoing') {
      // 진행중인 경우 종료까지의 날짜
      const diffTime = end.getTime() - now.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } else if (realStatus === 'planned') {
      // 예정인 경우 시작까지의 날짜
      const diffTime = start.getTime() - now.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
    
    return 0 // 완료된 경우는 0
  }

  const getDateLabel = () => {
    if (!trip) return ''
    
    const realStatus = calculateRealStatus()
    
    switch (realStatus) {
      case 'ongoing':
        return '종료까지'
      case 'planned':
        return '시작까지'
      case 'completed':
        return null // 완료된 경우 표시하지 않음
      default:
        return '시작까지'
    }
  }

  const getDateValue = () => {
    if (!trip) return ''
    
    const daysRemaining = getDaysRemaining()
    const realStatus = calculateRealStatus()
    
    switch (realStatus) {
      case 'ongoing':
        return daysRemaining > 0 ? `${daysRemaining}일` : '오늘 종료'
      case 'planned':
        return daysRemaining > 0 ? `${daysRemaining}일` : '오늘 시작'
      case 'completed':
        return null // 완료된 경우 표시하지 않음
      default:
        return daysRemaining > 0 ? `${daysRemaining}일` : '오늘'
    }
  }

  const openEditDialog = () => {
    if (!trip) return
    
    setEditForm({
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      purpose: trip.purpose,
      notes: trip.notes || '',
      budget: trip.budget?.toString() || '',
      status: trip.status
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!trip || !user) return

    setEditLoading(true)
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          destination: editForm.destination,
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          purpose: editForm.purpose,
          notes: editForm.notes || null,
          budget: editForm.budget ? parseFloat(editForm.budget) : null,
          status: editForm.status
        })
        .eq('id', trip.id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      toast({
        title: "출장 정보가 수정되었습니다",
        description: "변경사항이 성공적으로 저장되었습니다."
      })

      setIsEditDialogOpen(false)
      fetchTripDetails() // 데이터 새로고침
    } catch (error) {
      console.error('Error updating trip:', error)
      toast({
        title: "수정 실패",
        description: "출장 정보 수정 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setEditLoading(false)
    }
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
            className="hover:bg-muted hover:text-foreground transition-colors"
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
          <Button variant="outline" size="sm" onClick={openEditDialog}>
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
            {/* 날짜 정보 - 완료된 경우만 숨김 */}
            {calculateRealStatus() !== 'completed' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground text-caption">
                  <Clock className="h-4 w-4" />
                  {getDateLabel()}
                </div>
                <p className="font-medium text-foreground">
                  {getDateValue()}
                </p>
              </div>
            )}
          </div>

          {/* 진행률 (진행중인 경우만) */}
          {calculateRealStatus() === 'ongoing' && (
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

      {/* 편집 다이얼로그 - 오버레이 없이 */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col space-y-1.5 text-center sm:text-left p-6 border-b">
              <h2 className="text-lg font-semibold leading-none tracking-tight">출장 정보 수정</h2>
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            <div className="grid gap-4 py-4 px-6">
              {/* 목적지 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="destination" className="text-right font-medium">
                  목적지
                </label>
                <Input
                  id="destination"
                  value={editForm.destination}
                  onChange={(e) => setEditForm(prev => ({ ...prev, destination: e.target.value }))}
                  className="col-span-3"
                  placeholder="목적지를 입력하세요"
                />
              </div>
              
              {/* 출발일 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="start_date" className="text-right font-medium">
                  출발일
                </label>
                <Input
                  id="start_date"
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              
              {/* 종료일 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="end_date" className="text-right font-medium">
                  종료일
                </label>
                <Input
                  id="end_date"
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              
              {/* 상태 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="status" className="text-right font-medium">
                  상태
                </label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="상태를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">예정</SelectItem>
                    <SelectItem value="ongoing">진행중</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                    <SelectItem value="cancelled">취소됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 예산 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="budget" className="text-right font-medium">
                  예산
                </label>
                <Input
                  id="budget"
                  type="number"
                  value={editForm.budget}
                  onChange={(e) => setEditForm(prev => ({ ...prev, budget: e.target.value }))}
                  className="col-span-3"
                  placeholder="예산을 입력하세요 (원)"
                />
              </div>
              
              {/* 목적 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="purpose" className="text-right font-medium">
                  목적
                </label>
                <Input
                  id="purpose"
                  value={editForm.purpose}
                  onChange={(e) => setEditForm(prev => ({ ...prev, purpose: e.target.value }))}
                  className="col-span-3"
                  placeholder="출장 목적을 입력하세요"
                />
              </div>
              
              {/* 메모 */}
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="notes" className="text-right font-medium pt-2">
                  메모
                </label>
                <Textarea
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3"
                  placeholder="메모를 입력하세요"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={editLoading}
                className="mt-2 sm:mt-0"
              >
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={editLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {editLoading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}