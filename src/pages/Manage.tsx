import { TopNavigation } from "@/components/TopNavigation"

export default function Manage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">출장 관리</h1>
            <p className="text-muted-foreground">진행 중이거나 완료된 출장을 관리하세요.</p>
          </div>
          
          <div className="bg-card rounded-lg border p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">출장 관리 기능</h2>
            <p className="text-muted-foreground">곧 제공될 예정입니다.</p>
          </div>
        </div>
      </main>
    </div>
  )
}