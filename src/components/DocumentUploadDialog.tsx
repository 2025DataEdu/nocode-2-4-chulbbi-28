import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UploadCloud, FileText, Trash2, RefreshCcw } from "lucide-react";

// pdf.js (browser)
// @ts-ignore - Vite will resolve worker url
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist";
// mammoth for DOCX in browser
// @ts-ignore
import mammoth from "mammoth/mammoth.browser";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChunkItem {
  content: string;
  chunk_index: number;
}

interface ListedDoc {
  document_id: string;
  doc_title: string | null;
  created_at: string;
  chunk_count: number;
}

export function DocumentUploadDialog({ open, onOpenChange }: DocumentUploadDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<ListedDoc[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (open) {
      void loadDocs();
    }
  }, [open]);

  const fileExt = useMemo(() => file?.name.split(".").pop()?.toLowerCase() || "", [file]);

  const enhanceTableStructure = (text: string): string => {
    // 표 구조를 개선하여 더 명확하게 만들기
    let enhanced = text;
    
    // 연속된 공백을 탭이나 구분자로 변환
    enhanced = enhanced.replace(/\s{2,}/g, ' | ');
    
    // 숫자와 단위가 붙어있는 경우 공백 추가
    enhanced = enhanced.replace(/(\d+)(원|%|명|일|시간|분|년|월|개|건|급|등|호|차)/g, '$1$2');
    
    // 표 행 구분을 명확하게
    enhanced = enhanced.replace(/\n\s*\n/g, '\n');
    
    // "[별표]" 관련 내용 강화
    enhanced = enhanced.replace(/(\[별표[^\]]*\])/g, '\n\n**[중요표]** $1');
    
    return enhanced;
  };

  const extractSpecialTables = (text: string): { tables: string[], cleanedText: string } => {
    // "[별표]"로 시작하는 섹션을 추출하는 정규식 개선
    const tablePattern = /(\[별표[^\]]*\][\s\S]*?)(?=\[별표[^\]]*\]|$)/g;
    const tables: string[] = [];
    const cleanedSections: string[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = tablePattern.exec(text)) !== null) {
      // 매치 이전 텍스트 저장
      if (match.index > lastIndex) {
        cleanedSections.push(text.slice(lastIndex, match.index));
      }
      
      let tableContent = match[1].trim();
      
      // 표 내용 후처리 및 구조화
      tableContent = enhanceTableStructure(tableContent);
      
      // "[별표]" 내용에 특별 마커 추가 (검색 우선순위 상승용)
      const enhancedTable = `**[최우선_별표_내용]** ${tableContent}
      
**[표_구조_요약]** 이 내용은 중요한 기준표나 규정표입니다.
**[검색_키워드]** 별표 표 기준 규정 한도 금액 지급 수당 여비 교통비 숙박비 식비`;
      
      // 표 내용이 충분히 길면 독립적으로 처리
      if (tableContent.length > 50) {
        tables.push(enhancedTable);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // 남은 텍스트 추가
    if (lastIndex < text.length) {
      cleanedSections.push(text.slice(lastIndex));
    }
    
    const cleanedText = cleanedSections.join('');
    
    console.log(`"[별표]" 표 ${tables.length}개를 추출했습니다.`);
    
    return { tables, cleanedText };
  };

  const chunkText = (text: string, size = 400, overlap = 50): ChunkItem[] => {
    // 먼저 "[별표]" 표들을 추출
    const { tables, cleanedText } = extractSpecialTables(text);
    
    const cleaned = cleanedText.replace(/\s+/g, " ").trim();
    const chunks: ChunkItem[] = [];
    let index = 0;
    
    // 1. 최우선: "[별표]" 표들을 가장 앞에 배치 (작은 청크 크기로 정밀 처리)
    tables.forEach(table => {
      // "[별표]" 내용은 더 작은 단위로 청킹하여 정확도 향상
      const tableChunks = [];
      let i = 0;
      while (i < table.length) {
        const end = Math.min(i + 300, table.length); // 더 작은 청크
        const piece = table.slice(i, end);
        tableChunks.push(piece.trim());
        i += 250; // 더 많은 중복으로 정확도 향상
      }
      
      tableChunks.forEach(chunk => {
        if (chunk.length > 20) { // 너무 짧은 청크 제외
          chunks.push({ 
            content: `**[최우선순위_별표]** ${chunk}`, 
            chunk_index: index++ 
          });
        }
      });
    });
    
    // 2. 일반 텍스트 청킹 (기존 로직 개선)
    let i = 0;
    while (i < cleaned.length) {
      const end = Math.min(i + size, cleaned.length);
      let piece = cleaned.slice(i, end);
      
      // 문장 경계에서 자르기 (더 자연스러운 청킹)
      if (end < cleaned.length) {
        const lastPeriod = piece.lastIndexOf('.');
        const lastExclamation = piece.lastIndexOf('!');
        const lastQuestion = piece.lastIndexOf('?');
        const lastNewline = piece.lastIndexOf('\n');
        
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion, lastNewline);
        if (lastSentenceEnd > size * 0.5) { // 청크의 절반 이상인 경우에만 적용
          piece = piece.slice(0, lastSentenceEnd + 1);
        }
      }
      
      // 청크에 "[별표]" 내용이 포함된 경우 우선순위 표시
      if (piece.includes('[별표') || piece.includes('별표')) {
        piece = `**[우선순위_별표포함]** ${piece}`;
      }
      
      // 중요 키워드가 포함된 경우 우선순위 표시
      const importantKeywords = ['한도', '기준', '지급', '수당', '여비', '교통비', '숙박비', '식비', '일비'];
      const hasImportantKeyword = importantKeywords.some(keyword => piece.includes(keyword));
      if (hasImportantKeyword && !piece.includes('**[우선순위')) {
        piece = `**[중요규정]** ${piece}`;
      }
      
      if (piece.trim().length > 20) { // 너무 짧은 청크 제외
        chunks.push({ content: piece.trim(), chunk_index: index++ });
      }
      
      // 다음 청크 시작점 계산
      const actualPieceLength = piece.replace(/\*\*\[.*?\]\*\*\s*/, '').length;
      i += Math.max(actualPieceLength - overlap, 10);
    }
    
    console.log(`총 ${chunks.length}개 청크 생성 (별표 우선순위: ${tables.length}개)`);
    return chunks;
  };

  const extractFromPDF = async (file: File): Promise<string> => {
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let fullText = "";
    
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      
      // 텍스트 아이템들을 위치 정보와 함께 정렬
      const items = content.items as any[];
      items.sort((a, b) => {
        // Y 좌표 기준으로 먼저 정렬 (위에서 아래로)
        if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
          return b.transform[5] - a.transform[5];
        }
        // 같은 줄이면 X 좌표 기준으로 정렬 (왼쪽에서 오른쪽으로)
        return a.transform[4] - b.transform[4];
      });
      
      let pageText = "";
      let currentY = null;
      
      for (const item of items) {
        const y = Math.round(item.transform[5]);
        const text = item.str;
        
        // 새로운 줄인 경우
        if (currentY !== null && Math.abs(currentY - y) > 5) {
          pageText += "\n";
        }
        
        // 표 구조를 위한 공백 처리
        if (text.trim()) {
          pageText += text + " ";
        }
        
        currentY = y;
      }
      
      // "[별표]" 내용 강화 및 OCR 스타일 후처리
      if (pageText.includes('[별표') || pageText.includes('별표')) {
        // "[별표]" 섹션 시작을 명확히 표시
        pageText = pageText.replace(/(\[별표[^\]]*\])/g, '\n\n**[중요표_시작]** $1\n');
        
        // 표 형태의 데이터 구조 개선
        pageText = pageText.replace(/([가-힣]+)\s+([0-9,]+원)\s+([가-힣]+)/g, '$1 | $2 | $3');
        pageText = pageText.replace(/(\d+급)\s+(\d+원)\s+(\d+원)/g, '$1 | $2 | $3');
        
        console.log(`페이지 ${p}에서 "[별표]" 내용 발견 및 강화 완료`);
      }
      
      // 전체 텍스트에서 표 구조 개선
      pageText = enhanceTableStructure(pageText);
      
      fullText += `\n\n[page ${p}]\n` + pageText;
    }
    
    // 문서 끝까지 처리 완료 후 최종 "[별표]" 검증
    const byulpyoCount = (fullText.match(/\[별표/g) || []).length;
    console.log(`PDF 전체에서 "[별표]" ${byulpyoCount}개 섹션을 감지했습니다.`);
    
    return fullText;
  };

  const extractFromDOCX = async (file: File): Promise<string> => {
    const ab = await file.arrayBuffer();
    
    // 표 구조를 유지하면서 텍스트 추출
    const result = await mammoth.extractRawText({ 
      arrayBuffer: ab,
      styleMap: [
        // 표 구조를 텍스트로 변환할 때 구분자 유지
        "p[style-name='Table Heading'] => p.table-header:",
        "p[style-name='Table Text'] => p.table-text:"
      ]
    });
    
    let text = result.value as string;
    
    // "[별표]" 내용 강화 및 구조 개선
    text = text.replace(/(\[별표[^\]]*\])/g, '\n\n**[중요표_시작]** $1\n');
    
    // DOCX의 표 구조를 텍스트로 변환할 때 마크다운 형태로 정리
    text = text.replace(/\t+/g, ' | '); // 탭을 구분자로
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // 과도한 줄바꿈 정리
    
    // 표 구조 개선
    text = enhanceTableStructure(text);
    
    const byulpyoCount = (text.match(/\[별표/g) || []).length;
    console.log(`DOCX에서 "[별표]" ${byulpyoCount}개 섹션을 감지했습니다.`);
    
    return text;
  };

  const handleUpload = async () => {
    try {
      if (!file) {
        toast({ title: "파일을 선택해주세요", variant: "destructive" });
        return;
      }
      if (!title.trim()) {
        toast({ title: "문서 제목을 입력해주세요", variant: "destructive" });
        return;
      }
      setLoading(true);

      let text = "";
      if (fileExt === "pdf") {
        text = await extractFromPDF(file);
      } else if (fileExt === "docx") {
        text = await extractFromDOCX(file);
      } else {
        toast({ title: "PDF 또는 DOCX만 지원합니다", variant: "destructive" });
        return;
      }

      const chunks = chunkText(text, 400, 50); // 더 작은 청크로 정밀도 향상
      if (chunks.length === 0) {
        toast({ title: "추출된 텍스트가 없습니다", variant: "destructive" });
        return;
      }

      const documentId = crypto.randomUUID();

      const { data, error } = await supabase.functions.invoke("rag-ingest", {
        body: {
          title,
          documentId,
          chunks,
        },
      });

      if (error) throw error;

      toast({ title: "업로드 완료", description: `${chunks.length}개 청크를 저장했습니다.` });
      setFile(null);
      setTitle("");
      await loadDocs();
    } catch (e: any) {
      console.error(e);
      toast({ title: "업로드 실패", description: e?.message || "오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDocs = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await (supabase as any)
        .from("documents")
        .select("document_id, doc_title, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map = new Map<string, ListedDoc & { _count: number }>();
      (data || []).forEach((row: any) => {
        const key = row.document_id;
        const prev = map.get(key);
        if (!prev) {
          map.set(key, {
            document_id: row.document_id,
            doc_title: row.doc_title,
            created_at: row.created_at,
            chunk_count: 1,
            _count: 1,
          });
        } else {
          prev._count += 1;
          prev.chunk_count = prev._count;
          map.set(key, prev);
        }
      });
      setDocs(Array.from(map.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      setRefreshing(true);
      const { error } = await (supabase as any).from("documents").delete().eq("document_id", documentId);
      if (error) throw error;
      toast({ title: "삭제 완료" });
      await loadDocs();
    } catch (e: any) {
      console.error(e);
      toast({ title: "삭제 실패", description: e?.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleReembed = async (documentId: string) => {
    try {
      setRefreshing(true);
      const { error } = await supabase.functions.invoke("rag-admin", {
        body: { action: "reembed", documentId },
      });
      if (error) throw error;
      toast({ title: "임베딩 재생성 요청 완료" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "재생성 실패", description: e?.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>규정 문서 업로드</DialogTitle>
          <DialogDescription>PDF 또는 DOCX를 업로드하면 텍스트를 자동 분할하여 벡터 DB에 저장합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">문서 제목</Label>
            <Input id="title" placeholder="예: 사내 인사 규정 v1.2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="file">파일 선택 (PDF, DOCX)</Label>
            <Input id="file" type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>취소</Button>
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              업로드 및 인덱싱
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">내 업로드 문서</h3>
              <Button variant="ghost" size="sm" onClick={loadDocs} disabled={refreshing}>
                <RefreshCcw className="h-4 w-4 mr-1" /> 새로고침
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-md border">
              {docs.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">업로드된 문서가 없습니다.</div>
              ) : (
                <ul className="divide-y">
                  {docs.map((d) => (
                    <li key={d.document_id} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="truncate">
                          <div className="text-sm font-medium truncate">{d.doc_title || "제목 없음"}</div>
                          <div className="text-xs text-muted-foreground">청크 {d.chunk_count} • {new Date(d.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleReembed(d.document_id)} disabled={refreshing}>
                          임베딩 재생성
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(d.document_id)} disabled={refreshing}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
