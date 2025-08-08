-- 영수증 이미지를 위한 Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- 영수증 테이블에 이미지 및 OCR 관련 컬럼 추가
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS ocr_text TEXT,
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS image_size_bytes INTEGER,
ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Storage 정책 생성 - 사용자는 자신의 영수증 이미지만 접근 가능
CREATE POLICY "Users can view their own receipt images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own receipt images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own receipt images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipt images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);