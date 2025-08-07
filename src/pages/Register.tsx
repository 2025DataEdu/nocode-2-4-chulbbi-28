import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { TopNavigation } from "@/components/TopNavigation"
import { Calendar, MapPin, Car, Building, ArrowRight, Save, X } from "lucide-react"

const locations = [
  { value: 'seoul-jung', label: '서울특별시 중구', region: 'seoul' },
  { value: 'seoul-gangnam', label: '서울특별시 강남구', region: 'seoul' },
  { value: 'seoul-mapo', label: '서울특별시 마포구', region: 'seoul' },
  { value: 'busan-haeundae', label: '부산광역시 해운대구', region: 'busan' },
  { value: 'busan-busanjin', label: '부산광역시 부산진구', region: 'busan' },
  { value: 'incheon-namdong', label: '인천광역시 남동구', region: 'incheon' },
  { value: 'daegu-suseong', label: '대구광역시 수성구', region: 'daegu' },
  { value: 'gwangju-dong', label: '광주광역시 동구', region: 'gwangju' },
  { value: 'daejeon-yuseong', label: '대전광역시 유성구', region: 'daejeon' },
]

const transportOptions = [
  { value: 'airplane', label: '비행기' },
  { value: 'train', label: '기차' },
  { value: 'subway', label: '전철' },
  { value: 'official_car', label: '관용차' },
  { value: 'taxi', label: '택시' },
  { value: 'personal_car', label: '자차' },
  { value: 'other', label: '기타' }
]

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    destination: '',
    departure: '',
    purpose: '',
    startDate: '',
    endDate: '',
    isDayTrip: false,
    transport: '',
    customTransport: '',
    tripType: '',
    accommodationNeeded: false,
    accommodationType: '',
    accommodationDetails: '',
    distance: '',
    duration: '',
    budget: 0,
    specialRequirements: ''
  })

  const steps = [
    { id: 1, title: '기본 정보', emoji: '📝' },
    { id: 2, title: '이동 정보', emoji: '🗺️' },
    { id: 3, title: '숙박 정보', emoji: '🏨' },
    { id: 4, title: '확인', emoji: '✅' }
  ]

  const calculateDistance = (departure: string, destination: string) => {
    const depLocation = locations.find(loc => loc.value === departure)
    const destLocation = locations.find(loc => loc.value === destination)
    
    if (!depLocation || !destLocation) return null
    
    // 같은 지역이면 근거리, 다른 지역이면 원거리로 가정
    if (depLocation.region === destLocation.region) {
      return { distance: '15-30km', duration: '30분-1시간', type: 'internal' }
    } else {
      return { distance: '200-400km', duration: '3-5시간', type: 'external' }
    }
  }

  const travelInfo = formData.departure && formData.destination 
    ? calculateDistance(formData.departure, formData.destination) 
    : null

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      // 자동으로 출장 유형 설정
      if (currentStep === 2 && travelInfo) {
        setFormData(prev => ({ ...prev, tripType: travelInfo.type }))
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleCancel = () => {
    navigate('/')
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "로그인 필요",
          description: "출장을 등록하려면 로그인이 필요합니다.",
          variant: "destructive",
        })
        navigate('/auth')
        return
      }

      const tripData = {
        user_id: user.id,
        destination: locations.find(loc => loc.value === formData.destination)?.label || formData.destination,
        departure_location: locations.find(loc => loc.value === formData.departure)?.label || formData.departure,
        purpose: formData.purpose,
        start_date: formData.startDate,
        end_date: formData.isDayTrip ? formData.startDate : formData.endDate,
        trip_type: (formData.tripType === 'internal' ? '관내' : '관외') as '관내' | '관외',
        transportation: formData.transport === 'other' ? formData.customTransport : transportOptions.find(opt => opt.value === formData.transport)?.label,
        accommodation_needed: formData.accommodationNeeded,
        accommodation_info: formData.accommodationNeeded ? {
          type: formData.accommodationType,
          details: formData.accommodationDetails
        } : null,
        distance_km: travelInfo?.distance ? parseInt(travelInfo.distance.split('-')[0]) || null : null,
        budget: formData.budget || 0,
        status: 'planned' as 'planned' | 'ongoing' | 'completed' | 'cancelled',
        notes: formData.specialRequirements || null
      }

      console.log('Saving trip data:', tripData);
      
      const { data: savedTrip, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', error);
        throw error
      }
      
      console.log('Trip saved successfully:', savedTrip);

      toast({
        title: "출장 등록 완료",
        description: "출장이 성공적으로 등록되었습니다.",
      })

      navigate('/')
    } catch (error) {
      console.error('Error saving trip:', error)
      
      // 에러의 상세 정보 표시
      let errorMessage = "출장 등록 중 오류가 발생했습니다. 다시 시도해주세요.";
      
      if (error && typeof error === 'object' && 'message' in error) {
        if ((error as any).message.includes('invalid input syntax')) {
          errorMessage = "입력한 데이터 형식이 올바르지 않습니다. 날짜와 시간을 다시 확인해주세요.";
        } else if ((error as any).message.includes('violates row-level security policy')) {
          errorMessage = "권한이 없습니다. 로그인 상태를 확인해주세요.";
        } else if ((error as any).message.includes('not-null violation')) {
          errorMessage = "필수 입력 사항이 누락되었습니다. 모든 필드를 확인해주세요.";
        }
      }
      
      toast({
        title: "저장 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-xl font-semibold text-foreground">출장 기본 정보를 입력해주세요</h3>
              <p className="text-muted-foreground mt-2">출장지와 일정을 설정합니다</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="departure" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  출발지
                </Label>
                <Select value={formData.departure} onValueChange={(value) => setFormData({ ...formData, departure: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="출발지를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  출장지
                </Label>
                <Select value={formData.destination} onValueChange={(value) => setFormData({ ...formData, destination: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="출장지를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purpose">출장 목적</Label>
                <Input
                  id="purpose"
                  placeholder="예: 업무 회의, 교육 참석, 현장 점검 등"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="mt-2"
                />
              </div>

              {travelInfo && (
                <Card className="bg-accent/10 border-accent/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Car className="w-4 h-4 text-accent" />
                      <div>
                        <p><strong>예상 거리:</strong> {travelInfo.distance}</p>
                        <p><strong>예상 시간:</strong> {travelInfo.duration}</p>
                        <p><strong>출장 구분:</strong> {travelInfo.type === 'internal' ? '관내 출장' : '관외 출장'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center space-x-2 p-4 bg-secondary/30 rounded-lg">
                <Checkbox 
                  id="dayTrip"
                  checked={formData.isDayTrip}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDayTrip: checked as boolean })}
                />
                <Label htmlFor="dayTrip" className="font-medium">
                  하루 출장입니다
                </Label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="startDate">출발일</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-2"
                  />
                </div>
                
                {!formData.isDayTrip && (
                  <div>
                    <Label htmlFor="endDate">종료일</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🗺️</div>
              <h3 className="text-xl font-semibold text-foreground">이동 정보를 입력해주세요</h3>
              <p className="text-muted-foreground mt-2">출발지와 교통수단을 설정합니다</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>교통수단</Label>
                <Select value={formData.transport} onValueChange={(value) => setFormData({ ...formData, transport: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="교통수단을 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.transport === 'other' && (
                <div>
                  <Label htmlFor="customTransport">기타 교통수단</Label>
                  <Input
                    id="customTransport"
                    placeholder="교통수단을 직접 입력해주세요"
                    value={formData.customTransport}
                    onChange={(e) => setFormData({ ...formData, customTransport: e.target.value })}
                    className="mt-2"
                  />
                </div>
              )}

              {travelInfo && (
                <Card className="bg-accent/10 border-accent/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Car className="w-4 h-4 text-accent" />
                      <div>
                        <p><strong>예상 거리:</strong> {travelInfo.distance}</p>
                        <p><strong>예상 시간:</strong> {travelInfo.duration}</p>
                        <p><strong>출장 구분:</strong> {travelInfo.type === 'internal' ? '관내 출장' : '관외 출장'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🏨</div>
              <h3 className="text-xl font-semibold text-foreground">숙박 정보를 입력해주세요</h3>
              <p className="text-muted-foreground mt-2">숙박이 필요한 경우 정보를 입력합니다</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-secondary/30 rounded-lg">
                <Checkbox 
                  id="accommodationNeeded"
                  checked={formData.accommodationNeeded}
                  onCheckedChange={(checked) => setFormData({ ...formData, accommodationNeeded: checked as boolean })}
                />
                <Label htmlFor="accommodationNeeded" className="font-medium">
                  숙박이 필요합니다
                </Label>
              </div>

              {formData.accommodationNeeded && (
                <>
                  <div>
                    <Label>숙박 유형</Label>
                    <Select value={formData.accommodationType} onValueChange={(value) => setFormData({ ...formData, accommodationType: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="숙박 유형을 선택해주세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">호텔</SelectItem>
                        <SelectItem value="motel">모텔</SelectItem>
                        <SelectItem value="pension">펜션</SelectItem>
                        <SelectItem value="guesthouse">게스트하우스</SelectItem>
                        <SelectItem value="other">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="accommodationDetails">숙박 상세 정보</Label>
                    <Input
                      id="accommodationDetails"
                      placeholder="숙소명, 주소, 특이사항 등"
                      value={formData.accommodationDetails}
                      onChange={(e) => setFormData({ ...formData, accommodationDetails: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-xl font-semibold text-foreground">입력 정보를 확인해주세요</h3>
              <p className="text-muted-foreground mt-2">모든 정보가 정확한지 확인 후 저장합니다</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      장소 정보
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>출발지:</strong> {locations.find(loc => loc.value === formData.departure)?.label || '미선택'}</p>
                      <p><strong>출장지:</strong> {locations.find(loc => loc.value === formData.destination)?.label || '미선택'}</p>
                      <p><strong>출장 목적:</strong> {formData.purpose || '미입력'}</p>
                      <p><strong>출장 유형:</strong> {formData.tripType === 'internal' ? '관내' : formData.tripType === 'external' ? '관외' : '미선택'}</p>
                      {travelInfo && (
                        <p><strong>예상 거리:</strong> {travelInfo.distance} ({travelInfo.duration})</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      일정 정보
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>출발일:</strong> {formData.startDate || '미입력'}</p>
                      {!formData.isDayTrip && (
                        <p><strong>종료일:</strong> {formData.endDate || '미입력'}</p>
                      )}
                      <p><strong>일정:</strong> {formData.isDayTrip ? '당일 출장' : '숙박 출장'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    교통 정보
                  </h4>
                  <div className="text-sm">
                    <p>
                      <strong>교통수단:</strong> {
                        formData.transport 
                          ? formData.transport === 'other' 
                            ? formData.customTransport || '기타'
                            : transportOptions.find(opt => opt.value === formData.transport)?.label || '미선택'
                          : '미선택'
                      }
                    </p>
                  </div>
                </div>

                {formData.accommodationNeeded && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      숙박 정보
                    </h4>
                    <div className="text-sm space-y-2">
                      <p><strong>숙박 유형:</strong> {
                        formData.accommodationType === 'hotel' ? '호텔' :
                        formData.accommodationType === 'motel' ? '모텔' :
                        formData.accommodationType === 'pension' ? '펜션' :
                        formData.accommodationType === 'guesthouse' ? '게스트하우스' :
                        formData.accommodationType === 'other' ? '기타' :
                        '미선택'
                      }</p>
                      {formData.accommodationDetails && (
                        <p><strong>상세 정보:</strong> {formData.accommodationDetails}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-fade-in w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          새 출장 등록 ✈️
        </h1>
        <p className="text-muted-foreground">
          단계별로 출장 정보를 입력해주세요
        </p>
      </div>

      {/* 진행 단계 표시 */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-4 bg-card border border-border rounded-lg shadow-sm w-full">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 w-full overflow-x-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center shrink-0">
              <div className={`flex items-center justify-center w-6 sm:w-8 h-6 sm:h-8 rounded-full transition-smooth ${
                currentStep >= step.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <span className="text-xs sm:text-sm">{step.emoji}</span>
              </div>
              <div className="ml-1 sm:ml-2 hidden md:block min-w-0">
                <p className={`text-xs font-medium truncate ${
                  currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-3 sm:w-8 h-px mx-1 sm:mx-2 transition-smooth ${
                  currentStep > step.id ? 'bg-primary' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 메인 폼 카드 */}
      <Card className="shadow-medium w-full overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <span className="text-lg sm:text-xl">{steps[currentStep - 1].emoji}</span>
            <span className="truncate">{steps[currentStep - 1].title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 w-full min-w-0">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between gap-2 w-full">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 1}
            className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-smooth"
          >
            이전
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40 text-destructive hover:text-destructive transition-smooth"
          >
            <X className="w-4 h-4 mr-2" />
            취소하기
          </Button>
        </div>
        
        {currentStep < 4 ? (
          <Button 
            onClick={handleNext}
            disabled={
              (currentStep === 1 && (!formData.departure || !formData.destination || !formData.purpose || !formData.startDate || (!formData.isDayTrip && !formData.endDate))) ||
              (currentStep === 2 && !formData.transport) ||
              (currentStep === 3 && formData.accommodationNeeded && !formData.accommodationType)
            }
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <span className="hidden sm:inline">다음</span>
            <span className="sm:hidden">다음</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSave}
            disabled={isLoading || 
              !formData.departure || 
              !formData.destination || 
              !formData.purpose || 
              !formData.startDate || 
              (!formData.isDayTrip && !formData.endDate) ||
              !formData.transport ||
              (formData.accommodationNeeded && !formData.accommodationType)
            }
            className="bg-accent text-accent-foreground hover:bg-accent/90 transition-smooth shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{isLoading ? '저장 중...' : '저장하기'}</span>
            <span className="sm:hidden">{isLoading ? '저장중' : '저장'}</span>
          </Button>
        )}
      </div>
      </div>
    </div>
  )
}