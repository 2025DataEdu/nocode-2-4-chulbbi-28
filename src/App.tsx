import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Chatbot } from "@/components/Chatbot";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Manage from "./pages/Manage";
import Receipts from "./pages/Receipts";
import Settings from "./pages/Settings";
import TripDetails from "./pages/TripDetails";
import DocumentManage from "./pages/DocumentManage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="인증 확인 중..." />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  
  return <>{children}</>
}

function AppContent() {
  const { user, loading } = useAuth()
  const { isOffline } = useNetworkStatus()
  
  // 로딩 중일 때는 항상 로딩 화면 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="앱을 불러오는 중..." />
      </div>
    )
  }

  // 로딩이 완료된 후에만 인증 상태에 따라 화면 결정
  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  // 인증된 사용자의 메인 앱 화면
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* 오프라인 상태 표시 */}
      {isOffline && (
        <div className="absolute top-0 left-0 right-0 bg-destructive text-destructive-foreground text-center py-2 text-sm font-medium z-50">
          ⚠️ 인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.
        </div>
      )}
      
      {/* 챗봇 사이드바 - 고정 위치 */}
      <div className={`w-80 h-full border-r border-border bg-card flex-shrink-0 overflow-hidden ${isOffline ? 'mt-10' : ''}`}>
        <Chatbot isOpen={true} position="sidebar" />
      </div>
      
      {/* 메인 콘텐츠 영역 - 독립적 스크롤 */}
      <div className={`flex-1 h-full flex flex-col overflow-hidden ${isOffline ? 'mt-10' : ''}`}>
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/manage" element={<Manage />} />
            <Route path="/documents" element={<DocumentManage />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/trip/:id" element={<TripDetails />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;