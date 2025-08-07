import { useState, useEffect } from 'react'
import { toast } from 'sonner'

/**
 * 네트워크 상태 감지 훅
 * 온라인/오프라인 상태를 추적하고 연결 상태 변화에 따른 알림 제공
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      if (online && wasOffline) {
        toast.success('인터넷 연결이 복구되었습니다')
        setWasOffline(false)
      } else if (!online) {
        toast.error('인터넷 연결이 끊어졌습니다')
        setWasOffline(true)
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [wasOffline])

  return { isOnline, isOffline: !isOnline }
}