import { useState, useEffect } from "react";
import { TopNavigation } from "@/components/TopNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, User, Bell, Shield, Globe, Palette, Database } from "lucide-react";

interface UserProfile {
  user_type: string;
  organization: string;
  base_location: string;
  username: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'ko',
    autoSave: true,
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116은 결과 없음을 의미
        throw error;
      }
      
      setProfile(data || {
        user_type: '',
        organization: '',
        base_location: '',
        username: user.email?.split('@')[0] || ''
      });
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      toast({
        title: "프로필 로딩 실패",
        description: error?.message || "사용자 정보를 불러올 수 없습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: profile.user_type as '공무원' | '공공기관' | '기타',
          organization: profile.organization,
          base_location: profile.base_location,
          username: profile.username,
        })
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "설정 저장 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다."
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "저장 실패",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-headline font-bold text-foreground mb-2">설정</h1>
          <p className="text-body text-muted-foreground">앱 설정과 개인 정보를 관리하세요.</p>
        </div>

        <div className="grid gap-6">
          {/* 프로필 정보 */}
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                프로필 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">사용자명</Label>
                      <Input
                        id="username"
                        value={profile.username || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                        placeholder="사용자명을 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="organization">소속 기관</Label>
                      <Input
                        id="organization"
                        value={profile.organization || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, organization: e.target.value } : null)}
                        placeholder="소속 기관을 입력하세요"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="userType">사용자 유형</Label>
                      <Select 
                        value={profile.user_type || ''} 
                        onValueChange={(value) => setProfile(prev => prev ? { ...prev, user_type: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="사용자 유형 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="공무원">공무원</SelectItem>
                          <SelectItem value="교직원">교직원</SelectItem>
                          <SelectItem value="직장인">직장인</SelectItem>
                          <SelectItem value="기타">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="baseLocation">근무지</Label>
                      <Input
                        id="baseLocation"
                        value={profile.base_location || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, base_location: e.target.value } : null)}
                        placeholder="근무지를 입력하세요"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleProfileUpdate} 
                    disabled={saving}
                    className="w-full md:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? '저장 중...' : '프로필 저장'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">프로필 정보를 불러올 수 없습니다.</p>
                  <Button onClick={fetchProfile} variant="outline" className="mt-2">
                    다시 시도
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 앱 설정 */}
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                앱 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>알림 설정</Label>
                  <p className="text-caption text-muted-foreground">출장 관련 알림을 받습니다</p>
                </div>
                <Switch 
                  checked={settings.notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>자동 저장</Label>
                  <p className="text-caption text-muted-foreground">입력 중인 내용을 자동으로 저장합니다</p>
                </div>
                <Switch 
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSave: checked }))}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>언어 설정</Label>
                <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 계정 정보 */}
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                계정 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>이메일</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div>
                  <Label>계정 생성일</Label>
                  <Input 
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : ''} 
                    disabled 
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <Shield className="h-3 w-3 mr-1" />
                  인증된 계정
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}