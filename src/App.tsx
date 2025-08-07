import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            
            <div className="flex-1 flex flex-col">
              {/* 헤더 */}
              <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="flex items-center justify-between h-full px-6">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger className="hover:bg-muted transition-smooth" />
                    <div className="hidden sm:block">
                      <h2 className="font-semibold text-foreground">출장비서 출삐</h2>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      환영합니다! 👋
                    </div>
                  </div>
                </div>
              </header>

              {/* 메인 콘텐츠 */}
              <main className="flex-1 p-6 overflow-auto">
                <div className="max-w-7xl mx-auto">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/register" element={<Register />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;