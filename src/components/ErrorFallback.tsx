import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
  showDetails?: boolean
}

/**
 * 컴포넌트별 에러 폴백 UI
 */
export function ErrorFallback({ error, resetError, showDetails = false }: ErrorFallbackProps) {
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-xl">일시적인 문제가 발생했습니다</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground text-sm">
          컴포넌트를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        
        {showDetails && import.meta.env.DEV && error && (
          <details className="text-left bg-muted p-3 rounded text-xs">
            <summary className="cursor-pointer text-destructive font-medium">
              개발자 정보
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs">
              {error.message}
            </pre>
          </details>
        )}
        
        <div className="flex gap-2 justify-center">
          {resetError && (
            <Button 
              variant="outline" 
              onClick={resetError}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          )}
          <Button 
            asChild
            size="sm"
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              홈으로
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}