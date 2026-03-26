import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, ADMIN_EMAIL, isFirebaseConfigured } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = carregando, null = não logado, object = logado
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    if (!isFirebaseConfigured) { setUser(null); return }
    const unsub = onAuthStateChanged(auth, setUser)
    return unsub
  }, [])

  const isAdmin = !!(user && ADMIN_EMAIL && user.email === ADMIN_EMAIL)

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
