import { useState, useEffect, useRef, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getDb, isFirebaseConfigured } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import WantedPoster from '../components/WantedPoster'

const LS_KEY = 'poesangue_ficha_v1'

const INITIAL = {
  nome: '', nivel: '0', arquetipo: 'O Ex-Soldado', aparencia: '',
  carne: '0', polvora: '0', deserto: '0', alma: '0', sombra: '0',
  ferimento1: false, ferimento2: false, ferimento3: false,
  aparencia_hab: '', arma1: '', municao: '0', arma2: '',
  agua: 'Cheio', provisoes: '', fotoBase64: '',
}

/* Aplica o recorte selecionado e retorna base64 JPEG comprimido (~30–60 kB) */
function aplicarRecorte(imgEl, pixelCrop, outputSize = 350, qualidade = 0.7) {
  const scaleX = imgEl.naturalWidth  / imgEl.width
  const scaleY = imgEl.naturalHeight / imgEl.height
  const canvas = document.createElement('canvas')
  canvas.width  = outputSize
  canvas.height = outputSize
  canvas.getContext('2d').drawImage(
    imgEl,
    pixelCrop.x * scaleX, pixelCrop.y * scaleY,
    pixelCrop.width * scaleX, pixelCrop.height * scaleY,
    0, 0, outputSize, outputSize,
  )
  return canvas.toDataURL('image/jpeg', qualidade)
}

