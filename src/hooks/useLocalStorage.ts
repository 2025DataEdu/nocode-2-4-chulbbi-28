import { useState, useEffect } from 'react'

/**
 * localStorage를 React state처럼 사용할 수 있는 커스텀 훅
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 초기값 설정
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // 값 설정 함수
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 함수가 전달된 경우 실행
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      // localStorage에 저장
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  // localStorage 변경 감지 (다른 탭에서의 변경)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue] as const
}