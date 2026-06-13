import { useStore } from '@/stores/appStore'
import { useEffect } from 'react'

export function useAuth() {
  const { user, setUser } = useStore()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
  }, [setUser])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/'
  }

  return { user, isAuthenticated: !!user, logout }
}
