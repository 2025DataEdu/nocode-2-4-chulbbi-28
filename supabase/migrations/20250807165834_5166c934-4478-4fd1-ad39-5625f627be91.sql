-- profiles 테이블에 username 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;

-- username을 위한 인덱스 생성
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- username 중복 체크를 위한 함수 생성
CREATE OR REPLACE FUNCTION public.check_username_availability(username_to_check text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = username_to_check
  );
$$;