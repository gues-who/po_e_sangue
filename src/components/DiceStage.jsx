import { useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import {
  processarResultadoVisual,
  verificarHabilidadesAtivas,
  aplicarIntervencao,
} from '../lib/logic'

/* ── helpers de ease ──────────────────────────────────────── */
const easeOutCubic = t => 1 - Math.pow(1 - t, 3)
const easeOutQuad  = t => 1 - (1 - t) * (1 - t)

/* ── SVG do Colt ─────────────────────────────────────────── */
function ColtSvg() {
  const id = useRef('g' + Math.random().toString(36).slice(2, 9)).current
  return (
    <div className="colt-wrap" aria-hidden="true">
      <svg className="colt-svg" viewBox="0 0 160 56" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={id + 'metal'} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7a6850"/><stop offset="100%" stopColor="#3a3228"/>
          </linearGradient>
          <linearGradient id={id + 'grip'} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b4a38"/><stop offset="100%" stopColor="#1e120c"/>
          </linearGradient>
        </defs>
        <rect x="0" y="21" width="58" height="11" rx="1.5" fill="#252018"/>
        <rect x="54" y="19" width="8" height="15" fill="#120c08"/>
        <ellipse cx="68" cy="25" rx="14" ry="16" fill={`url(#${id}metal)`} stroke="#1a0f08" strokeWidth="1"/>
        <ellipse cx="68" cy="25" rx="6" ry="7" fill="#0d0a08" opacity="0.5"/>
        <path d="M56 11 L102 13 L106 20 L60 20 Z" fill="#5c4e42"/>
        <path d={`M82 16 L82 31 L74 33 L88 46 L110 48 L122 34 L118 12 L96 6 Z`} fill={`url(#${id}metal)`}/>
        <path d="M90 32 L84 54 L100 58 L112 48 L94 36 Z" fill={`url(#${id}grip)`}/>
        <path d="M78 36 Q68 38 70 50" stroke="#140c08" fill="none" strokeWidth="2" strokeLinecap="round"/>
        <path d="M104 8 L112 0 L118 4 L110 18 Z" fill="#4a4034"/>
        <rect x="52" y="13" width="4" height="8" fill="#0d0a08"/>
        <circle cx="118" cy="22" r="3" fill="#2a2218"/>
      </svg>
    </div>
  )
}

/* ── DiceStage ───────────────────────────────────────────── */
const DiceStage = forwardRef(function DiceStage({ onSombraChange }, ref) {
  const stageRef      = useRef(null)
  const stageWrapRef  = useRef(null)
  const resultRef     = useRef(null)
  const resultInnerRef = useRef(null)
  const labelRef      = useRef(null)
  const detailRef     = useRef(null)
  const tierBadgeRef  = useRef(null)
  const animGenRef    = useRef(0)
  const lastRollRef   = useRef(null)

  const [label, setLabel]         = useState('Escolha um atributo acima')
  const [intervencoes, setIntervencoes] = useState([])

  const labels = {
    carne: 'Carne — sangue na lona', polvora: 'Pólvora — Colt e pólvora',
    alma: 'Alma — luz de outro mundo', deserto: 'Deserto — areia e vento',
  }

  function getVisualElems() {
    return { stageWrap: stageWrapRef.current, overlay: null, detailEl: detailRef.current, tierBadge: tierBadgeRef.current }
  }

  function clearFx() {
    animGenRef.current++
    const stage = stageRef.current
    const wrap  = stageWrapRef.current
    if (!stage || !wrap) return
    stage.className = 'dice-stage'
    wrap.className  = 'dice-stage-wrap'
    stage.querySelectorAll('.blood-layer,.gun-layer,.soul-layer,.sand-layer').forEach(n => n.remove())
    if (resultRef.current)      resultRef.current.style.transform = ''
    if (resultInnerRef.current) { resultInnerRef.current.style.boxShadow = ''; resultInnerRef.current.style.filter = '' }
    setIntervencoes([])
  }

  /* ── animações ─────────────────────────────────────────── */
  function animateDiceSpin(el, rollId) {
    const start = performance.now(), dur = 550
    function frame() {
      if (rollId !== animGenRef.current) return
      const p = Math.min(1, (performance.now() - start) / dur)
      const e = easeOutCubic(p)
      el.style.transform = `perspective(400px) rotateY(${e * 360}deg) scale(${0.9 + e * 0.1})`
      if (p < 1) requestAnimationFrame(frame)
      else el.style.transform = 'perspective(400px) rotateY(0deg) scale(1)'
    }
    requestAnimationFrame(frame)
  }

  function animateBloodFx(layer, rollId) {
    const splat = layer.querySelector('.blood-splat')
    const drops = layer.querySelectorAll('.blood-drop')
    const t0 = performance.now()
    function tick() {
      if (rollId !== animGenRef.current) return
      const t = performance.now() - t0
      if (splat) { const sp = Math.min(1, t / 600); splat.style.opacity = String(0.75 * easeOutQuad(sp)); splat.style.transform = `scale(${easeOutQuad(sp)})` }
      drops.forEach(d => {
        const delay = parseFloat(d.getAttribute('data-delay')) || 0
        const dt = Math.max(0, t - delay * 1000)
        if (dt < 1200) {
          const p = dt / 1200
          d.style.opacity = String(Math.max(0, Math.min(1, p < 0.12 ? p / 0.12 : 0.85 - p * 0.25)))
          d.style.transform = `translateY(${-30 + p * 150}px)`
        }
      })
      if (t < 1600) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  function animateGunFx(layer, rollId) {
    const flash = layer.querySelector('.gun-flash'), smoke = layer.querySelector('.gun-smoke'), colt = layer.querySelector('.colt-wrap')
    const t0 = performance.now()
    function tick() {
      if (rollId !== animGenRef.current) return
      const t = performance.now() - t0
      if (flash) { const fp = t / 350; flash.style.opacity = fp < 0.15 ? String(fp / 0.15 * 0.95) : fp < 0.35 ? String(0.95 * (1 - (fp - 0.15) / 0.2)) : '0' }
      if (smoke) { const sp = Math.min(1, t / 1000); smoke.style.opacity = String(0.85 * (1 - sp)); smoke.style.transform = `translate(-50%,${-40 * easeOutQuad(sp)}px) scale(${0.8 + sp * 0.65})` }
      if (colt)  { const kick = t / 220; if (kick < 1) { const k = easeOutQuad(kick); colt.style.transform = `translateX(calc(-50% + ${6 * (1 - k)}px)) rotate(${-12 * (1 - k)}deg)` } else colt.style.transform = 'translateX(-50%) rotate(0deg)' }
      if (t < 1100) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  /* ── builders de FX ────────────────────────────────────── */
  function buildBloodFx() {
    const layer = document.createElement('div'); layer.className = 'blood-layer'
    const splat = document.createElement('div'); splat.className = 'blood-splat'; splat.style.transform = 'scale(0)'
    layer.appendChild(splat)
    for (let i = 0; i < 12; i++) {
      const d = document.createElement('div'); d.className = 'blood-drop'
      d.style.left = 10 + Math.random() * 80 + '%'
      d.setAttribute('data-delay', String(Math.random() * 0.4))
      layer.appendChild(d)
    }
    return layer
  }

  function buildGunFx() {
    const layer = document.createElement('div'); layer.className = 'gun-layer'
    layer.innerHTML = '<div class="gun-flash"></div><div class="gun-smoke"></div>'
    return layer
  }

  function buildSoulFx() {
    const layer = document.createElement('div'); layer.className = 'soul-layer'
    layer.innerHTML = '<div class="soul-rays"></div>'
    return layer
  }

  function buildSandFx() {
    const layer = document.createElement('div'); layer.className = 'sand-layer'
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('div'); p.className = 'sand-particle'
      p.style.left = Math.random() * 100 + '%'; p.style.top = Math.random() * 100 + '%'
      const angle = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 90
      p.style.setProperty('--txv', Math.cos(angle) * dist + 'px')
      p.style.setProperty('--tyv', Math.sin(angle) * dist * 0.55 + 'px')
      p.style.setProperty('--sd', Math.random() * 0.85 + 's')
      layer.appendChild(p)
    }
    return layer
  }

  /* ── intervencoes ───────────────────────────────────────── */
  function refreshIntervencoes(res) {
    setIntervencoes(verificarHabilidadesAtivas(res))
  }

  function handleIntervencao(opcaoId, sombraAtualStr) {
    if (!lastRollRef.current) return
    const sombra = parseInt(sombraAtualStr || '0', 10) || 0
    const novo = aplicarIntervencao(opcaoId, lastRollRef.current, { sombraAtual: sombra })
    lastRollRef.current = novo
    if (resultInnerRef.current) resultInnerRef.current.textContent = String(novo.total)
    processarResultadoVisual(novo, getVisualElems())
    if (novo.sombraApos !== undefined && onSombraChange) onSombraChange(novo.sombraApos)
    refreshIntervencoes(novo)
  }

  /* ── playRoll (exposta via ref) ─────────────────────────── */
  const playRoll = useCallback((resultado, atributo, sombraAtual) => {
    clearFx()
    const rollId = animGenRef.current
    lastRollRef.current = resultado

    setLabel(labels[atributo] || '')

    const ri = resultInnerRef.current
    if (ri) { ri.textContent = '…'; ri.classList.remove('dice-result-tight') }

    const stage = stageRef.current

    let fx
    if (atributo === 'carne')   { stage.classList.add('fx-blood'); fx = buildBloodFx() }
    else if (atributo === 'polvora') {
      stage.classList.add('fx-gun')
      fx = buildGunFx()
      const coltDiv = document.createElement('div')
      coltDiv.className = 'colt-wrap'
      coltDiv.setAttribute('aria-hidden', 'true')
      coltDiv.innerHTML = `<svg class="colt-svg" viewBox="0 0 160 56" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gmetal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#7a6850"/><stop offset="100%" stop-color="#3a3228"/></linearGradient><linearGradient id="ggrip" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6b4a38"/><stop offset="100%" stop-color="#1e120c"/></linearGradient></defs><rect x="0" y="21" width="58" height="11" rx="1.5" fill="#252018"/><rect x="54" y="19" width="8" height="15" fill="#120c08"/><ellipse cx="68" cy="25" rx="14" ry="16" fill="url(#gmetal)" stroke="#1a0f08" stroke-width="1"/><ellipse cx="68" cy="25" rx="6" ry="7" fill="#0d0a08" opacity="0.5"/><path d="M56 11 L102 13 L106 20 L60 20 Z" fill="#5c4e42"/><path d="M82 16 L82 31 L74 33 L88 46 L110 48 L122 34 L118 12 L96 6 Z" fill="url(#gmetal)"/><path d="M90 32 L84 54 L100 58 L112 48 L94 36 Z" fill="url(#ggrip)"/><path d="M78 36 Q68 38 70 50" stroke="#140c08" fill="none" stroke-width="2" stroke-linecap="round"/><path d="M104 8 L112 0 L118 4 L110 18 Z" fill="#4a4034"/><rect x="52" y="13" width="4" height="8" fill="#0d0a08"/><circle cx="118" cy="22" r="3" fill="#2a2218"/></svg>`
      fx.appendChild(coltDiv)
    }
    else if (atributo === 'alma')    { stage.classList.add('fx-soul'); fx = buildSoulFx() }
    else if (atributo === 'deserto') { stage.classList.add('fx-sand'); fx = buildSandFx() }

    if (fx) stage.insertBefore(fx, resultRef.current)
    if (atributo === 'carne'   && fx) animateBloodFx(fx, rollId)
    else if (atributo === 'polvora' && fx) animateGunFx(fx, rollId)

    requestAnimationFrame(() => {
      if (rollId !== animGenRef.current) return
      if (ri) { ri.textContent = String(resultado.total); ri.classList.toggle('dice-result-tight', resultado.total >= 10) }
      processarResultadoVisual(resultado, getVisualElems())
      animateDiceSpin(resultRef.current, rollId)
      refreshIntervencoes(resultado)
    })
  }, [onSombraChange])

  useImperativeHandle(ref, () => ({ playRoll }), [playRoll])

  return (
    <>
      <div className="dice-tier-badge" ref={tierBadgeRef}></div>
      <div className="dice-label" ref={labelRef}>{label}</div>
      <div className="dice-stage-wrap" ref={stageWrapRef}>
        <div className="dice-stage" ref={stageRef}>
          <div className="dice-result" ref={resultRef} aria-live="polite">
            <span className="dice-result-inner" ref={resultInnerRef}>—</span>
          </div>
        </div>
      </div>
      <div className="dice-detail" ref={detailRef}></div>
      <div className="dice-intervencoes">
        {intervencoes.map(o => (
          <button
            key={o.id}
            type="button"
            className="dice-intervencao-btn secondary"
            onClick={() => handleIntervencao(o.id, lastRollRef.current?._sombraUsada)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </>
  )
})

export default DiceStage
