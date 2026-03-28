import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { getDb, isFirebaseConfigured, ADMIN_EMAIL } from '../firebase'
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

/* ── Barra de atributo ──────────────────────────────────── */
function AttrBar({ label, valor, color }) {
  const v   = parseInt(valor ?? 0, 10)
  const max = 3
  // Converte -2..+3 para 0..100% na barra
  const pct = Math.max(0, Math.min(100, ((v + 2) / (max + 2)) * 100))
  const sinal = v > 0 ? '+' + v : String(v)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="admin-label text-xs">{label}</span>
        <span className="font-bold text-sm" style={{ color }}>{sinal}</span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-2 rounded-full transition-all"
          style={{ width: pct + '%', background: color, opacity: 0.85 }} />
      </div>
    </div>
  )
}

/* ── Indicador de sombra ────────────────────────────────── */
function SombraMeter({ valor }) {
  const v = parseInt(valor ?? 0, 10)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="admin-label text-xs">Sombra</span>
        <span className="font-bold text-sm" style={{ color: '#8b1a1a' }}>{v}/6</span>
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex-1 h-2 rounded-sm"
            style={{ background: i <= v ? '#8b1a1a' : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
    </div>
  )
}

/* ── Card de ficha ──────────────────────────────────────── */
function FichaCard({ uid, data }) {
  const [aberto, setAberto] = useState(false)

  const ferimentos = [
    data.ferimento1 && '🩸 Sangrando',
    data.ferimento2 && '⚠ Debilitado',
    data.ferimento3 && '💀 Morte',
  ].filter(Boolean)

  return (
    <div className="admin-ficha-card">
      {/* ── Cabeçalho sempre visível ── */}
      <div className="admin-ficha-header" style={{ cursor: 'default' }}>
        <div className="admin-ficha-header-info" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {data.fotoBase64 ? (
            <img
              src={data.fotoBase64}
              alt={data.nome || 'Retrato'}
              style={{
                width: 52, height: 52, borderRadius: '50%',
                objectFit: 'cover', flexShrink: 0,
                border: '2px solid var(--marrom)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(92,61,46,0.3)',
              border: '2px solid var(--marrom)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', opacity: 0.5,
            }}>🤠</div>
          )}
          <div>
            <span className="admin-ficha-nome">{data.nome || '(sem nome)'}</span>
            <span className="admin-ficha-email note" style={{ display: 'block' }}>{data.email || uid}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="note text-xs opacity-60">{data.arquetipo || '—'}</span>
          <button
            type="button"
            className="admin-ficha-toggle secondary"
            style={{ minWidth: 'auto', padding: '6px 12px', fontSize: '0.75rem' }}
            onClick={() => setAberto(v => !v)}
          >
            {aberto ? '▲ Fechar' : '▼ Detalhes'}
          </button>
        </div>
      </div>

      {/* ── Atributos — sempre visíveis ── */}
      <div className="admin-ficha-detalhe" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-3">
          <AttrBar label="Carne"   valor={data.carne}   color="#c0392b" />
          <AttrBar label="Pólvora" valor={data.polvora} color="#e67e22" />
          <AttrBar label="Deserto" valor={data.deserto} color="#c4a265" />
          <AttrBar label="Alma"    valor={data.alma}    color="#8e44ad" />
        </div>
        <SombraMeter valor={data.sombra} />

        {ferimentos.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3">
            {ferimentos.map(f => (
              <span key={f} className="text-xs px-2 py-1 rounded"
                style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid #8b1a1a' }}>
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Detalhes expandíveis ── */}
      {aberto && (
        <div className="admin-ficha-detalhe" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm mb-4">
            {[
              ['Nível / Recompensa', data.nivel],
              ['Arma principal', data.arma1],
              ['Munição', data.municao],
              ['Arma secundária', data.arma2],
              ['Água / Cantil', data.agua],
            ].map(([label, val]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="admin-label">{label}</span>
                <span className="text-sm">{val || '—'}</span>
              </div>
            ))}
          </div>

          {data.aparencia && (
            <div className="mb-3">
              <span className="admin-label">Aparência e cicatrizes</span>
              <p className="note mt-1 text-xs leading-relaxed">{data.aparencia}</p>
            </div>
          )}
          {data.aparencia_hab && (
            <div className="mb-3">
              <span className="admin-label">Habilidade do arquétipo</span>
              <p className="note mt-1 text-xs leading-relaxed">{data.aparencia_hab}</p>
            </div>
          )}
          {data.provisoes && (
            <div className="mb-3">
              <span className="admin-label">Provisões e pertences</span>
              <p className="note mt-1 text-xs leading-relaxed">{data.provisoes}</p>
            </div>
          )}
          <p className="note text-xs mt-2 pt-3 border-t border-ps-marrom/40 opacity-50">
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
      const db   = await getDb()
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
      const db   = await getDb()
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
