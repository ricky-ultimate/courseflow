'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, AuthResponse, LoginData, RegisterData, Role } from '@/types'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  isLecturer: boolean
  isHod: boolean
  isStudent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  const logout = useCallback(() => {
    setUser(null)
    apiClient.setToken(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
    }
  }, [])

  useEffect(() => {
    const handle401 = () => {
      setUser(null)
      apiClient.setToken(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
      }
      toast({
        title: "Your session has expired. Please sign in again.",
        variant: "warning",
      })
      router.push('/login')
    }
    apiClient.setOn401(handle401)
    return () => apiClient.setOn401(null)
  }, [toast, router])

  useEffect(() => {
    const validateToken = async () => {
      const token = apiClient.getToken()
      if (token) {
        try {
          const response = await apiClient.getCurrentUser()
          let userData: User | null = null
          if (response.success && response.data != null) {
            const raw = response.data as { user?: User } | User
            userData = (raw as { user?: User }).user ?? (raw as User)
            if (userData && !("id" in userData)) userData = null
          }
          if (userData) {
            setUser(userData)
            localStorage.setItem("user", JSON.stringify(userData))
          } else {
            logout()
          }
        } catch (error) {
          console.error("Token validation failed:", error)
          logout()
        }
      }
      setLoading(false)
    }

    validateToken()
  }, [logout])

  const login = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      const response = await apiClient.login(data.email, data.password)

      if (response.success && response.data) {
        const authData = response.data as AuthResponse
        setUser(authData.user as User)
        apiClient.setToken(authData.access_token)

        localStorage.setItem('user', JSON.stringify(authData.user as User))

        return { success: true }
      } else {
        return { success: false, error: response.error || "Invalid credentials" }
      }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      const response = await apiClient.register(data)

      if (response.success && response.data) {
        const authData = response.data as AuthResponse
        setUser(authData.user as User)
        apiClient.setToken(authData.access_token)

        localStorage.setItem('user', JSON.stringify(authData.user as User))

        return { success: true }
      } else {
        return { success: false, error: response.error || "Registration failed" }
      }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setLoading(false)
    }
  }


  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === Role.ADMIN,
    isLecturer: user?.role === Role.LECTURER,
    isHod: user?.role === Role.HOD,
    isStudent: user?.role === Role.STUDENT,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
