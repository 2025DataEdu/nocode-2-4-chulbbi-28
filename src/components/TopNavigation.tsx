import { Home, Plus, FileText, BarChart3, Settings } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"

const navigationItems = [
  { title: "대시보드", url: "/", icon: Home },
  { title: "출장 등록", url: "/register", icon: Plus },
  { title: "출장 관리", url: "/manage", icon: FileText },
  { title: "증빙 자료", url: "/receipts", icon: BarChart3 },
  { title: "설정", url: "/settings", icon: Settings },
]

export function TopNavigation() {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-primary text-primary-foreground shadow-sm" 
      : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-6">
        {/* 로고 */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">출삐</h1>
            <p className="text-xs text-muted-foreground">출장비서</p>
          </div>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center gap-2">
          {navigationItems.map((item) => (
            <Button
              key={item.title}
              asChild
              variant="ghost"
              size="sm"
              className="h-10"
            >
              <NavLink 
                to={item.url} 
                end 
                className={getNavClassName}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span className="font-medium">{item.title}</span>
                </div>
              </NavLink>
            </Button>
          ))}
        </nav>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            환영합니다!
          </div>
        </div>
      </div>
    </header>
  )
}