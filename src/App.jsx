import { HashRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './contexts/AuthContext'

const Home         = lazy(() => import('./pages/Home'))
const Ficha        = lazy(() => import('./pages/Ficha'))
const Rolagens     = lazy(() => import('./pages/Rolagens'))
const Habilidades  = lazy(() => import('./pages/Habilidades'))
const LivroJogador = lazy(() => import('./pages/LivroJogador'))
const Login        = lazy(() => import('./pages/Login'))
const Admin        = lazy(() => import('./pages/Admin'))

function Loading() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--bege-escuro)' }}>
      Carregando…
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/ficha"         element={<Ficha />} />
            <Route path="/rolagens"      element={<Rolagens />} />
            <Route path="/habilidades"   element={<Habilidades />} />
            <Route path="/livro-jogador" element={<LivroJogador />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/admin"         element={<Admin />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  )
}
