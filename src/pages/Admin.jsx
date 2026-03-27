import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db, isFirebaseConfigured, ADMIN_EMAIL } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

const TIER_CLASS = {
  sucesso_total: 'hist-tier--sucesso',
  preco_sangue:  'hist-tier--preco',
  falha:         'hist-tier--falha',
}
const ATTR_LABEL = { carne:'Carne', polvora:'Pólvora', alma:'Alma', deserto:'Deserto' }

function formatarData(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('pt-BR')
}

function tempoRelativo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const ms = Date.now() - d.getTime()
  if (ms < 60000)    return 'agora'
  if (ms < 3600000)  return Math.floor(ms / 60000) + ' min atrás'
  if (ms < 86400000) return Math.floor(ms / 3600000) + 'h atrás'
  return Math.floor(ms / 86400000) + 'd atrás'
}

function dadosTexto(data) {
  if (data.modo !== '2d6' && data.dadosBrutos)
    return `[${data.dadosBrutos.join('+')} desc.${data.dadosDescartado}→${data.somaDados}]`
  if (data.dadosUsados?.length >= 2)
    return `[${data.dadosUsados[0]}+${data.dadosUsados[1]}=${data.somaDados}]`
  return ''
}

/* ── Badge de tier ─────────────────────────────────────── */
function TierBadge({ tierId, label }) {
  const colors = {
    sucesso_total: 'bg-green-900/40 text-green-300 border-green-700',
    preco_sangue:  'bg-yellow-900/40 text-yellow-300 border-yellow-700',
    falha:         'bg-red-900/40 text-red-300 border-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium
      ${colors[tierId] || 'bg-gray-800 text-gray-300 border-gray-600'}`}>
      {label}
    </span>
  )
}

/* ── Card de ficha ──────────────────────────────────────── */
function FichaCard({ uid, data }) {
  const [aberto, setAberto] = useState(false)

  const campos = [
    ['Arquétipo', data.arquetipo], ['Nível', data.nivel],
    ['Carne', data.carne],        ['Pólvora', data.polvora],
    ['Deserto', data.deserto],    ['Alma', data.alma],
    ['Sombra', `${data.sombra ?? '—'}/6`],
    ['Ferimentos', [data.ferimento1&&'1º',data.ferimento2&&'2º',data.ferimento3&&'3º']
      .filter(Boolean).join(', ') || 'Nenhum'],
    ['Arma', data.arma1],         ['Munição', data.municao],
    ['Arma 2', data.arma2],       ['Água', data.agua],
  ]

  return (
    <div className="admin-ficha-card">
      <button
        type="button"
        className="admin-ficha-header w-full text-left"
        onClick={() => setAberto(v => !v)}
      >
        <div className="admin-ficha-header-info">
          <span className="admin-ficha-nome">{data.nome || '(sem nome)'}</span>
          <span className="admin-ficha-email note">{data.email || uid}</span>
        </div>
        <div className="admin-ficha-header-meta">
          <span className="note text-xs">Sombra: {data.sombra ?? '—'}/6</span>
          <span className="admin-ficha-toggle">{aberto ? '▲' : '▼'}</span>
        </div>
      </button>

      {aberto && (
        <div className="admin-ficha-detalhe">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            {campos.map(([label, val]) => (
              <div key={label} className="flex flex-col">
                <span className="admin-label">{label}</span>
                <span>{val ?? '—'}</span>
              </div>
            ))}
          </div>
          {data.aparencia && (
            <div className="mt-3">
              <span className="admin-label">Aparência</span>
              <p className="note mt-1 text-xs leading-relaxed">{data.aparencia}</p>
            </div>
          )}
          {data.aparencia_hab && (
            <div className="mt-3">
              <span className="admin-label">Habilidade</span>
              <p className="note mt-1 text-xs leading-relaxed">{data.aparencia_hab}</p>
            </div>
          )}
          <p className="note text-xs mt-4 pt-3 border-t border-ps-marrom/40">
            Última atualização: {formatarData(data.updatedAt)}
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Linha de rolagem ───────────────────────────────────── */
function RolagemRow({ data }) {
  const modSinal = (data.modTotal || 0) >= 0 ? '+' + data.modTotal : String(data.modTotal)
  return (
    <div className="hist-row flex-wrap gap-y-1">
      <span className="hist-hora shrink-0" title={formatarData(data.timestamp)}>
        {tempoRelativo(data.timestamp)}
      </span>
      <span className="hist-nome">{data.personagem || '—'}</span>
      <span className="hist-email note text-xs">{data.email}</span>
      <span className={`hist-attr hist-attr--${data.atributo || ''}`}>
        {ATTR_LABEL[data.atributo] || data.atributo}
      </span>
      <span className="hist-dados">{dadosTexto(data)} {modSinal}</span>
      <span className="hist-total font-bold">= {data.total}</span>
      <TierBadge tierId={data.tierId} label={data.tierLabel} />
      {data.intervencaoAplicada && (
        <span className="hist-intervencao note text-xs italic">
          {data.intervencaoAplicada.replace(/_/g, ' ')}
        </span>
      )}
    </div>
  )
}

/* ── Admin principal ────────────────────────────────────── */
export default function Admin() {
  const { user, loading } = useAuth()
  const isAdmin = !!(user && ADMIN_EMAIL && user.email === ADMIN_EMAIL)

  const [aba, setAba]                   = useState('fichas')
  const [fichas, setFichas]             = useState([])
  const [fichasStatus, setFichasStatus] = useState('')
  const [rolagens, setRolagens]         = useState([])
  const [rolagensStatus, setRolagensStatus] = useState('')
  const [filtroJogador, setFiltroJogador]   = useState('')

  const carregarFichas = useCallback(async () => {
    if (!isFirebaseConfigured) return
    setFichasStatus('Carregando fichas…')
    try {
      const snap = await getDocs(collection(db, 'fichas'))
      const arr  = snap.docs.map(d => ({ uid: d.id, data: d.data() }))
      setFichas(arr)
      setFichasStatus(arr.length + ' ficha(s) carregada(s).')
    } catch (e) { setFichasStatus('Erro: ' + e.message) }
  }, [])

  const carregarRolagens = useCallback(async () => {
    if (!isFirebaseConfigured) return
    setRolagensStatus('Carregando rolagens…')
    try {
      const q    = query(collection(db, 'rolagens'), orderBy('timestamp', 'desc'), limit(200))
      const snap = await getDocs(q)
      setRolagens(snap.docs.map(d => d.data()))
      setRolagensStatus(snap.size + ' rolagem(ns) carregada(s).')
    } catch (e) { setRolagensStatus('Erro: ' + e.message) }
  }, [])

  useEffect(() => { if (isAdmin) carregarFichas() }, [isAdmin, carregarFichas])
  useEffect(() => {
    if (isAdmin && aba === 'rolagens' && rolagens.length === 0) carregarRolagens()
  }, [aba, isAdmin])

  if (loading) return <><Nav /><p className="text-center p-10 opacity-60">Verificando acesso…</p></>

  if (!user || !isAdmin) return (
    <>
      <Nav />
      <div className="section flex flex-col items-center gap-4 py-16 text-center">
        <div className="text-5xl">🔒</div>
        <p className="text-ps-vermelho text-lg font-medium">Acesso negado.</p>
        <p className="opacity-70 text-sm">Este painel é restrito ao Mestre da campanha.</p>
        <Link to="/login" className="link-button mt-2">Entrar com outra conta</Link>
      </div>
    </>
  )

  const emailsUnicos       = [...new Set(rolagens.map(r => r.email).filter(Boolean))].sort()
  const rolagensFiltradas  = filtroJogador ? rolagens.filter(r => r.email === filtroJogador) : rolagens

  return (
    <>
      <Nav />
      <header className="page-header">
        <h1>Painel do Mestre</h1>
        <p className="quote">Fichas e rolagens de todos os jogadores.</p>
      </header>

      {/* Info do mestre */}
      <div className="section flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm opacity-70">
          Mestre: <strong className="opacity-100">{user.email}</strong>
        </p>
        <span className="text-xs note">
          {fichas.length} jogador(es) · {rolagens.length} rolagem(ns)
        </span>
      </div>

      {/* Abas */}
      <div className="admin-tabs">
        {[['fichas','Fichas'],['rolagens','Histórico de Rolagens']].map(([id, label]) => (
          <button key={id}
            className={`admin-tab${aba === id ? ' admin-tab--active' : ''}`}
            onClick={() => setAba(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Fichas ── */}
      {aba === 'fichas' && (
        <div className="section">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="m-0 border-none p-0">Fichas dos Jogadores</h2>
            <button onClick={carregarFichas} className="secondary"
              style={{minWidth:'auto',padding:'10px 18px'}}>
              ↺ Atualizar
            </button>
          </div>
          <p className="note text-xs mb-3">{fichasStatus}</p>
          {fichas.length === 0
            ? <p className="note text-sm opacity-60">Nenhuma ficha cadastrada ainda.</p>
            : fichas.map(({ uid, data }) => <FichaCard key={uid} uid={uid} data={data} />)
          }
        </div>
      )}

      {/* ── Rolagens ── */}
      {aba === 'rolagens' && (
        <div className="section">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="m-0 border-none p-0">Histórico de Rolagens</h2>
            <div className="flex gap-2 flex-wrap items-center">
              <select value={filtroJogador} onChange={e => setFiltroJogador(e.target.value)}
                className="text-sm" style={{padding:'8px 12px',minWidth:160}}>
                <option value="">Todos os jogadores</option>
                {emailsUnicos.map(email => <option key={email} value={email}>{email}</option>)}
              </select>
              <button onClick={carregarRolagens} className="secondary"
                style={{minWidth:'auto',padding:'10px 18px'}}>
                ↺ Atualizar
              </button>
            </div>
          </div>
          <p className="note text-xs mb-3">
            {rolagensStatus}
            {filtroJogador && ` · ${rolagensFiltradas.length} de ${filtroJogador}`}
          </p>
          <div className="hist-lista">
            {rolagensFiltradas.length === 0
              ? <p className="note text-sm opacity-60">Nenhuma rolagem encontrada.</p>
              : rolagensFiltradas.map((r, i) => <RolagemRow key={i} data={r} />)
            }
          </div>
        </div>
      )}
    </>
  )
}
