-- RLS 정책 누락된 테이블들에 대한 보안 설정
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certified_restaurant ENABLE ROW LEVEL SECURITY;

-- accommodations 테이블은 공개 데이터이므로 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view accommodations" 
ON public.accommodations 
FOR SELECT 
USING (true);

-- certified_restaurant 테이블도 공개 데이터이므로 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view certified restaurants" 
ON public.certified_restaurant 
FOR SELECT 
USING (true);

-- receipts 테이블에 UPDATE, DELETE 정책 추가
CREATE POLICY "Users can update own receipts" 
ON public.receipts 
FOR UPDATE 
USING (EXISTS ( SELECT 1 FROM trips WHERE ((trips.id = receipts.trip_id) AND (trips.user_id = auth.uid()))));

CREATE POLICY "Users can delete own receipts" 
ON public.receipts 
FOR DELETE 
USING (EXISTS ( SELECT 1 FROM trips WHERE ((trips.id = receipts.trip_id) AND (trips.user_id = auth.uid()))));