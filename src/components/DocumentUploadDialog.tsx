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

  const chunkText = (text: string, size = 500, overlap = 50): ChunkItem[] => {
    const cleaned = text.replace(/\s+/g, " ").trim();
    const chunks: ChunkItem[] = [];
    let i = 0;
    let index = 0;
    while (i < cleaned.length) {
      const end = Math.min(i + size, cleaned.length);
      const piece = cleaned.slice(i, end);
      chunks.push({ content: piece, chunk_index: index++ });
      i += size - overlap;
    }
    return chunks;
  };

  const extractFromPDF = async (file: File): Promise<string> => {
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let fullText = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const strings = (content.items as any[]).map((item) => item.str).join(" ");
      fullText += `\n\n[page ${p}]\n` + strings;
    }
    return fullText;
  };

  const extractFromDOCX = async (file: File): Promise<string> => {
    const ab = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: ab });
    return result.value as string;
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

      const chunks = chunkText(text, 500, 50);
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
