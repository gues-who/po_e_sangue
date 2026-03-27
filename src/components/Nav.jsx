import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function Nav() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout(e) {
    e.preventDefault()
    if (isFirebaseConfigured) await signOut(auth)
    navigate('/login')
  }

  function cls({ isActive }) {
    return isActive ? 'nav-current' : undefined
  }

  return (
    <nav className="site-nav" aria-label="Navegação principal">
      <NavLink to="/"              className={cls} end>Início</NavLink>
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
      {user ? (
        <a href="#sair" className="nav-auth-link" onClick={handleLogout}>Sair</a>
      ) : (
        <NavLink to="/login" className={({ isActive }) =>
          'nav-auth-link' + (isActive ? ' nav-current' : '')}>
          Entrar
        </NavLink>
      )}
    </nav>
  )
}
