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
  'auth/weak-password':        'Senha muito fraca (mínimo 6 caracteres).',
  'auth/too-many-requests':    'Muitas tentativas. Tente mais tarde.',
  'auth/invalid-credential':   'E-mail ou senha incorretos.',
}

function Alert({ text, isError }) {
  if (!text) return null
  return (
    <div className={`flex items-start gap-2 rounded-md px-4 py-3 text-sm mb-4
      ${isError
        ? 'bg-red-900/40 border border-red-700 text-red-200'
        : 'bg-green-900/40 border border-green-700 text-green-200'}`}>
      <span>{isError ? '⚠' : '✔'}</span>
      <span>{text}</span>
    </div>
  )
}

export default function Login() {
  const [tab, setTab]         = useState('entrar')
  const [msg, setMsg]         = useState({ text: '', isError: false })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  function showMsg(text, isError = true) { setMsg({ text, isError }) }
  function clearMsg() { setMsg({ text: '', isError: false }) }

  async function handleEntrar(e) {
    e.preventDefault()
    if (!isFirebaseConfigured) { showMsg('Firebase não configurado. Preencha .env.local.'); return }
    setLoading(true); clearMsg()
    try {
      await signInWithEmailAndPassword(auth, e.target.loginEmail.value.trim(), e.target.loginSenha.value)
      showMsg('Login realizado! Redirecionando…', false)
      setTimeout(() => navigate('/ficha'), 700)
    } catch (err) {
      showMsg(ERROS[err.code] || 'Erro: ' + err.code)
    } finally { setLoading(false) }
  }

  async function handleCadastrar(e) {
    e.preventDefault()
    if (!isFirebaseConfigured) { showMsg('Firebase não configurado.'); return }
    const senha  = e.target.cadSenha.value
    const senha2 = e.target.cadSenha2.value
    if (senha !== senha2) { showMsg('As senhas não coincidem.'); return }
    setLoading(true); clearMsg()
    try {
      await createUserWithEmailAndPassword(auth, e.target.cadEmail.value.trim(), senha)
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

  return (
    <>
      <Nav />
      <header className="page-header">
        <h1>Pó e Sangue</h1>
        <p className="quote">Acesse ou cadastre sua conta para salvar sua ficha.</p>
      </header>

      <div className="auth-wrap">
        {/* ── Logado ── */}
        {user ? (
          <div className="auth-card section">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-ps-vermelho/20 border border-ps-vermelho
                              flex items-center justify-center text-2xl">
                ☽
              </div>
              <h2 className="mb-0">Você já está logado</h2>
              <p className="opacity-75 text-sm">Logado como: <strong>{user.email}</strong></p>
            </div>
            <div className="btn-bar mt-5">
              <Link to="/ficha" className="link-button">Ir para a Ficha</Link>
              <button className="secondary" onClick={() => signOut(auth)}>Sair da conta</button>
            </div>
            {user.email === ADMIN_EMAIL && (
              <p className="mt-4 text-center">
                <Link to="/admin" className="text-ps-vermelho font-rye tracking-wide hover:underline">
                  ☽ Painel do Mestre
                </Link>
              </p>
            )}
          </div>
        ) : (
          /* ── Não logado ── */
          <div className="auth-card section">
            {/* Tabs */}
            <div className="auth-tabs">
              {['entrar','cadastrar'].map(t => (
                <button key={t}
                  className={`auth-tab${tab === t ? ' auth-tab--active' : ''}`}
                  onClick={() => { setTab(t); clearMsg() }}>
                  {t === 'entrar' ? 'Entrar' : 'Cadastrar'}
                </button>
              ))}
            </div>

            {!isFirebaseConfigured && (
              <Alert text="Firebase não configurado. Crie .env.local com base em .env.example." isError />
            )}
            <Alert {...msg} />

            {tab === 'entrar' ? (
              <form onSubmit={handleEntrar} noValidate className="flex flex-col gap-3">
                <h2>Entrar na conta</h2>
                <div className="flex flex-col gap-1">
                  <label htmlFor="loginEmail" className="text-sm">E-mail</label>
                  <input type="email" id="loginEmail" name="loginEmail"
                    placeholder="seu@email.com" required autoComplete="email" />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="loginSenha" className="text-sm">Senha</label>
                  <input type="password" id="loginSenha" name="loginSenha"
                    placeholder="••••••" required autoComplete="current-password" />
                </div>
                <button type="submit" disabled={loading} className="mt-2 w-full">
                  {loading ? 'Aguarde…' : 'Entrar'}
                </button>
                <p className="note text-center text-xs mt-1">
                  Esqueceu a senha?{' '}
                  <a href="#redefinir" onClick={handleReset}
                    className="underline opacity-80 hover:opacity-100">
                    Redefinir por e-mail
                  </a>
                </p>
              </form>
            ) : (
              <form onSubmit={handleCadastrar} noValidate className="flex flex-col gap-3">
                <h2>Criar conta</h2>
                <div className="flex flex-col gap-1">
                  <label htmlFor="cadEmail" className="text-sm">E-mail</label>
                  <input type="email" id="cadEmail" name="cadEmail"
                    placeholder="seu@email.com" required autoComplete="email" />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="cadSenha" className="text-sm">
                    Senha <span className="note">(mínimo 6 caracteres)</span>
                  </label>
                  <input type="password" id="cadSenha" name="cadSenha"
                    placeholder="••••••" required autoComplete="new-password" />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="cadSenha2" className="text-sm">Confirmar senha</label>
                  <input type="password" id="cadSenha2" name="cadSenha2"
                    placeholder="••••••" required autoComplete="new-password" />
                </div>
                <button type="submit" disabled={loading} className="mt-2 w-full">
                  {loading ? 'Aguarde…' : 'Criar conta'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  )
}
