-- 기존 사용자의 이메일을 확인 처리
UPDATE auth.users 
SET email_confirmed_at = now(), 
    updated_at = now()
WHERE email = 'abc123@gmail.com' AND email_confirmed_at IS NULL;