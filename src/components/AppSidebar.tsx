import { useState } from "react"
import { Home, Plus, FileText, MessageSquare, Settings, BarChart3 } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
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
  { title: "대시보드", url: "/", icon: Home, emoji: "🏠" },
  { title: "출장 등록", url: "/register", icon: Plus, emoji: "➕" },
  { title: "출장 관리", url: "/manage", icon: FileText, emoji: "📋" },
  { title: "증빙 자료", url: "/receipts", icon: BarChart3, emoji: "🧾" },
  { title: "설정", url: "/settings", icon: Settings, emoji: "⚙️" },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path
  const isExpanded = navigationItems.some((item) => isActive(item.url))

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-primary text-primary-foreground shadow-soft" 
      : "hover:bg-muted/60 transition-smooth"

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} transition-smooth border-r border-border bg-card`}>
      <SidebarContent className="p-4">
        {/* Logo/Brand */}
        <div className="mb-6 px-2">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center text-lg">
                🎒
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">출삐</h1>
                <p className="text-xs text-muted-foreground">출장비서</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center text-lg mx-auto">
              🎒
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
                      className={getNavClassName}
                    >
                      <div className="flex items-center gap-3 p-2 rounded-lg w-full">
                        <span className="text-lg">{item.emoji}</span>
                        {!collapsed && (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI 챗봇 섹션 */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className={`p-3 rounded-lg bg-gradient-accent transition-smooth hover:shadow-soft ${collapsed ? "mx-auto w-fit" : ""}`}>
            {!collapsed ? (
              <div className="text-center">
                <div className="text-2xl mb-2">🤖</div>
                <p className="text-sm font-medium text-accent-foreground mb-1">AI 출장 도우미</p>
                <p className="text-xs text-accent-foreground/70">궁금한 것을 물어보세요!</p>
              </div>
            ) : (
              <div className="text-2xl">🤖</div>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}