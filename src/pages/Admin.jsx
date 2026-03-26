import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db, isFirebaseConfigured, ADMIN_EMAIL } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

const TIER_CLASS = { sucesso_total:'hist-tier--sucesso', preco_sangue:'hist-tier--preco', falha:'hist-tier--falha' }
const ATTR_LABEL = { carne:'Carne', polvora:'Pólvora', alma:'Alma', deserto:'Deserto' }

function esc(s) { return String(s || '') }

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

/* ── Card de ficha ────────────────────────────────────────── */
function FichaCard({ uid, data }) {
  const [aberto, setAberto] = useState(false)
  const sombra = data.sombra ?? '—'
  const nome = data.nome || '(sem nome)'

  return (
    <div className="admin-ficha-card">
      <div className="admin-ficha-header" onClick={() => setAberto(v => !v)}>
        <div className="admin-ficha-header-info">
          <span className="admin-ficha-nome">{nome}</span>
          <span className="admin-ficha-email note">{data.email || uid}</span>
        </div>
        <div className="admin-ficha-header-meta">
          <span className="note">Sombra: {esc(sombra)}/6</span>
          <span className="admin-ficha-toggle">{aberto ? '▲' : '▼'}</span>
        </div>
      </div>
      {aberto && (
        <div className="admin-ficha-detalhe">
          <div className="admin-ficha-grid">
            {[['Arquétipo', data.arquetipo],['Nível', data.nivel],['Carne', data.carne],
              ['Pólvora', data.polvora],['Deserto', data.deserto],['Alma', data.alma],
              ['A Sombra', `${sombra}/6`],
              ['Ferimentos', [data.ferimento1&&'1º',data.ferimento2&&'2º',data.ferimento3&&'3º'].filter(Boolean).join(', ')||'Nenhum'],
              ['Arma principal', data.arma1],['Munição', data.municao],
              ['Arma secundária', data.arma2],['Água', data.agua],
            ].map(([label, val]) => (
              <div key={label}><span className="admin-label">{label}</span><span>{esc(val)}</span></div>
            ))}
          </div>
          {data.aparencia     && <div style={{marginTop:10}}><span className="admin-label">Aparência</span><p className="note" style={{margin:'4px 0 0'}}>{data.aparencia}</p></div>}
          {data.aparencia_hab && <div style={{marginTop:10}}><span className="admin-label">Habilidade</span><p className="note" style={{margin:'4px 0 0'}}>{data.aparencia_hab}</p></div>}
          {data.provisoes     && <div style={{marginTop:10}}><span className="admin-label">Provisões</span><p className="note" style={{margin:'4px 0 0'}}>{data.provisoes}</p></div>}
          <p className="note" style={{marginTop:14,borderTop:'1px solid var(--marrom)',paddingTop:8}}>
            Última atualização: {formatarData(data.updatedAt)}
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Linha de rolagem ─────────────────────────────────────── */
function RolagemRow({ data }) {
  const modSinal = (data.modTotal || 0) >= 0 ? '+' + data.modTotal : String(data.modTotal)
  return (
    <div className="hist-row">
      <span className="hist-hora" title={formatarData(data.timestamp)}>{tempoRelativo(data.timestamp)}</span>
      <span className="hist-nome">{esc(data.personagem || '—')}</span>
      <span className="hist-email note">{esc(data.email)}</span>
      <span className={`hist-attr hist-attr--${data.atributo || ''}`}>{ATTR_LABEL[data.atributo] || data.atributo}</span>
      <span className="hist-dados">{dadosTexto(data)} {modSinal}</span>
      <span className="hist-total">= {data.total}</span>
      <span className={`hist-tier ${TIER_CLASS[data.tierId] || ''}`}>{data.tierLabel}</span>
      {data.intervencaoAplicada && (
        <span className="hist-intervencao note">{data.intervencaoAplicada.replace(/_/g, ' ')}</span>
      )}
    </div>
  )
}

/* ── Admin principal ──────────────────────────────────────── */
export default function Admin() {
  const { user, loading } = useAuth()
  const isAdmin = !!(user && ADMIN_EMAIL && user.email === ADMIN_EMAIL)

  const [aba, setAba] = useState('fichas')
  const [fichas, setFichas] = useState([])
  const [fichasStatus, setFichasStatus] = useState('')
  const [rolagens, setRolagens] = useState([])
  const [rolagensStatus, setRolagensStatus] = useState('')
  const [filtroJogador, setFiltroJogador] = useState('')

  const carregarFichas = useCallback(async () => {
    if (!isFirebaseConfigured) return
    setFichasStatus('Carregando fichas…')
    try {
      const snap = await getDocs(collection(db, 'fichas'))
      const arr = snap.docs.map(d => ({ uid: d.id, data: d.data() }))
      setFichas(arr)
      setFichasStatus(arr.length + ' ficha(s) carregada(s).')
    } catch (e) { setFichasStatus('Erro: ' + e.message) }
  }, [])

  const carregarRolagens = useCallback(async () => {
    if (!isFirebaseConfigured) return
    setRolagensStatus('Carregando rolagens…')
    try {
      const q = query(collection(db, 'rolagens'), orderBy('timestamp', 'desc'), limit(200))
      const snap = await getDocs(q)
      setRolagens(snap.docs.map(d => d.data()))
      setRolagensStatus(snap.size + ' rolagem(ns) carregada(s).')
    } catch (e) { setRolagensStatus('Erro: ' + e.message) }
  }, [])

  useEffect(() => {
    if (isAdmin) carregarFichas()
  }, [isAdmin, carregarFichas])

  useEffect(() => {
    if (isAdmin && aba === 'rolagens' && rolagens.length === 0) carregarRolagens()
  }, [aba, isAdmin])

  if (loading) return <><Nav /><p style={{textAlign:'center',padding:40}}>Verificando acesso…</p></>

  if (!user || !isAdmin) {
    return (
      <>
        <Nav />
        <div className="section" style={{textAlign:'center',padding:40,marginTop:20}}>
          <p style={{color:'var(--vermelho)',fontSize:'1.1em'}}>Acesso negado.</p>
          <p>Este painel é restrito ao Mestre da campanha.</p>
          <Link to="/login" className="link-button" style={{marginTop:16,display:'inline-block'}}>Entrar com outra conta</Link>
        </div>
      </>
    )
  }

  const emailsUnicos = [...new Set(rolagens.map(r => r.email).filter(Boolean))].sort()
  const rolagensFiltradas = filtroJogador ? rolagens.filter(r => r.email === filtroJogador) : rolagens

  return (
    <>
      <Nav />
      <header className="page-header">
        <h1>Painel do Mestre</h1>
        <p className="quote">Fichas e rolagens de todos os jogadores.</p>
      </header>

      <div className="section" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <p style={{margin:0}}>Mestre: <strong>{user.email}</strong></p>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab${aba==='fichas' ? ' admin-tab--active' : ''}`} onClick={() => setAba('fichas')}>Fichas</button>
        <button className={`admin-tab${aba==='rolagens' ? ' admin-tab--active' : ''}`} onClick={() => { setAba('rolagens') }}>Histórico de Rolagens</button>
      </div>

      {aba === 'fichas' && (
        <div className="section">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,marginBottom:16}}>
            <h2 style={{margin:0,border:'none',padding:0}}>Fichas dos Jogadores</h2>
            <button onClick={carregarFichas} className="secondary" style={{minWidth:'auto',padding:'10px 18px',flex:'none'}}>↺ Atualizar</button>
          </div>
          <p className="note">{fichasStatus}</p>
          {fichas.length === 0 && !fichasStatus.includes('Erro') && (
            <p className="note">Nenhuma ficha cadastrada ainda.</p>
          )}
          {fichas.map(({ uid, data }) => <FichaCard key={uid} uid={uid} data={data} />)}
        </div>
      )}

      {aba === 'rolagens' && (
        <div className="section">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,marginBottom:16}}>
            <h2 style={{margin:0,border:'none',padding:0}}>Histórico de Rolagens</h2>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
              <select value={filtroJogador} onChange={e => setFiltroJogador(e.target.value)}
                style={{padding:'8px 12px',fontSize:'0.82rem',minWidth:160}}>
                <option value="">Todos os jogadores</option>
                {emailsUnicos.map(email => <option key={email} value={email}>{email}</option>)}
              </select>
              <button onClick={carregarRolagens} className="secondary" style={{minWidth:'auto',padding:'10px 18px',flex:'none'}}>↺ Atualizar</button>
            </div>
          </div>
          <p className="note">{rolagensStatus}{filtroJogador && ` · ${rolagensFiltradas.length} rolagem(ns) de ${filtroJogador}`}</p>
          <div className="hist-lista">
            {rolagensFiltradas.length === 0
              ? <p className="note">Nenhuma rolagem encontrada.</p>
              : rolagensFiltradas.map((r, i) => <RolagemRow key={i} data={r} />)
            }
          </div>
        </div>
      )}
    </>
  )
}
