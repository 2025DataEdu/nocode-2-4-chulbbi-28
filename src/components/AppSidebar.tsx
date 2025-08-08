import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Home, Plus, FileText, MessageSquare, Settings, BarChart3 } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { Chatbot } from "@/components/Chatbot"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { title: "대시보드", url: "/", icon: Home },
  { title: "출장 등록", url: "/register", icon: Plus },
  { title: "출장 관리", url: "/manage", icon: FileText },
  { title: "증빙 자료", url: "/receipts", icon: BarChart3 },
  { title: "설정", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"
  const isMobile = useIsMobile()


  return (
    <Sidebar className={`${collapsed ? "w-14 sm:w-16" : "w-48 sm:w-64"} transition-smooth border-r border-border bg-card`}>
      <SidebarContent className="p-2 sm:p-4">
        {/* Logo/Brand */}
        <div className="mb-6 px-2">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">출삐</h1>
                <p className="text-xs text-muted-foreground">출장비서</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
              <Home className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            메인 메뉴
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center gap-3 p-2 rounded-lg w-full ${isActive 
                          ? "bg-gradient-primary text-primary-foreground shadow-soft" 
                          : "hover:bg-muted/60 transition-smooth"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI 챗봇 섹션 */}
        <div className="mt-8 pt-6 border-t border-border">
          <button
            onClick={() => setIsChatbotOpen(true)}
            className={`w-full p-3 rounded-lg bg-accent text-accent-foreground transition-smooth hover:bg-accent-hover hover:shadow-md ${collapsed ? "mx-auto w-fit" : ""}`}
          >
            {!collapsed ? (
              <div className="text-center">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-accent-foreground" />
                <p className="text-sm font-medium text-accent-foreground mb-1">AI 출장 도우미</p>
                <p className="text-xs text-accent-foreground/70">궁금한 것을 물어보세요</p>
              </div>
            ) : (
              <MessageSquare className="h-6 w-6 text-accent-foreground" />
            )}
          </button>
        </div>
      </SidebarContent>
      
      {/* 챗봇 컴포넌트 */}
      <Chatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)}
        position={isMobile ? "floating" : "sidebar"}
      />
    </Sidebar>
  )
}