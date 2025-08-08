import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentUploadDialog } from "@/components/DocumentUploadDialog";
import { Settings, Upload, FileText, Database, Search, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TopNavigation } from "@/components/TopNavigation";

export default function DocumentManage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalChunks: 0,
    byulpyoTables: 0,
    lastUpdate: null as string | null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 전체 문서 및 청크 통계
      const { data: allChunks, error } = await supabase
        .from('documents')
        .select('document_id, content, created_at')
        .eq('user_id', user.id);

      if (error) throw error;

      const documentIds = new Set(allChunks?.map(chunk => chunk.document_id) || []);
      const byulpyoChunks = allChunks?.filter(chunk => 
        chunk.content.includes('[별표') || 
        chunk.content.includes('최우선_별표') ||
        chunk.content.includes('중요표')
      ) || [];

      const lastChunk = allChunks?.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      setStats({
        totalDocuments: documentIds.size,
        totalChunks: allChunks?.length || 0,
        byulpyoTables: byulpyoChunks.length,
        lastUpdate: lastChunk?.created_at || null
      });

    } catch (error) {
      console.error('Stats loading error:', error);
      toast({
        title: "통계 로딩 실패",
        description: "문서 통계를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReprocessAll = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase.functions.invoke('rag-admin', {
        body: { 
          action: 'reprocess_all',
          userId: user.id 
        }
      });

      if (error) throw error;

      toast({
        title: "재처리 시작",
        description: "모든 문서의 임베딩 재생성을 시작했습니다."
      });

      // 통계 새로고침
      setTimeout(() => loadStats(), 2000);

    } catch (error) {
      console.error('Reprocess error:', error);
      toast({
        title: "재처리 실패",
        description: "문서 재처리 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <main className="container mx-auto p-6 space-y-6 max-w-7xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">출삐 문서 관리</h1>
        </div>

        {/* 중요 안내 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>"[별표]" 내용 우선 처리:</strong> 업로드된 문서에서 "[별표]"로 시작하는 표와 기준표들이 
            자동으로 감지되어 검색 우선순위가 높게 설정됩니다. 
            정확한 규정 답변을 위해 "[별표]" 섹션이 포함된 문서를 업로드해 주세요.
          </AlertDescription>
        </Alert>

        {/* 문서 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">총 문서</p>
                  <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">총 청크</p>
                  <p className="text-2xl font-bold">{stats.totalChunks}</p>
                </div>
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">[별표] 표</p>
                  <p className="text-2xl font-bold text-primary">{stats.byulpyoTables}</p>
                </div>
                <Search className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">최근 업데이트</p>
                <p className="text-sm font-mono">
                  {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('ko-KR') : '없음'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 관리 기능 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                문서 업로드
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                PDF 또는 DOCX 문서를 업로드하여 RAG 시스템에 추가하세요. 
                "[별표]" 내용이 자동으로 우선 처리됩니다.
              </p>
              <Button 
                onClick={() => setUploadDialogOpen(true)}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                문서 업로드
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                시스템 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                모든 문서의 임베딩을 재생성하거나 통계를 새로고침할 수 있습니다.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={loadStats}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  통계 새로고침
                </Button>
                <Button 
                  onClick={handleReprocessAll}
                  variant="secondary"
                  className="w-full"
                  disabled={loading}
                >
                  전체 재처리
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 업로드 다이얼로그 */}
        <DocumentUploadDialog 
          open={uploadDialogOpen} 
          onOpenChange={setUploadDialogOpen}
        />
      </main>
    </div>
  );
}