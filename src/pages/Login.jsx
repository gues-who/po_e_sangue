import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut,
} from 'firebase/auth'
import { auth, isFirebaseConfigured, ADMIN_EMAIL } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'

const ERROS = {
  'auth/user-not-found':       'E-mail não cadastrado.',
  'auth/wrong-password':       'Senha incorreta.',
  'auth/invalid-email':        'E-mail inválido.',
  'auth/email-already-in-use': 'Este e-mail já está em uso.',
  'auth/weak-password':        'Senha muito fraca.',
  'auth/too-many-requests':    'Muitas tentativas. Tente mais tarde.',
  'auth/invalid-credential':   'E-mail ou senha incorretos.',
}

function Msg({ text, isError }) {
  if (!text) return null
  return (
    <p className={`auth-msg ${isError ? 'auth-msg--erro' : 'auth-msg--ok'}`}>{text}</p>
  )
}

export default function Login() {
  const [tab, setTab]       = useState('entrar')
  const [msg, setMsg]       = useState({ text: '', isError: false })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  function showMsg(text, isError = true) { setMsg({ text, isError }) }
  function clearMsg() { setMsg({ text: '', isError: false }) }

  async function handleEntrar(e) {
    e.preventDefault()
    if (!isFirebaseConfigured) { showMsg('Firebase não configurado. Preencha .env.local.'); return }
    const email = e.target.loginEmail.value.trim()
    const senha = e.target.loginSenha.value
    setLoading(true); clearMsg()
    try {
      await signInWithEmailAndPassword(auth, email, senha)
      showMsg('Login realizado! Redirecionando…', false)
      setTimeout(() => navigate('/ficha'), 700)
    } catch (err) {
      showMsg(ERROS[err.code] || 'Erro: ' + err.code)
    } finally { setLoading(false) }
  }

  async function handleCadastrar(e) {
    e.preventDefault()
    if (!isFirebaseConfigured) { showMsg('Firebase não configurado.'); return }
    const email  = e.target.cadEmail.value.trim()
    const senha  = e.target.cadSenha.value
    const senha2 = e.target.cadSenha2.value
    if (senha !== senha2) { showMsg('As senhas não coincidem.'); return }
    if (senha.length < 6) { showMsg('Mínimo 6 caracteres.'); return }
    setLoading(true); clearMsg()
    try {
      await createUserWithEmailAndPassword(auth, email, senha)
      showMsg('Conta criada! Redirecionando…', false)
      setTimeout(() => navigate('/ficha'), 700)
    } catch (err) {
      showMsg(ERROS[err.code] || 'Erro: ' + err.code)
    } finally { setLoading(false) }
  }

  async function handleReset(e) {
    e.preventDefault()
    const email = document.getElementById('loginEmail')?.value?.trim()
    if (!email) { showMsg('Digite o e-mail no campo acima.'); return }
    try { await sendPasswordResetEmail(auth, email); showMsg('E-mail de redefinição enviado!', false) }
    catch (err) { showMsg(ERROS[err.code] || err.code) }
  }

  async function handleLogout() {
    await signOut(auth)
  }

  return (
    <>
      <Nav />
      <header className="page-header">
        <h1>Pó e Sangue</h1>
        <p className="quote">Acesse ou cadastre sua conta para salvar sua ficha.</p>
      </header>

      <div className="auth-wrap">
        {user ? (
          <div className="auth-card section">
            <h2>Você já está logado</h2>
            <p>Logado como: <strong>{user.email}</strong></p>
            <div className="btn-bar" style={{ marginTop: 18 }}>
              <Link to="/ficha" className="link-button">Ir para a Ficha</Link>
              <button className="secondary" onClick={handleLogout}>Sair da conta</button>
            </div>
            {user.email === ADMIN_EMAIL && (
              <p style={{ marginTop: 14, textAlign: 'center' }}>
                <Link to="/admin" style={{ color: 'var(--vermelho)', fontFamily: "'Rye',serif", letterSpacing: '.05em' }}>
                  ☽ Painel do Mestre
                </Link>
              </p>
            )}
          </div>
        ) : (
          <div className="auth-card section">
            <div className="auth-tabs">
              <button className={`auth-tab${tab === 'entrar' ? ' auth-tab--active' : ''}`}
                onClick={() => { setTab('entrar'); clearMsg() }}>Entrar</button>
              <button className={`auth-tab${tab === 'cadastrar' ? ' auth-tab--active' : ''}`}
                onClick={() => { setTab('cadastrar'); clearMsg() }}>Cadastrar</button>
            </div>

            <Msg {...msg} />

            {!isFirebaseConfigured && (
              <p className="auth-msg auth-msg--erro">
                ⚠ Firebase não configurado. Crie o arquivo <code>.env.local</code> com base em <code>.env.example</code>.
              </p>
            )}

            {tab === 'entrar' ? (
              <form onSubmit={handleEntrar} noValidate>
                <h2>Entrar na conta</h2>
                <label htmlFor="loginEmail">E-mail:</label>
                <input type="email" id="loginEmail" name="loginEmail" placeholder="seu@email.com" required autoComplete="email" />
                <label htmlFor="loginSenha">Senha:</label>
                <input type="password" id="loginSenha" name="loginSenha" placeholder="••••••" required autoComplete="current-password" />
                <div className="btn-bar" style={{ marginTop: 18 }}>
                  <button type="submit" disabled={loading}>{loading ? 'Aguarde…' : 'Entrar'}</button>
                </div>
                <p className="note" style={{ marginTop: 12, textAlign: 'center' }}>
                  Esqueceu a senha?{' '}
                  <a href="#redefinir" onClick={handleReset} style={{ color: 'var(--bege-escuro)' }}>Redefinir por e-mail</a>
                </p>
              </form>
            ) : (
              <form onSubmit={handleCadastrar} noValidate>
                <h2>Criar conta</h2>
                <label htmlFor="cadEmail">E-mail:</label>
                <input type="email" id="cadEmail" name="cadEmail" placeholder="seu@email.com" required autoComplete="email" />
                <label htmlFor="cadSenha">Senha <span className="note">(mínimo 6 caracteres)</span>:</label>
                <input type="password" id="cadSenha" name="cadSenha" placeholder="••••••" required autoComplete="new-password" />
                <label htmlFor="cadSenha2">Confirmar senha:</label>
                <input type="password" id="cadSenha2" name="cadSenha2" placeholder="••••••" required autoComplete="new-password" />
                <div className="btn-bar" style={{ marginTop: 18 }}>
                  <button type="submit" disabled={loading}>{loading ? 'Aguarde…' : 'Criar conta'}</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  )
}
