import { createContext, useContext, useEffect, useState } from 'react'
import * as auth from '../api/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        if (auth.getToken()) {
          const u = await auth.me()
          setUser(u)
        }
      } catch {
        auth.clearToken()
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function handleLogin({ email, password }) {
    await auth.login({ email, password })  
    try {
      const u = await auth.me()           
      setUser(u)                            
    } catch {}
  }

  async function handleRegister({ name, email, password, password_confirmation }) {
    await auth.register({ name, email, password, password_confirmation }) 
    try {
      const u = await auth.me()
      setUser(u)
    } catch {}
  }

  function handleLogout() {
    auth.logout()
    setUser(null)
  }

  const value = { user, loading, login: handleLogin, register: handleRegister, logout: handleLogout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)