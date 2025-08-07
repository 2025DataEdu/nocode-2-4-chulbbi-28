import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Chatbot } from "@/components/Chatbot";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Manage from "./pages/Manage";
import Receipts from "./pages/Receipts";
import Settings from "./pages/Settings";
import TripDetails from "./pages/TripDetails";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* 챗봇 사이드바 - 고정 위치 */}
      <div className="w-80 h-full border-r border-border bg-card flex-shrink-0 overflow-hidden">
        <Chatbot isOpen={true} position="sidebar" />
      </div>
      
      {/* 메인 콘텐츠 영역 - 독립적 스크롤 */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/manage" element={<Manage />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/trip/:id" element={<TripDetails />} />
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