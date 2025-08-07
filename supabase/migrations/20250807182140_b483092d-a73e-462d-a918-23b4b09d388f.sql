-- 출장비 규정 테이블 생성
CREATE TABLE public.business_trip_allowances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization TEXT NOT NULL,
  region TEXT NOT NULL,
  daily_meal_allowance NUMERIC NOT NULL DEFAULT 0,
  daily_lodging_allowance NUMERIC NOT NULL DEFAULT 0,
  transportation_rate_per_km NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization, region)
);

-- Enable Row Level Security
ALTER TABLE public.business_trip_allowances ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 출장비 규정을 조회할 수 있도록 정책 설정
CREATE POLICY "Anyone can view allowances" 
ON public.business_trip_allowances 
FOR SELECT 
USING (true);

-- 관리자나 인사팀만 출장비 규정을 생성/수정할 수 있도록 정책 설정 (나중에 필요시 수정)
CREATE POLICY "Admin can manage allowances" 
ON public.business_trip_allowances 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- 기본 출장비 규정 데이터 삽입 (예시)
INSERT INTO public.business_trip_allowances (organization, region, daily_meal_allowance, daily_lodging_allowance, transportation_rate_per_km) VALUES
('기본', '서울', 50000, 80000, 300),
('기본', '경기', 45000, 70000, 300),
('기본', '부산', 45000, 70000, 300),
('기본', '대구', 40000, 60000, 300),
('기본', '인천', 45000, 70000, 300),
('기본', '광주', 40000, 60000, 300),
('기본', '대전', 40000, 60000, 300),
('기본', '울산', 40000, 60000, 300),
('기본', '세종', 40000, 60000, 300),
('기본', '강원', 35000, 50000, 300),
('기본', '충북', 35000, 50000, 300),
('기본', '충남', 35000, 50000, 300),
('기본', '전북', 35000, 50000, 300),
('기본', '전남', 35000, 50000, 300),
('기본', '경북', 35000, 50000, 300),
('기본', '경남', 35000, 50000, 300),
('기본', '제주', 50000, 90000, 300);