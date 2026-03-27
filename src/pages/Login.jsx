import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, getDb, isFirebaseConfigured } from '../firebase'
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

const ARQUETIPOS = [
  'O Ex-Soldado (O Desertor)',
  'O Garoto (O Sobrevivente)',
  'O Rastreador (O Batedor)',
  'O Falso Profeta (O Pregador Caído)',
  'Outro (Personalizado)',
]

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

/* ── Passo 2: criar personagem logo após o cadastro ──────── */
function CriarPersonagem({ user, onConcluir }) {
  const [nome,      setNome]      = useState('')
  const [arquetipo, setArquetipo] = useState(ARQUETIPOS[0])
  const [salvando,  setSalvando]  = useState(false)
  const [erro,      setErro]      = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nome.trim()) { setErro('Digite um nome para o personagem.'); return }
    setSalvando(true)
    try {
      // Salva a ficha inicial no Firestore já associada ao UID/email
      const db = await getDb()
      if (db) {
        await setDoc(doc(db, 'fichas', user.uid), {
          nome:      nome.trim(),
          arquetipo: arquetipo,
          email:     user.email,
          nivel:     '0',
          carne: '0', polvora: '0', deserto: '0', alma: '0', sombra: '0',
          ferimento1: false, ferimento2: false, ferimento3: false,
          aparencia: '', aparencia_hab: '', arma1: '', municao: '0',
          arma2: '', agua: 'Cheio', provisoes: '',
          updatedAt: serverTimestamp(),
          criadoEm:  serverTimestamp(),
        })
      }
      // Salva no localStorage também
      const dados = { nome: nome.trim(), arquetipo }
      localStorage.setItem('poesangue_ficha_v1', JSON.stringify(dados))
      onConcluir()
    } catch (e) {
      setErro('Erro ao salvar: ' + e.message)
      setSalvando(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card section">
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="text-4xl">🤠</div>
          <h2 className="mb-0">Crie seu personagem</h2>
          <p className="text-sm opacity-70">
            Conta criada! Agora dê um nome ao seu foragido.
          </p>
        </div>

        {erro && <Alert text={erro} isError />}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="nomePersonagem" className="text-sm font-medium">
              Nome / Alcunha do personagem
            </label>
            <input
              type="text"
              id="nomePersonagem"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Silas, 'O Manco'"
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="arquetipoSelect" className="text-sm font-medium">
              Arquétipo
            </label>
            <select
              id="arquetipoSelect"
              value={arquetipo}
              onChange={e => setArquetipo(e.target.value)}
            >
              {ARQUETIPOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="section" style={{padding:'14px 18px',marginTop:0}}>
            <p className="note text-xs leading-relaxed">
              <strong>Conta associada:</strong> {user.email}<br />
              Sua ficha ficará salva na nuvem e poderá ser acessada de qualquer dispositivo.
            </p>
          </div>

          <button type="submit" disabled={salvando} className="w-full mt-2">
            {salvando ? 'Criando personagem…' : 'Criar personagem e entrar →'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Página de Login principal ───────────────────────────── */
export default function Login() {
  const [tab,     setTab]     = useState('entrar')
  const [msg,     setMsg]     = useState({ text: '', isError: false })
  const [loading, setLoading] = useState(false)
  // Guarda o usuário recém-criado para exibir o passo 2
  const [novaConta, setNovaConta] = useState(null)
  const navigate = useNavigate()

  function showMsg(text, isError = true) { setMsg({ text, isError }) }
  function clearMsg() { setMsg({ text: '', isError: false }) }

  async function handleEntrar(e) {
    e.preventDefault()
    if (!isFirebaseConfigured) { showMsg('Firebase não configurado. Preencha .env.local.'); return }
    setLoading(true); clearMsg()
    try {
      await signInWithEmailAndPassword(auth, e.target.loginEmail.value.trim(), e.target.loginSenha.value)
      navigate('/ficha', { replace: true })
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
    if (senha.length < 6) { showMsg('Mínimo 6 caracteres na senha.'); return }
    setLoading(true); clearMsg()
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha)
      // Vai para o passo 2: criação do personagem
      setNovaConta(cred.user)
    } catch (err) {
      showMsg(ERROS[err.code] || 'Erro: ' + err.code)
    } finally { setLoading(false) }
  }

  async function handleReset(e) {
    e.preventDefault()
    const email = document.getElementById('loginEmail')?.value?.trim()
    if (!email) { showMsg('Digite o e-mail no campo acima.'); return }
    try {
      await sendPasswordResetEmail(auth, email)
      showMsg('E-mail de redefinição enviado!', false)
    } catch (err) { showMsg(ERROS[err.code] || err.code) }
  }

  // Passo 2 — criação do personagem logo após o cadastro
  if (novaConta) {
    return (
      <>
        <Nav />
        <header className="page-header">
          <h1>Pó e Sangue</h1>
          <p className="quote">Bem-vindo ao deserto.</p>
        </header>
        <CriarPersonagem
          user={novaConta}
          onConcluir={() => navigate('/ficha', { replace: true })}
        />
      </>
    )
  }

  return (
    <>
      <Nav />
      <header className="page-header">
        <h1>Pó e Sangue</h1>
        <p className="quote">
          Velho Oeste, 1850. Sobrevivência, terror e violência.
        </p>
      </header>

      <div className="auth-wrap">
        <div className="auth-card section">

          {/* Tabs */}
          <div className="auth-tabs">
            {[['entrar','Entrar'],['cadastrar','Cadastrar']].map(([id, label]) => (
              <button key={id}
                className={`auth-tab${tab === id ? ' auth-tab--active' : ''}`}
                onClick={() => { setTab(id); clearMsg() }}>
                {label}
              </button>
            ))}
          </div>

          {!isFirebaseConfigured && (
            <Alert text="Firebase não configurado. Crie .env.local com base em .env.example." isError />
          )}
          <Alert {...msg} />

          {/* ── Entrar ── */}
          {tab === 'entrar' && (
            <form onSubmit={handleEntrar} noValidate className="flex flex-col gap-3">
              <h2>Entrar na sua conta</h2>

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
                {loading ? 'Entrando…' : 'Entrar →'}
              </button>

              <p className="note text-center text-xs mt-1">
                Esqueceu a senha?{' '}
                <a href="#redefinir" onClick={handleReset}
                  className="underline opacity-80 hover:opacity-100">
                  Redefinir por e-mail
                </a>
              </p>
            </form>
          )}

          {/* ── Cadastrar ── */}
          {tab === 'cadastrar' && (
            <form onSubmit={handleCadastrar} noValidate className="flex flex-col gap-3">
              <h2>Criar conta de jogador</h2>
              <p className="note text-xs">
                Após criar a conta, você nomeará seu personagem e sua ficha ficará
                salva na nuvem associada a este e-mail.
              </p>

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
                {loading ? 'Criando conta…' : 'Criar conta →'}
              </button>
            </form>
          )}
        </div>

        {/* Links de referência para quem ainda não tem conta */}
        <div className="flex gap-4 justify-center mt-4 text-xs opacity-60 flex-wrap">
          <Link to="/habilidades">Habilidades de arquétipo</Link>
          <Link to="/livro-jogador">Livro do jogador</Link>
        </div>
      </div>
    </>
  )
}
