/**
 * Pó e Sangue — motor de regras (2d6 + atributo).
 * Convertido de IIFE para ES module.
 */

export const ARQUETIPOS = {
  EX_SOLDADO:   'O Ex-Soldado',
  GAROTO:       'O Garoto',
  RASTREADOR:   'O Rastreador',
  FALSO_PROFETA:'O Falso Profeta',
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)) }
function rollD6(rng) { return Math.floor((rng || Math.random)() * 6) + 1 }
function sortDesc(arr) { return arr.slice().sort((a, b) => b - a) }
function sortAsc(arr)  { return arr.slice().sort((a, b) => a - b) }

export function calcularRolagem(entrada) {
  const rng = entrada.rng || Math.random
  const atributo = entrada.atributo
  let valorAttr = parseInt(String(entrada.valorAtributo), 10)
  if (!Number.isFinite(valorAttr)) valorAttr = 0

  const ctx = entrada.contexto || {}
  const arquetipo = entrada.arquetipo || ''
  const sombraAtual = clamp(parseInt(String(entrada.sombraAtual), 10) || 0, 0, 6)

  const modificadores = []
  let modo = '2d6'
  let dadosBrutos = [rollD6(rng), rollD6(rng)]
  let dadosUsados, descarte = null

  const fisico = atributo === 'carne' || atributo === 'polvora'
  const rastreadorDeserto =
    arquetipo === ARQUETIPOS.RASTREADOR &&
    atributo === 'deserto' &&
    ctx.rastreamentoRecursos

  if (rastreadorDeserto) {
    modo = '3d6_descarta_menor'
    dadosBrutos = [rollD6(rng), rollD6(rng), rollD6(rng)]
    const asc = sortAsc(dadosBrutos)
    descarte = asc[0]
    dadosUsados = asc.slice(1)
    modificadores.push({ descricao: 'Olhos de Abutre (3d6, descarta o menor)', valor: 0 })
  } else if (fisico && ctx.ferimento1) {
    modo = '3d6_descarta_maior'
    dadosBrutos = [rollD6(rng), rollD6(rng), rollD6(rng)]
    const desc = sortDesc(dadosBrutos)
    descarte = desc[0]
    dadosUsados = desc.slice(1)
    modificadores.push({ descricao: '1º ferimento — desvantagem física (3d6, descarta o maior)', valor: 0 })
  } else {
    dadosUsados = dadosBrutos.slice()
  }

  const somaDados = dadosUsados[0] + dadosUsados[1]

  let modAttr
  if (ctx.usarSombraNoLugar) {
    modAttr = sombraAtual
    modificadores.push({ descricao: 'Sombra no lugar do atributo', valor: modAttr })
  } else {
    modAttr = valorAttr
    modificadores.push({ descricao: 'Atributo (' + atributo + ')', valor: modAttr })
  }

  if (
    arquetipo === ARQUETIPOS.GAROTO &&
    (atributo === 'carne' || atributo === 'alma') &&
    ctx.isoladoOuUltimo &&
    !ctx.usarSombraNoLugar
  ) {
    modificadores.push({ descricao: 'Nascido no Fogo (Garoto)', valor: 1 })
  }

  const modTotal = modificadores.reduce((acc, m) => acc + m.valor, 0)
  const total = somaDados + modTotal

  let tierId
  if (total >= 10) tierId = 'sucesso_total'
  else if (total >= 7) tierId = 'preco_sangue'
  else tierId = 'falha'

  const podeInstinto =
    arquetipo === ARQUETIPOS.EX_SOLDADO && !!ctx.combate && tierId === 'falha'

  const podeFogoEnxofre =
    arquetipo === ARQUETIPOS.FALSO_PROFETA &&
    atributo === 'alma' && !!ctx.intimidacaoAlma &&
    tierId === 'preco_sangue' && sombraAtual < 6

  return {
    atributo, modo, dadosBrutos, dadosDescartado: descarte, dadosUsados,
    somaDados, modificadores, modTotal, total, tierId,
    tierLabel: labelTier(tierId),
    intervencoes: { podeInstintoTrincheira: podeInstinto, podeFogoEnxofre },
    intervencaoAplicada: null,
  }
}

