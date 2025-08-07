-- handle_new_user 함수를 업데이트하여 username 필드 포함
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, user_type, organization, base_location, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', '기타')::public.user_type,
    COALESCE(NEW.raw_user_meta_data->>'organization', ''),
    COALESCE(NEW.raw_user_meta_data->>'base_location', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', '')
  );
  RETURN NEW;
END;
$$;