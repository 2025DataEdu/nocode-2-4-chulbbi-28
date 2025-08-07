-- 보안 경고 해결: 함수 search_path 설정
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, user_type, organization, base_location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', '기타')::public.user_type,
    COALESCE(NEW.raw_user_meta_data->>'organization', ''),
    COALESCE(NEW.raw_user_meta_data->>'base_location', '')
  );
  RETURN NEW;
END;
$$;