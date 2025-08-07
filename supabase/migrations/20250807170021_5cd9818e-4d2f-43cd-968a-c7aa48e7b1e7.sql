-- auth.users 테이블에 트리거 추가 (handle_new_user 함수 실행)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();