export function labelTier(tierId) {
  if (tierId === 'sucesso_total') return 'Sangue Frio (10+)'
  if (tierId === 'preco_sangue')  return 'Preço de Sangue (7–9)'
  return 'O Deserto Ri (6−)'
}

export function resumoFormula(res) {
  const partes = []
  if (res.modo === '2d6') {
    partes.push('2d6 → ' + res.dadosUsados.join(' + ') + ' = ' + res.somaDados)
  } else {
    partes.push(res.dadosBrutos.join(' + ') + ' (descarta ' + res.dadosDescartado + ') → ' + res.somaDados)
  }
  partes.push('Total: ' + res.total + ' — ' + res.tierLabel)
  return partes.join(' · ')
}

export function processarResultadoVisual(resultado, elementos) {
  const { stageWrap, detailEl, tierBadge } = elementos
  if (!stageWrap) return

  stageWrap.classList.remove('anim-sucesso', 'anim-preco', 'anim-falha', 'anim-tremor')

  if (resultado.tierId === 'sucesso_total')     stageWrap.classList.add('anim-sucesso')
  else if (resultado.tierId === 'preco_sangue') stageWrap.classList.add('anim-preco')
  else { stageWrap.classList.add('anim-falha'); stageWrap.classList.add('anim-tremor') }

  if (detailEl)  detailEl.innerHTML  = '<p class="dice-formula">' + escapeHtml(resumoFormula(resultado)) + (resultado.notaIntervencao ? '</p><p class="dice-intervencao-nota">' + escapeHtml(resultado.notaIntervencao) : '') + '</p>'
  if (tierBadge) tierBadge.textContent = resultado.tierLabel
}

export function verificarHabilidadesAtivas(resultado) {
  const opcoes = []
  const inter = resultado.intervencoes || {}
  if (inter.podeInstintoTrincheira && !resultado.intervencaoAplicada)
    opcoes.push({ id: 'instinto_trincheira', label: 'Instinto de Trincheira — falha vira Preço de Sangue (7–9)' })
  if (inter.podeFogoEnxofre && !resultado.intervencaoAplicada)
    opcoes.push({ id: 'fogo_enxofre', label: 'Fogo e Enxofre — +1 Sombra: 7–9 vira Sangue Frio (10+)' })
  return opcoes
}

export function aplicarIntervencao(tipo, resultadoAnterior, estado) {
  const base = JSON.parse(JSON.stringify(resultadoAnterior))
  if (!base.intervencoes) base.intervencoes = {}
  const sombra = clamp(parseInt(String(estado.sombraAtual), 10) || 0, 0, 6)

  if (tipo === 'instinto_trincheira') {
    base.tierId = 'preco_sangue'
    base.tierLabel = labelTier('preco_sangue')
    base.total = Math.max(7, base.total)
    base.intervencaoAplicada = 'instinto_trincheira'
    base.notaIntervencao = 'Instinto de Trincheira: o deserto cobra seu preço, mas você permanece de pé (trate como 7–9).'
    base.intervencoes.podeInstintoTrincheira = false
  } else if (tipo === 'fogo_enxofre') {
    if (sombra >= 6) return base
    base.tierId = 'sucesso_total'
    base.tierLabel = labelTier('sucesso_total')
    base.total = Math.max(10, base.total)
    base.intervencaoAplicada = 'fogo_enxofre'
    base.sombraApos = sombra + 1
    base.notaIntervencao = 'Fogo e Enxofre: +1 Sombra (ajuste na ficha). Sangue Frio alcançado.'
    base.intervencoes.podeFogoEnxofre = false
  }
  return base
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
