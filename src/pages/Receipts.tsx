import { useState, useEffect } from "react";
import { TopNavigation } from "@/components/TopNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, Upload, Calendar, Search, Plus, FileText, Download, Trash2 } from "lucide-react";

interface ReceiptData {
  id: string;
  trip_id: string;
  category: string;
  amount: number;
  receipt_date: string;
  description?: string;
  file_url?: string;
  image_path?: string;
  created_at: string;
  trips?: {
    destination: string;
    start_date: string;
    end_date: string;
  };
}

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
}

const categoryLabels: Record<string, string> = {
  교통비: '교통비',
  숙박비: '숙박비',
  식비: '식비',
  기타: '기타'
};

export default function Receipts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [newReceipt, setNewReceipt] = useState({
    trip_id: '',
    category: '',
    amount: '',
    receipt_date: '',
    description: '',
  });

  useEffect(() => {
    if (user) {
      fetchReceipts();
      fetchTrips();
    }
  }, [user]);

  const fetchReceipts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          trips:trip_id (
            destination,
            start_date,
            end_date
          )
        `)
        .order('receipt_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching receipts:', error);
        toast({
          title: "데이터 로딩 실패",
          description: "영수증 정보를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
      } else {
        setReceipts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('id, destination, start_date, end_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching trips:', error);
      } else {
        setTrips(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const uploadImageToStorage = async (file: File, receiptId: string): Promise<string | null> => {
    try {
      const fileName = `${user?.id}/${receiptId}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);
      
      if (error) {
        console.error('Storage upload error:', error);
        return null;
      }
      
      return fileName;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 이미지 파일 검증
      if (!file.type.startsWith('image/')) {
        toast({
          title: "파일 형식 오류",
          description: "이미지 파일만 업로드 가능합니다.",
          variant: "destructive"
        });
        return;
      }
      
      // 파일 크기 검증 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: "10MB 이하의 이미지만 업로드 가능합니다.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedImage(file);
    }
  };

  const handleAddReceipt = async () => {
    if (!user || !newReceipt.trip_id || !newReceipt.category || !newReceipt.amount || !newReceipt.receipt_date) {
      toast({
        title: "입력 오류",
        description: "모든 필수 필드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // 먼저 영수증 데이터를 삽입
      const receiptData: any = {
        trip_id: newReceipt.trip_id,
        category: newReceipt.category as '교통비' | '숙박비' | '식비' | '기타',
        amount: Number(newReceipt.amount),
        receipt_date: newReceipt.receipt_date,
        description: newReceipt.description || null,
      };

      if (selectedImage) {
        receiptData.image_size_bytes = selectedImage.size;
        receiptData.mime_type = selectedImage.type;
      }

      const { data: insertedReceipt, error } = await supabase
        .from('receipts')
        .insert(receiptData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }

      // 이미지가 있으면 업로드 및 OCR 처리
      if (selectedImage && insertedReceipt) {
        // 이미지 스토리지 업로드
        const imagePath = await uploadImageToStorage(selectedImage, insertedReceipt.id);
        
        if (imagePath) {
          // 이미지 경로 업데이트
          await supabase
            .from('receipts')
            .update({ image_path: imagePath })
            .eq('id', insertedReceipt.id);
        }

      }
      
      toast({
        title: "영수증 등록 완료",
        description: "영수증이 성공적으로 등록되었습니다."
      });
      
      setIsAddDialogOpen(false);
      setNewReceipt({
        trip_id: '',
        category: '',
        amount: '',
        receipt_date: '',
        description: '',
      });
      setSelectedImage(null);
      fetchReceipts();
    } catch (error) {
      console.error('Error adding receipt:', error);
      toast({
        title: "등록 실패",
        description: "영수증 등록 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // 검색 및 필터링 (안전한 접근)
  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = (receipt.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (receipt.trips?.destination?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || receipt.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 통계 계산
  const stats = {
    total: receipts.length,
    totalAmount: receipts.reduce((sum, receipt) => sum + receipt.amount, 0),
    byCategory: Object.keys(categoryLabels).reduce((acc, category) => {
      acc[category] = receipts.filter(r => r.category === category).reduce((sum, r) => sum + r.amount, 0);
      return acc;
    }, {} as Record<string, number>),
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-headline font-bold text-foreground mb-2">증빙 자료</h1>
              <p className="text-body text-muted-foreground">출장 관련 영수증과 증빙 자료를 관리하세요.</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  영수증 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>새 영수증 등록</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* 이미지 업로드 섹션 */}
                  <div>
                    <Label>영수증 사진 (선택사항)</Label>
                    <div className="mt-2">
                      {selectedImage ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(selectedImage)}
                              alt="선택된 영수증"
                              className="w-full h-40 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => setSelectedImage(null)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="block">
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">사진을 선택하거나 드래그하세요</p>
                            <p className="text-xs text-muted-foreground">JPG, PNG (최대 10MB)</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="trip">출장 선택</Label>
                    <Select value={newReceipt.trip_id} onValueChange={(value) => setNewReceipt(prev => ({ ...prev, trip_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="출장을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {trips.map((trip) => (
                          <SelectItem key={trip.id} value={trip.id}>
                            {trip.destination} ({new Date(trip.start_date).toLocaleDateString('ko-KR')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">카테고리</Label>
                    <Select value={newReceipt.category} onValueChange={(value) => setNewReceipt(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">금액</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="금액을 입력하세요"
                      value={newReceipt.amount}
                      onChange={(e) => setNewReceipt(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date">날짜</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newReceipt.receipt_date}
                      onChange={(e) => setNewReceipt(prev => ({ ...prev, receipt_date: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">설명 (선택사항)</Label>
                    <Input
                      id="description"
                      placeholder="영수증 설명"
                      value={newReceipt.description}
                      onChange={(e) => setNewReceipt(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <Button onClick={handleAddReceipt} disabled={uploading} className="w-full">
                    {uploading ? '등록 중...' : '등록하기'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">전체 영수증</p>
                  <p className="text-title font-bold text-foreground">{stats.total}건</p>
                </div>
                <Receipt className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">총 지출액</p>
                  <p className="text-title font-bold text-foreground">{stats.totalAmount.toLocaleString()}원</p>
                </div>
                <FileText className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">교통비</p>
                  <p className="text-title font-bold text-foreground">{stats.byCategory.교통비?.toLocaleString() || 0}원</p>
                </div>
                <Badge variant="secondary">
                  {((stats.byCategory.교통비 || 0) / Math.max(stats.totalAmount, 1) * 100).toFixed(0)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">숙박비</p>
                  <p className="text-title font-bold text-foreground">{stats.byCategory.숙박비?.toLocaleString() || 0}원</p>
                </div>
                <Badge variant="secondary">
                  {((stats.byCategory.숙박비 || 0) / Math.max(stats.totalAmount, 1) * 100).toFixed(0)}%
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
                    placeholder="영수증 설명이나 출장지로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 카테고리</SelectItem>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 영수증 목록 */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle>영수증 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReceipts.length > 0 ? (
              <div className="space-y-4">
                {filteredReceipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">
                          {categoryLabels[receipt.category] || receipt.category}
                        </Badge>
                        {receipt.image_path && (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            사진
                          </Badge>
                        )}
                        <span className="text-caption text-muted-foreground">
                          {receipt.trips?.destination || '출장지 정보 없음'} • {new Date(receipt.receipt_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">{receipt.description || '설명 없음'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{receipt.amount.toLocaleString()}원</p>
                      <p className="text-caption text-muted-foreground">
                        {new Date(receipt.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm || selectedCategory !== 'all' ? '검색 결과가 없습니다' : '등록된 영수증이 없습니다'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== 'all' ? '다른 검색 조건으로 시도해보세요' : '첫 영수증을 등록해보세요'}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  영수증 등록
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}