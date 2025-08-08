import { useState, useEffect, createContext, useContext } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    
    // 최소 로딩 시간을 보장하기 위한 타이머
    const minLoadingTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 2000); // 2000ms 최소 로딩 시간

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          // 여기서는 로딩 상태를 변경하지 않음 (타이머가 처리)
        }
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        // 여기서도 로딩 상태를 변경하지 않음 (타이머가 처리)
      }
    })

    return () => {
      mounted = false;
      clearTimeout(minLoadingTimer);
      subscription.unsubscribe();
    }
  }, [])

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });
      
      if (error) {
        // 사용자 친화적 에러 메시지
        let message = "회원가입에 실패했습니다.";
        if (error.message.includes("already_registered")) {
          message = "이미 등록된 이메일입니다.";
        } else if (error.message.includes("invalid_email")) {
          message = "유효하지 않은 이메일 형식입니다.";
        } else if (error.message.includes("weak_password")) {
          message = "비밀번호가 너무 약합니다. 최소 6자 이상 입력해주세요.";
        }
        toast.error(message);
      } else {
        // 회원가입 완료 후 자동 로그인 방지를 위해 로그아웃
        await supabase.auth.signOut();
        toast.success("회원가입이 완료되었습니다! 로그인해주세요.");
      }
      
      return { error };
    } catch (error) {
      console.error('SignUp error:', error);
      toast.error("회원가입 중 오류가 발생했습니다.");
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // 사용자 친화적 에러 메시지
        let message = "로그인에 실패했습니다.";
        if (error.message.includes("invalid_credentials")) {
          message = "이메일 또는 비밀번호가 올바르지 않습니다.";
        } else if (error.message.includes("email_not_confirmed")) {
          message = "이메일 인증이 필요합니다. 이메일을 확인해주세요.";
        } else if (error.message.includes("too_many_requests")) {
          message = "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
        }
        toast.error(message);
      } else {
        toast.success("로그인되었습니다!");
      }
      
      return { error };
    } catch (error) {
      console.error('SignIn error:', error);
      toast.error("로그인 중 오류가 발생했습니다.");
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("로그아웃에 실패했습니다.");
      } else {
        toast.success("로그아웃되었습니다.");
      }
    } catch (error) {
      console.error('SignOut error:', error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      signUp,
      signIn,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}