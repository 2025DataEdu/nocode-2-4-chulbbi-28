import { cn } from "@/lib/utils"
import { CheckCircle, Clock, AlertCircle, XCircle, Wifi, WifiOff } from "lucide-react"

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'loading' | 'online' | 'offline'
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    className: "text-green-600 bg-green-50 border-green-200",
    iconClassName: "text-green-600"
  },
  warning: {
    icon: AlertCircle,
    className: "text-yellow-600 bg-yellow-50 border-yellow-200",
    iconClassName: "text-yellow-600"
  },
  error: {
    icon: XCircle,
    className: "text-destructive bg-destructive/10 border-destructive/20",
    iconClassName: "text-destructive"
  },
  info: {
    icon: Clock,
    className: "text-primary bg-primary/10 border-primary/20",
    iconClassName: "text-primary"
  },
  loading: {
    icon: Clock,
    className: "text-muted-foreground bg-muted border-border",
    iconClassName: "text-muted-foreground animate-spin"
  },
  online: {
    icon: Wifi,
    className: "text-green-600 bg-green-50 border-green-200",
    iconClassName: "text-green-600"
  },
  offline: {
    icon: WifiOff,
    className: "text-destructive bg-destructive/10 border-destructive/20",
    iconClassName: "text-destructive"
  }
}

const sizeConfig = {
  sm: {
    container: "px-2 py-1 text-xs",
    icon: "w-3 h-3"
  },
  md: {
    container: "px-3 py-2 text-sm",
    icon: "w-4 h-4"
  },
  lg: {
    container: "px-4 py-3 text-base",
    icon: "w-5 h-5"
  }
}

export function StatusIndicator({ 
  status, 
  message, 
  className, 
  size = 'md',
  showIcon = true 
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const sizeConf = sizeConfig[size]
  const Icon = config.icon

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-md border font-medium transition-all",
      config.className,
      sizeConf.container,
      className
    )}>
      {showIcon && (
        <Icon className={cn(sizeConf.icon, config.iconClassName)} />
      )}
      {message && <span>{message}</span>}
    </div>
  )
}