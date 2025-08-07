import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { Eye, EyeOff, AlertCircle, Check, X } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

const locations = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", 
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도",
  "경상남도", "제주특별자치도"
]

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    userType: "",
    organization: "",
    baseLocation: ""
  })
  const { signIn, signUp, loading } = useAuth()
  const navigate = useNavigate()
  const checkUsernameAvailability = async () => {
    if (!formData.username.trim()) return
    
    setUsernameChecking(true)
    try {
      const { data, error } = await supabase.rpc('check_username_availability', {
        username_to_check: formData.username
      })
      
      if (error) {
        console.error('Username check error:', error)
        setUsernameAvailable(null)
      } else {
        setUsernameAvailable(data)
      }
    } catch (error) {
      console.error('Username check error:', error)
      setUsernameAvailable(null)
    } finally {
      setUsernameChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // 아이디를 이메일 형식으로 변환 (Supabase Auth 호환)
    const emailForAuth = `${formData.username}@app.local`
    
    if (isLogin) {
      const { error } = await signIn(emailForAuth, formData.password)
      if (error) {
        if (error.message === "Email not confirmed") {
          setError("이메일 확인이 필요합니다. 관리자에게 문의하세요.")
        } else {
          setError("로그인에 실패했습니다: 아이디 또는 비밀번호를 확인해주세요.")
        }
      } else {
        navigate("/")
      }
    } else {
      if (!formData.userType || !formData.organization || !formData.baseLocation) {
        setError("모든 필드를 입력해주세요.")
        return
      }
      
      if (usernameAvailable !== true) {
        setError("아이디 중복체크를 완료해주세요.")
        return
      }
      
      const userData = {
        user_type: formData.userType,
        organization: formData.organization,
        base_location: formData.baseLocation,
        username: formData.username
      }
      
      const { error } = await signUp(emailForAuth, formData.password, userData)
      if (error) {
        setError("회원가입에 실패했습니다: " + error.message)
      } else {
        setError("")
        setIsLogin(true)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            {isLogin ? "로그인" : "회원가입"} ✈️
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, username: e.target.value }))
                    setUsernameAvailable(null)
                  }}
                  required
                />
                {!isLogin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={checkUsernameAvailability}
                    disabled={!formData.username.trim() || usernameChecking}
                    className="whitespace-nowrap"
                  >
                    {usernameChecking ? "확인중..." : "중복체크"}
                  </Button>
                )}
              </div>
              {!isLogin && usernameAvailable !== null && (
                <div className={`flex items-center gap-1 text-sm ${
                  usernameAvailable ? 'text-green-600' : 'text-red-600'
                }`}>
                  {usernameAvailable ? (
                    <>
                      <Check className="h-4 w-4" />
                      사용 가능한 아이디입니다
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      이미 사용중인 아이디입니다
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="userType">사용자 유형</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, userType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="유형을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="공무원">공무원</SelectItem>
                      <SelectItem value="공공기관">공공기관</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">기관명</Label>
                  <Input
                    id="organization"
                    placeholder="소속 기관을 입력하세요"
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseLocation">출발지(기준지)</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, baseLocation: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="기준지를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:shadow-medium transition-smooth"
              disabled={loading}
            >
              {loading ? "처리중..." : (isLogin ? "로그인" : "회원가입")}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError("")
                  setUsernameAvailable(null)
                  setFormData({
                    username: "",
                    password: "",
                    userType: "",
                    organization: "",
                    baseLocation: ""
                  })
                }}
              >
                {isLogin ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}