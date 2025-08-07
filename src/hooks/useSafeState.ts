import { useState, useEffect } from 'react'

/**
 * 컴포넌트 언마운트 상태를 추적하는 훅
 * 비동기 작업 중 컴포넌트가 언마운트되었을 때 상태 업데이트를 방지
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(true)

  useEffect(() => {
    return () => {
      setIsMounted(false)
    }
  }, [])

  return isMounted
}

/**
 * 안전한 setState - 컴포넌트가 마운트된 상태에서만 실행
 */
export function useSafeState<T>(initialState: T) {
  const [state, setState] = useState(initialState)
  const isMounted = useIsMounted()

  const setSafeState = (newState: T | ((prevState: T) => T)) => {
    if (isMounted) {
      setState(newState)
    }
  }

  return [state, setSafeState] as const
}