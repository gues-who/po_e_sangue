import { useState, useRef, useEffect, useCallback } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import DiceStage from '../components/DiceStage'
import { calcularRolagem } from '../lib/logic'

const LS_KEY = 'poesangue_ficha_v1'

const TIER_CLASS = {
  sucesso_total: 'hist-tier--sucesso',
  preco_sangue:  'hist-tier--preco',
  falha:         'hist-tier--falha',
}
const ATTR_LABEL = { carne: 'Carne', polvora: 'Pólvora', alma: 'Alma', deserto: 'Deserto' }

function horaAgora() {
  return new Date().toLocaleTimeString('pt-BR')
}

function dadosTexto(res) {
  if (res.modo !== '2d6') return `[${res.dadosBrutos.join('+')} desc.${res.dadosDescartado}→${res.somaDados}]`
  return `[${res.dadosUsados[0]}+${res.dadosUsados[1]}=${res.dadosBrutos[0]+res.dadosBrutos[1]}]`
}

export default function Rolagens() {
  const { user } = useAuth()
  const diceRef = useRef(null)

  const [attrs, setAttrs] = useState({ carne: '0', polvora: '0', deserto: '0', alma: '0', sombra: '0' })
  const [arquetipo, setArquetipo] = useState('O Ex-Soldado')
  const [ctx, setCtx] = useState({ combate: false, isoladoOuUltimo: false, rastreamentoRecursos: false, intimidacaoAlma: false, ferimento1: false, usarSombraNoLugar: false })
  const [sessionRolls, setSessionRolls] = useState([])
  const [cloudAtivo, setCloudAtivo] = useState(false)

  useEffect(() => {
    setCloudAtivo(!!user && isFirebaseConfigured)
  }, [user])

  // Pré-carregar atributos do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const p = JSON.parse(raw)
      setAttrs(prev => ({
        carne: p.carne ?? prev.carne, polvora: p.polvora ?? prev.polvora,
        deserto: p.deserto ?? prev.deserto, alma: p.alma ?? prev.alma, sombra: p.sombra ?? prev.sombra,
      }))
      if (p.arquetipo) setArquetipo(p.arquetipo)
      if (p.ferimento1 !== undefined) setCtx(prev => ({ ...prev, ferimento1: !!p.ferimento1 }))
    } catch (_) {}
  }, [])

  function setAttr(id, val) { setAttrs(prev => ({ ...prev, [id]: val })) }
  function toggleCtx(id) { setCtx(prev => ({ ...prev, [id]: !prev[id] })) }

  function handleSombraChange(novoSombra) {
    setAttrs(prev => ({ ...prev, sombra: String(novoSombra) }))
    try {
      const raw = localStorage.getItem(LS_KEY)
      const d = raw ? JSON.parse(raw) : {}
      d.sombra = novoSombra
      localStorage.setItem(LS_KEY, JSON.stringify(d))
    } catch (_) {}
  }

  function getPersonagem() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}').nome || '' } catch (_) { return '' }
  }

  async function salvarRolagemFirestore(res, atributo, personagem) {
    if (!user || !isFirebaseConfigured) return
    try {
      await addDoc(collection(db, 'rolagens'), {
        uid: user.uid, email: user.email, personagem,
        atributo, dadosBrutos: res.dadosBrutos, dadosUsados: res.dadosUsados,
        dadosDescartado: res.dadosDescartado ?? null, modo: res.modo,
        somaDados: res.somaDados, modTotal: res.modTotal, total: res.total,
        tierId: res.tierId, tierLabel: res.tierLabel, arquetipo,
        sombra: parseInt(attrs.sombra, 10) || 0,
        intervencaoAplicada: res.intervencaoAplicada || null,
        timestamp: serverTimestamp(),
      })
    } catch (e) { console.warn('Erro ao salvar rolagem:', e.message) }
  }

  const handleRoll = useCallback((atributo) => {
    const entrada = {
      atributo,
      valorAtributo: parseInt(attrs[atributo] || '0', 10),
      arquetipo,
      sombraAtual: parseInt(attrs.sombra || '0', 10),
      contexto: ctx,
    }
    const resultado = calcularRolagem(entrada)
    const personagem = getPersonagem()

    diceRef.current?.playRoll(resultado, atributo, parseInt(attrs.sombra || '0', 10))

    const hora = horaAgora()
    setSessionRolls(prev => [{ resultado, atributo, hora, personagem }, ...prev].slice(0, 30))

    salvarRolagemFirestore(resultado, atributo, personagem)
  }, [attrs, arquetipo, ctx, user])

  const numInput = (id) => (
    <input type="number" id={id} value={attrs[id]} min="-2" max="3"
      onChange={e => setAttr(id, e.target.value)} />
  )

  return (
    <>
      <Nav />
      <header className="page-header">
        <h1>Sala de rolagem</h1>
        <p className="quote">2d6 + atributo · 10+ Sangue Frio · 7–9 Preço de Sangue · 6− O Deserto Ri</p>
      </header>

      <div className="section rolagem-valores book-page">
        <h2>Valores para a rolagem</h2>
        <p className="note">Pré-preenchido com os dados da <a href="#/ficha">ficha</a>.</p>
        <div className="attributes-grid">
          {['carne','polvora','deserto','alma'].map(id => (
            <div key={id}>
              <label htmlFor={id}>{id.charAt(0).toUpperCase() + id.slice(1)}:</label>
              {numInput(id)}
            </div>
          ))}
        </div>
        <label htmlFor="sombra">Sombra (0–6):</label>
        <input type="number" id="sombra" value={attrs.sombra} min="0" max="6"
          onChange={e => setAttr('sombra', e.target.value)} />
        <label htmlFor="arquetipo">Arquétipo:</label>
        <select id="arquetipo" value={arquetipo} onChange={e => setArquetipo(e.target.value)}>
          {['O Ex-Soldado','O Garoto','O Rastreador','O Falso Profeta','Outro'].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <label>
          <input type="checkbox" checked={ctx.ferimento1} onChange={() => toggleCtx('ferimento1')} />
          {' '}1º ferimento (desvantagem física)
        </label>
      </div>

      <div className="section book-page">
        <h2>Contexto da cena</h2>
        <div className="dice-contexto" style={{border:'none',padding:0,background:'transparent'}}>
          {[
            ['combate',              'Combate (Ex-Soldado: Instinto de Trincheira)'],
            ['isoladoOuUltimo',      'Isolado ou último de pé (Garoto)'],
            ['rastreamentoRecursos', 'Rastreamento / recursos vitais (Rastreador + Deserto)'],
            ['intimidacaoAlma',      'Intimidação com Alma (Falso Profeta)'],
            ['usarSombraNoLugar',    'Usar Sombra no lugar do atributo'],
          ].map(([id, label]) => (
            <label key={id}>
              <input type="checkbox" checked={ctx[id]} onChange={() => toggleCtx(id)} />
              {' '}{label}
            </label>
          ))}
        </div>

        <p className="dice-hint">Escolha o atributo. O efeito visual é atmosférico; o total segue as regras.</p>

        <div className="dice-buttons">
          {['carne','polvora','alma','deserto'].map(a => (
            <button key={a} type="button" className={`btn-${a}`}
              onClick={() => handleRoll(a)}>
              {ATTR_LABEL[a]}
            </button>
          ))}
        </div>

        <DiceStage ref={diceRef} onSombraChange={handleSombraChange} />
      </div>

      {sessionRolls.length > 0 && (
        <div className="section book-page">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:14}}>
            <h2 style={{margin:0,border:'none',padding:0}}>Histórico da sessão</h2>
            {cloudAtivo && <span className="hist-cloud-badge">☁ salvo na nuvem</span>}
          </div>
          <div className="hist-lista">
            {sessionRolls.map((r, i) => {
              const modSinal = (r.resultado.modTotal || 0) >= 0 ? '+' + r.resultado.modTotal : String(r.resultado.modTotal)
              return (
                <div key={i} className="hist-row">
                  <span className="hist-hora">{r.hora}</span>
                  {r.personagem && <span className="hist-nome">{r.personagem}</span>}
                  <span className={`hist-attr hist-attr--${r.atributo}`}>{ATTR_LABEL[r.atributo]}</span>
                  <span className="hist-dados">{dadosTexto(r.resultado)} {modSinal}</span>
                  <span className="hist-total">= {r.resultado.total}</span>
                  <span className={`hist-tier ${TIER_CLASS[r.resultado.tierId] || ''}`}>{r.resultado.tierLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