/* ── Modal de recorte ────────────────────────────────────── */
function CropModal({ srcUrl, onConfirm, onCancel }) {
  const imgRef       = useRef(null)
  const [crop,          setCrop]          = useState()
  const [completedCrop, setCompletedCrop] = useState()

  function onImageLoad(e) {
    const { width, height } = e.currentTarget
    setCrop(centerCrop(
      makeAspectCrop({ unit: '%', width: 85 }, 1, width, height),
      width, height,
    ))
  }

  function handleConfirm() {
    if (!completedCrop || !imgRef.current) return
    onConfirm(aplicarRecorte(imgRef.current, completedCrop))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--fundo-card)',
        border: '1px solid var(--marrom)',
        borderRadius: 10,
        padding: '24px 20px',
        maxWidth: 480, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--bege-escuro)' }}>
            Recortar retrato
          </h3>
          <p className="note" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>
            Arraste para reposicionar · redimensione pelas alças dos cantos.
          </p>
        </div>

        {/* Área de recorte */}
        <div style={{
          maxHeight: '55vh', overflowY: 'auto',
          display: 'flex', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: 8,
        }}>
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            onComplete={c => setCompletedCrop(c)}
            aspect={1}
            circularCrop
            minWidth={60}
          >
            <img
              ref={imgRef}
              src={srcUrl}
              onLoad={onImageLoad}
              alt="Recorte"
              style={{ maxWidth: '100%', maxHeight: '50vh', display: 'block' }}
            />
          </ReactCrop>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="secondary"
            style={{ minWidth: 'auto', padding: '10px 20px' }}
            onClick={onCancel}>
            Cancelar
          </button>
          <button type="button"
            style={{ minWidth: 'auto', padding: '10px 24px' }}
            onClick={handleConfirm}
            disabled={!completedCrop?.width}>
            Confirmar recorte
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Ficha() {
  const [fields, setFields] = useState(INITIAL)
  const [cloudStatus, setCloudStatus] = useState('')
  const [cropSrc, setCropSrc]   = useState(null)   // URL temporária para o modal
  const statusTimer = useRef(null)
  const { user } = useAuth()

  // Carregar localStorage no mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) setFields(prev => ({ ...prev, ...JSON.parse(raw) }))
    } catch (_) {}
  }, [])

  // Auto-salvar no localStorage sempre que fields muda
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(fields)) } catch (_) {}
  }, [fields])

  // Carregar do Firestore quando usuário faz login
  useEffect(() => {
    if (!user || !isFirebaseConfigured) return
    getDb().then(db => {
      if (!db) return
      return getDoc(doc(db, 'fichas', user.uid))
    }).then(snap => {
      if (snap?.exists()) {
        setFields(prev => ({ ...prev, ...snap.data() }))
        showStatus('✔ Ficha carregada da nuvem.')
      }
    }).catch(e => showStatus('Erro ao carregar: ' + e.message))
  }, [user])

  function showStatus(msg) {
    setCloudStatus(msg)
    clearTimeout(statusTimer.current)
    statusTimer.current = setTimeout(() => setCloudStatus(''), 3500)
  }

  function set(id, value) {
    setFields(prev => ({ ...prev, [id]: value }))
  }

  async function salvarNaNuvem() {
    if (!user || !isFirebaseConfigured) return
    try {
      const db = await getDb()
      await setDoc(doc(db, 'fichas', user.uid), {
        ...fields, email: user.email, updatedAt: serverTimestamp(),
      })
      showStatus('✔ Ficha salva na nuvem!')
    } catch (e) { showStatus('Erro: ' + e.message) }
  }

  async function carregarDaNuvem() {
    if (!user || !isFirebaseConfigured) return
    if (!confirm('Carregar da nuvem vai sobrescrever os dados locais. Continuar?')) return
    const db = await getDb()
    const snap = await getDoc(doc(db, 'fichas', user.uid))
    if (snap.exists()) { setFields(prev => ({ ...prev, ...snap.data() })); showStatus('✔ Carregado!') }
  }

  function handleFoto(e) {
    const f = e.target.files?.[0]
    if (!f?.type.startsWith('image/')) return
    // Abre o modal de recorte com o URL temporário do arquivo
    setCropSrc(URL.createObjectURL(f))
    // Limpa o input para permitir re-selecionar o mesmo arquivo
    e.target.value = ''
  }

  function handleCropConfirm(base64) {
    set('fotoBase64', base64)
    URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function handleCropCancel() {
    URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const exportar = useCallback(() => {
    const f = fields
    const c = v => v || '—'
    const chk = v => v ? '[X]' : '[ ]'
    const txt =
      '\n=========================================\n' +
      '      FICHA DE PERSONAGEM: PÓ E SANGUE\n' +
      '=========================================\n\n' +
      `NOME/ALCUNHA: ${c(f.nome)}\nNÍVEL: ${c(f.nivel)}\nARQUÉTIPO: ${c(f.arquetipo)}\n\n` +
      `APARÊNCIA E CICATRIZES:\n${c(f.aparencia)}\n\n` +
      `--- ATRIBUTOS ---------------------------\n` +
      `CARNE: ${f.carne}  PÓLVORA: ${f.polvora}  DESERTO: ${f.deserto}  ALMA: ${f.alma}\n\n` +
      `--- A SOMBRA ----------------------------\n[ ${f.sombra} ] / 6\n\n` +
      `--- FERIMENTOS --------------------------\n${chk(f.ferimento1)} Sangrando\n${chk(f.ferimento2)} Debilitado\n${chk(f.ferimento3)} Morte\n\n` +
      `--- HABILIDADE --------------------------\n${c(f.aparencia_hab)}\n\n` +
      `--- INVENTÁRIO --------------------------\n` +
      `Arma: ${c(f.arma1)}  Munição: ${f.municao}\nArma 2: ${c(f.arma2)}  Água: ${f.agua}\n\nProvisões:\n${c(f.provisoes)}\n` +
      '=========================================\n"A guerra é deus."\n'
    const url = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `Ficha_PoeSangue_${(f.nome || 'sem_nome').replace(/\s+/g, '_')}.txt` })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [fields])

  function num(id, min, max) {
    return (
      <input type="number" id={id} value={fields[id]} min={min} max={max}
        onChange={e => set(id, e.target.value)} />
    )
  }

  function txt(id, placeholder, rows) {
    const Tag = rows ? 'textarea' : 'input'
    return (
      <Tag type={rows ? undefined : 'text'} id={id} value={fields[id]}
        placeholder={placeholder}
        onChange={e => set(id, e.target.value)}
        rows={rows} />
    )
  }

  return (
    <>
      <Nav />

      {/* Modal de recorte — aparece quando o usuário seleciona uma foto */}
      {cropSrc && (
        <CropModal
          srcUrl={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* Painel de nuvem — sempre visível (rota protegida) */}
      <div className="cloud-panel">
        <div className="cloud-panel-user">
          <span className="cloud-panel-email">{user?.email}</span>
        </div>
        <div className="cloud-panel-actions">
          <span className="cloud-status">{cloudStatus}</span>
          <button type="button" className="cloud-btn" onClick={salvarNaNuvem}>
            Salvar na nuvem
          </button>
          <button type="button" className="cloud-btn cloud-btn--sec" onClick={carregarDaNuvem}>
            Carregar da nuvem
          </button>
        </div>
      </div>

      <header className="page-header">
        <h1>Pó e Sangue</h1>
        <p className="quote">A guerra é deus.</p>
      </header>

      <WantedPoster nome={fields.nome} nivel={fields.nivel} fotoSrc={fields.fotoBase64 || null} />

      <form id="fichaForm" onSubmit={e => e.preventDefault()}>

        <div className="section">
          <h2>Identidade</h2>
          <label htmlFor="nome">Nome/Alcunha:</label>
          {txt('nome', "Ex: Silas, 'O Manco'")}

          <label htmlFor="nivel">Nível (recompensa no cartaz):</label>
          {num('nivel', 0, 99)}

          <label htmlFor="fotoPlayer">Retrato do foragido (imagem):</label>
          <input type="file" id="fotoPlayer" accept="image/*" onChange={handleFoto} />

          <label htmlFor="arquetipo">Arquétipo:</label>
          <select id="arquetipo" value={fields.arquetipo} onChange={e => set('arquetipo', e.target.value)}>
            <option value="O Ex-Soldado">O Ex-Soldado (O Desertor)</option>
            <option value="O Garoto">O Garoto (O Sobrevivente)</option>
            <option value="O Rastreador">O Rastreador (O Batedor)</option>
            <option value="O Falso Profeta">O Falso Profeta (O Pregador Caído)</option>
            <option value="Outro">Outro (Personalizado)</option>
          </select>

          <label htmlFor="aparencia">Aparência e Cicatrizes:</label>
          {txt('aparencia', 'Descreva fardas rasgadas, cicatrizes, olhar vazio…', 3)}
        </div>

        <div className="section">
          <h2>Atributos</h2>
          <p className="note">Distribua: +2, +1, +1, 0.</p>
          <div className="attributes-grid">
            {['carne','polvora','deserto','alma'].map(id => (
              <div key={id}>
                <label htmlFor={id}>{id.charAt(0).toUpperCase() + id.slice(1)}:</label>
                {num(id, -2, 3)}
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h2>Corrupção e Morte</h2>
          <label htmlFor="sombra">A Sombra (0 a 6):</label>
          <p className="note">Em 6, o personagem vira NPC.</p>
          {num('sombra', 0, 6)}

          <label>Ferimentos:</label>
          <div className="checkbox-group">
            {[
              ['ferimento1', '1º (Sangrando: desvantagem em rolagens físicas)'],
              ['ferimento2', '2º (Debilitado)'],
              ['ferimento3', '3º (Morte)'],
            ].map(([id, label]) => (
              <label key={id}>
                <input type="checkbox" id={id} checked={fields[id]}
                  onChange={e => set(id, e.target.checked)} /> {label}
              </label>
            ))}
          </div>
        </div>

        <div className="section">
          <h2>Habilidade do Arquétipo</h2>
          {txt('aparencia_hab', 'Instinto de Trincheira, Nascido no Fogo, Olhos de Abutre, Fogo e Enxofre…', 3)}
        </div>

        <div className="section">
          <h2>Inventário e Recursos</h2>
          <label htmlFor="arma1">Arma de Fogo Principal:</label>
          {txt('arma1', 'Ex: Rifle Springfield 1842')}

          <label htmlFor="municao">Munição Restante:</label>
          {num('municao', 0, 9999)}

          <label htmlFor="arma2">Arma Branca / Secundária:</label>
          {txt('arma2', 'Ex: Baioneta enferrujada')}

          <label htmlFor="agua">Água / Cantil:</label>
          <select id="agua" value={fields.agua} onChange={e => set('agua', e.target.value)}>
            {['Cheio','Metade','Gotas','Vazio'].map(v => (
              <option key={v} value={v}>{v === 'Vazio' ? 'Vazio (Desidratando)' : v === 'Gotas' ? 'Apenas Gotas' : v}</option>
            ))}
          </select>

          <label htmlFor="provisoes">Provisões e Pertences:</label>
          {txt('provisoes', 'Fósforos, charque, charutos, tabaco…', 3)}
        </div>

        <div className="btn-bar">
          <a className="link-button" href="#/rolagens">Abrir rolagens</a>
          <button type="button" onClick={exportar}>Exportar ficha (.txt)</button>
        </div>
      </form>
    </>
  )
}
