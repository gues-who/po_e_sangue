export default function WantedPoster({ nome, nivel, fotoSrc }) {
  const nomeDisplay   = nome?.trim() || '— Sem nome —'
  const nivelDisplay  = isFinite(parseInt(nivel)) ? parseInt(nivel) : 0

  return (
    <div className="wanted-wrap">
      <div className="wanted-poster" aria-label="Cartaz de procurado">
        <div className="wanted-title">Procurado</div>
        <div className="wanted-photo-frame">
          {fotoSrc ? (
            <img src={fotoSrc} alt="Retrato do personagem" />
          ) : (
            <div className="wanted-photo-placeholder">
              Carregue uma imagem na seção Identidade
            </div>
          )}
        </div>
        <div className="wanted-name">{nomeDisplay}</div>
        <div className="wanted-reward">
          Recompensa: <strong>$ {nivelDisplay}</strong>
        </div>
        <div className="wanted-sub">Vivo ou morto</div>
        <div className="tumbleweed-deco" aria-hidden="true" />
      </div>
    </div>
  )
}
