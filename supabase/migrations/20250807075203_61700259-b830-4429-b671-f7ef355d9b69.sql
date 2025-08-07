-- 사용자 프로필 테이블
CREATE TYPE user_type AS ENUM ('공무원', '공공기관', '기타');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  user_type user_type NOT NULL,
  organization TEXT NOT NULL,
  base_location TEXT NOT NULL, -- 출발지(기준지)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 출장 테이블
CREATE TYPE trip_type AS ENUM ('관내', '관외');
CREATE TYPE trip_status AS ENUM ('planned', 'ongoing', 'completed', 'cancelled');

CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination TEXT NOT NULL,
  departure_location TEXT NOT NULL,
  purpose TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  trip_type trip_type NOT NULL,
  status trip_status DEFAULT 'planned',
  budget DECIMAL(10,2),
  spent DECIMAL(10,2) DEFAULT 0,
  distance_km DECIMAL(8,2),
  transportation TEXT,
  accommodation_needed BOOLEAN DEFAULT false,
  accommodation_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 증빙자료 테이블
CREATE TYPE receipt_category AS ENUM ('교통비', '숙박비', '식비', '기타');

CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  category receipt_category NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  receipt_date DATE NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- 프로필 정책
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 출장 정책
CREATE POLICY "Users can view own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- 증빙자료 정책
CREATE POLICY "Users can view own receipts" ON public.receipts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = receipts.trip_id AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own receipts" ON public.receipts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = receipts.trip_id AND trips.user_id = auth.uid()
  ));

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, user_type, organization, base_location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', '기타')::user_type,
    COALESCE(NEW.raw_user_meta_data->>'organization', ''),
    COALESCE(NEW.raw_user_meta_data->>'base_location', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();