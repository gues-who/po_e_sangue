import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function Nav() {
  const { user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  async function handleLogout(e) {
    e.preventDefault()
    if (isFirebaseConfigured) await signOut(auth)
    navigate('/login', { replace: true })
  }

  function cls({ isActive }) {
    return isActive ? 'nav-current' : undefined
  }

  // Nav para usuário autenticado
  if (!loading && user) {
    return (
      <nav className="site-nav" aria-label="Navegação principal">
        <NavLink to="/ficha"         className={cls}>Ficha</NavLink>
        <NavLink to="/rolagens"      className={cls}>Rolagens</NavLink>
        <NavLink to="/habilidades"   className={cls}>Habilidades</NavLink>
        <NavLink to="/livro-jogador" className={cls}>Livro do jogador</NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) =>
            'nav-auth-link' + (isActive ? ' nav-current' : '')}>
            Mestre
          </NavLink>
        )}
        <a href="#sair" className="nav-auth-link" onClick={handleLogout}
           title={user.email}>
          Sair
        </a>
      </nav>
    )
  }

  // Nav para usuário não autenticado (login/páginas públicas)
  return (
    <nav className="site-nav" aria-label="Navegação principal">
      <NavLink to="/habilidades"   className={cls}>Habilidades</NavLink>
      <NavLink to="/livro-jogador" className={cls}>Livro do jogador</NavLink>
      <NavLink to="/login" className={({ isActive }) =>
        'nav-auth-link' + (isActive ? ' nav-current' : '')}>
        Entrar
      </NavLink>
    </nav>
  )
}
