import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, ADMIN_EMAIL, isFirebaseConfigured } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = carregando, null = não logado, object = logado
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    // Firebase não configurado: resolve imediatamente como não logado
    if (!isFirebaseConfigured) {
      setUser(null)
      return
    }

    // Timeout de segurança: se Firebase não responder em 6s, assume não logado
    const timeout = setTimeout(() => {
      setUser(prev => prev === undefined ? null : prev)
    }, 6000)

    const unsub = onAuthStateChanged(auth, u => {
      clearTimeout(timeout)
      setUser(u)
    }, _err => {
      clearTimeout(timeout)
      setUser(null)
    })

    return () => { unsub(); clearTimeout(timeout) }
  }, [])

  const isAdmin = !!(user && ADMIN_EMAIL && user.email === ADMIN_EMAIL)

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
