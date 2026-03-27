import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'

const Login        = lazy(() => import('./pages/Login'))
const Ficha        = lazy(() => import('./pages/Ficha'))
const Rolagens     = lazy(() => import('./pages/Rolagens'))
const Habilidades  = lazy(() => import('./pages/Habilidades'))
const LivroJogador = lazy(() => import('./pages/LivroJogador'))
const Admin        = lazy(() => import('./pages/Admin'))

function Loading() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--bege-escuro)' }}>
      Carregando…
    </div>
  )
}

// Rota protegida: redireciona para /login se não autenticado
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Rota pública: redireciona para /ficha se já estiver logado
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (user) return <Navigate to="/ficha" replace />
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Página inicial → Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Autenticação — só exibe se NÃO estiver logado */}
        <Route path="/login" element={
          <PublicOnlyRoute><Login /></PublicOnlyRoute>
        } />

        {/* Páginas protegidas — exigem login */}
        <Route path="/ficha" element={
          <PrivateRoute><Ficha /></PrivateRoute>
        } />
        <Route path="/rolagens" element={
          <PrivateRoute><Rolagens /></PrivateRoute>
        } />
        <Route path="/admin" element={
          <PrivateRoute><Admin /></PrivateRoute>
        } />

        {/* Páginas públicas — material de referência */}
        <Route path="/habilidades"   element={<Habilidades />} />
        <Route path="/livro-jogador" element={<LivroJogador />} />

        {/* Qualquer rota desconhecida → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
