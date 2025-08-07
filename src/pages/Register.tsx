import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Car, Building, ArrowRight, Save } from "lucide-react"

const transportOptions = [
  { value: 'airplane', label: '비행기', emoji: '✈️' },
  { value: 'train', label: '기차', emoji: '🚄' },
  { value: 'subway', label: '전철', emoji: '🚇' },
  { value: 'official_car', label: '관용차', emoji: '🚗' },
  { value: 'taxi', label: '택시', emoji: '🚕' },
  { value: 'personal_car', label: '자차', emoji: '🚙' },
  { value: 'other', label: '기타', emoji: '🚌' }
]

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    isDayTrip: false,
    departure: '',
    transport: '',
    customTransport: '',
    tripType: '',
    distance: '',
    duration: ''
  })

  const steps = [
    { id: 1, title: '기본 정보', emoji: '📝' },
    { id: 2, title: '이동 정보', emoji: '🗺️' },
    { id: 3, title: '출장 유형', emoji: '🏢' },
    { id: 4, title: '확인', emoji: '✅' }
  ]

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
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
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  출장지
                </Label>
                <Input
                  id="destination"
                  placeholder="예: 부산광역시 해운대구"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="mt-2"
                />
              </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="departure">출발지</Label>
                <Input
                  id="departure"
                  placeholder="예: 서울특별시 중구"
                  value={formData.departure}
                  onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>교통수단</Label>
                <Select value={formData.transport} onValueChange={(value) => setFormData({ ...formData, transport: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="교통수단을 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.emoji}</span>
                          <span>{option.label}</span>
                        </div>
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

              {/* 거리/시간 자동 계산 결과 표시 */}
              {formData.departure && formData.destination && (
                <Card className="bg-gradient-primary/10 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Car className="w-4 h-4 text-primary" />
                      <div>
                        <p><strong>예상 거리:</strong> 약 340km</p>
                        <p><strong>예상 시간:</strong> 약 3시간 45분</p>
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
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-xl font-semibold text-foreground">출장 유형을 선택해주세요</h3>
              <p className="text-muted-foreground mt-2">기관 내부 또는 외부 출장을 구분합니다</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-smooth hover:shadow-medium ${
                  formData.tripType === 'internal' ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => setFormData({ ...formData, tripType: 'internal' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">🏢</div>
                  <h4 className="font-semibold mb-2">관내 출장</h4>
                  <p className="text-sm text-muted-foreground">
                    기관 내부 또는 동일 지역 내 출장
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-smooth hover:shadow-medium ${
                  formData.tripType === 'external' ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => setFormData({ ...formData, tripType: 'external' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">🌏</div>
                  <h4 className="font-semibold mb-2">관외 출장</h4>
                  <p className="text-sm text-muted-foreground">
                    기관 외부 또는 타 지역 출장
                  </p>
                </CardContent>
              </Card>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      장소 정보
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>출장지:</strong> {formData.destination || '미입력'}</p>
                      <p><strong>출발지:</strong> {formData.departure || '미입력'}</p>
                      <p><strong>출장 유형:</strong> {formData.tripType === 'internal' ? '관내' : formData.tripType === 'external' ? '관외' : '미선택'}</p>
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
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
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
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-smooth ${
              currentStep >= step.id 
                ? 'bg-gradient-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <span className="text-lg">{step.emoji}</span>
            </div>
            <div className="ml-3 hidden sm:block">
              <p className={`text-sm font-medium ${
                currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-px mx-4 transition-smooth ${
                currentStep > step.id ? 'bg-primary' : 'bg-border'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* 메인 폼 카드 */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">{steps[currentStep - 1].emoji}</span>
            {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 1}
          className="transition-smooth"
        >
          이전
        </Button>
        
        {currentStep < 4 ? (
          <Button 
            onClick={handleNext}
            className="bg-gradient-primary hover:shadow-medium transition-smooth"
          >
            다음 <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            className="bg-gradient-accent hover:shadow-medium transition-smooth"
          >
            <Save className="w-4 h-4 mr-2" />
            저장하기
          </Button>
        )}
      </div>
    </div>
  )
}