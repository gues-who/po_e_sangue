import Nav from '../components/Nav'

/* ── Componentes de layout ───────────────────────────────── */
function Secao({ titulo, children }) {
  return (
    <div className="section">
      <h2>{titulo}</h2>
      {children}
    </div>
  )
}

function FichaAmeaca({ numero, nome, subtitulo, instinto, movimentos, saque, peculiaridade }) {
  return (
    <div className="section" style={{
      borderLeft: '3px solid var(--vermelho)',
      paddingLeft: 20,
      marginBottom: 18,
    }}>
      <h3 style={{ color: 'var(--vermelho)', marginBottom: 4, fontSize: '1.05rem' }}>
        {numero}. {nome}
      </h3>
      <p className="note" style={{ marginBottom: 12, fontStyle: 'italic' }}>{subtitulo}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <span className="admin-label">⚡ Instinto</span>
          <p style={{ margin: '4px 0 0', fontSize: '0.92rem' }}>{instinto}</p>
        </div>

        <div>
          <span className="admin-label">🎲 Movimentos (consequências para falhas dos jogadores)</span>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '0.88rem', lineHeight: 1.7 }}>
            {movimentos.map((m, i) => (
              <li key={i}><strong>{m.nome}:</strong> {m.desc}</li>
            ))}
          </ul>
        </div>

        <div>
          <span className="admin-label">💀 Saque (se morto)</span>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>{saque}</p>
        </div>

        <div>
          <span className="admin-label">👁 Peculiaridade</span>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', fontStyle: 'italic' }}>{peculiaridade}</p>
        </div>
      </div>
    </div>
  )
}

function TabelaD6({ titulo, itens }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      <p className="note" style={{ marginBottom: 8, fontWeight: 'bold' }}>{titulo}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--marrom)' }}>
            <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', width: 50, color: 'var(--bege-escuro)' }}>1d6</th>
            <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--bege-escuro)' }}>Encontro</th>
            <th style={{ textAlign: 'left', padding: '6px 0 6px 12px', color: 'var(--bege-escuro)' }}>Consequência</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(92,61,46,0.4)' }}>
              <td style={{ padding: '8px 12px 8px 0', fontFamily: "'Rye', serif", color: 'var(--vermelho)', fontWeight: 'bold' }}>
                {i + 1}
              </td>
              <td style={{ padding: '8px 0' }}>
                <strong>{item.nome}</strong>
              </td>
              <td style={{ padding: '8px 0 8px 12px', opacity: 0.85 }}>{item.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HumorJuiz({ itens }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
      {itens.map((item, i) => (
        <div key={i} style={{
          background: 'rgba(139,26,26,0.08)',
          border: '1px solid rgba(139,26,26,0.3)',
          borderRadius: 6,
          padding: '12px 16px',
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--vermelho)' }}>
            {item.resultado} — {item.nome}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '0.87rem', opacity: 0.9 }}>{item.desc}</p>
        </div>
      ))}
    </div>
  )
}

function ExemploRolagem({ situacao, resultados }) {
  const cores = { '10+': '#4a9', '8': '#ca6', '4': '#c44' }
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p className="note" style={{ fontStyle: 'italic', marginBottom: 4 }}>"{situacao}"</p>
      {resultados.map((r, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '10px 14px',
          borderLeft: `3px solid ${cores[r.resultado] || '#888'}`,
        }}>
          <span style={{
            fontFamily: "'Rye', serif", fontSize: '1rem', fontWeight: 'bold',
            color: cores[r.resultado] || '#888', minWidth: 32, paddingTop: 2,
          }}>{r.resultado}</span>
          <p style={{ margin: 0, fontSize: '0.87rem', lineHeight: 1.6 }}>{r.desc}</p>
        </div>
      ))}
    </div>
  )
}

/* ── Dados ───────────────────────────────────────────────── */
const AMEACAS = [
  {
    numero: 1,
    nome: 'O Caçador de Escalpos',
    subtitulo: 'A Escória da Fronteira — andam em bandos de três a cinco.',
    instinto: 'Matar rápido e arrancar o prêmio (o escalpo).',
    movimentos: [
      { nome: 'Disparo a Queima-Roupa', desc: 'Dispara uma espingarda velha do nada. Causa 2 Ferimentos e destrói a cobertura do jogador.' },
      { nome: 'Faca de Esfolar', desc: 'Em combate corpo a corpo, ele não tenta dar socos — tenta arrancar a pele. Causa 1 Ferimento + força o jogador a rolar Alma para não entrar em pânico.' },
    ],
    saque: 'Faca afiada, 1d4 moedas de ouro manchadas de sangue, cantil fedendo a whisky barato (não hidrata, mas limpa feridas).',
    peculiaridade: 'Usam colares de orelhas secas ou dentes. Riem de forma histérica quando levam um tiro não letal.',
  },
  {
    numero: 2,
    nome: 'O Guerreiro Apache Fantasma',
    subtitulo: 'Defensores implacáveis de terras ancestrais. Nunca são vistos até ser tarde demais.',
    instinto: 'Expulsar os invasores através do terror psicológico e da morte silenciosa.',
    movimentos: [
      { nome: 'A Morte que Vem do Pó', desc: 'Uma flecha de ponto invisível. Causa 2 Ferimentos diretos. Se o jogador não passar num teste de Deserto imediato, nem descobre de onde veio o tiro.' },
      { nome: 'Miragem Sanguinária', desc: 'Finge recuar para atrair os jogadores para uma armadilha com lanças e buracos na areia.' },
    ],
    saque: 'Arco de madeira e osso, 2d4 flechas, faca de pedra obsidiana. Nenhuma água — eles sabem onde encontrar no ambiente.',
    peculiaridade: 'Pintam o corpo com cinzas brancas. À luz da lua, parecem esqueletos dançando na poeira. Não emitem nenhum som ao morrer.',
  },
  {
    numero: 3,
    nome: 'O Desertor Esfomeado',
    subtitulo: 'Soldado americano ou mexicano fugido. Louco de sol, desesperado. Um animal encurralado.',
    instinto: 'Roubar água e comida a qualquer custo — implora antes de atirar pelas costas.',
    movimentos: [
      { nome: 'Tiro Desesperado', desc: 'Mira péssima. Em vez de acertar o jogador (0 Ferimentos), a bala fura o cantil ou acerta o cavalo de carga.' },
      { nome: 'O Abraço do Afogado', desc: 'Agarra o jogador chorando e implorando, prendendo os braços para que outros desertores ataquem.' },
    ],
    saque: 'Rifle militar (50% de chance de explodir na mão do próximo usuário), botas rasgadas, pedaço de charque podre.',
    peculiaridade: 'Lábios rachados e sangrando. Conversa com companheiros de pelotão mortos há meses.',
  },
  {
    numero: 4,
    nome: 'O "Rurale" (Milícia Mexicana Corrupta)',
    subtitulo: 'Cavalaria que extorque viajantes sob pretexto de "impostos alfandegários". Bem armados e montados.',
    instinto: 'Exercer autoridade brutal e tomar tudo de valor.',
    movimentos: [
      { nome: 'Fuzilamento', desc: 'Atiram em sincronia. Falha na esquiva causa 2 Ferimentos + o jogador fica surdo pelo estouro e perde a próxima ação.' },
      { nome: 'O Laço', desc: 'Joga um laço no jogador e o arrasta com o cavalo. Causa 1 Ferimento por turno até o jogador passar em Carne para cortar a corda.' },
    ],
    saque: 'Farda relativamente limpa (útil para disfarces), 1d6 balas de qualidade, tabaco, e um cavalo magro (se conseguirem acalmá-lo).',
    peculiaridade: 'Mantêm postura arrogante. Fumam charutos durante o tiroteio e exigem que os jogadores se ajoelhem antes de atirar.',
  },
]

const ENCONTROS = [
  { nome: 'A Miragem', desc: 'Teste de Alma (6−) faz um jogador gastar água e munição atirando em sombras.' },
  { nome: 'A Árvore dos Enforcados', desc: 'Corpos com suprimentos. Saquear exige Carne para não cair nos galhos podres.' },
  { nome: 'A Tempestade de Areia', desc: 'Visibilidade zero. Deserto para não perder cavalos ou suprimentos vitais.' },
  { nome: 'A Patrulha Mexicana', desc: 'Soldados famintos. Querem roubar água e ouro, não lutar.' },
  { nome: 'A Emboscada Apache', desc: 'Sinais de fumaça de manhã. À noite, flechas silenciosas (2 Ferimentos se falhar em Deserto).' },
  { nome: 'A Água Envenenada', desc: 'Poço com carcaças. Teste de Carne ou disenteria: 1 Ferimento contínuo até achar remédio.' },
]

const ENCONTROS_JUIZ = [
  { resultado: '1', nome: 'Na Escuridão', desc: 'Os jogadores estão no acampamento à noite. O Juiz aparece sentado do outro lado da fogueira, lendo um livro. Ninguém o viu chegar.' },
  { resultado: '2', nome: 'O Rastro Impossível', desc: 'Os jogadores rastreiam um inimigo e encontram o Juiz desenhando na areia. Ele apaga o desenho com o pé e aponta a direção da morte.' },
  { resultado: '3', nome: 'Nas Ruínas', desc: 'Uma igreja jesuíta abandonada. O Juiz está pregando para um bando de foras da lei hipnotizados — ou cadáveres.' },
  { resultado: '4', nome: 'O Resgate', desc: 'Os jogadores prestes a morrer de sede ou cercados. O Juiz os salva com um tiro perfeito, sorri, acena com o chapéu e vai embora, deixando-os em dívida.' },
]

const HUMOR_JUIZ = [
  { resultado: '1–2', nome: 'O Erudito (Calmo e Filosófico)', desc: 'Ignora a violência. Disseca um animal, desenha ruínas ou discursa sobre geologia. Conversa educadamente, fazendo os jogadores se sentirem minúsculos.' },
  { resultado: '3–4', nome: 'O Músico / Dançarino (Carismático e Bizarro)', desc: 'Toca rabeca ou dança com graça assustadora para seu tamanho. Oferece bebida e tenta corromper pelo prazer antes de pedir algo terrível.' },
  { resultado: '5–6', nome: 'O Arauto da Guerra (Frio e Implacável)', desc: 'Sorri no meio de um massacre. Julga os jogadores diretamente, exige sacrifícios de sangue imediatamente ou manda capangas destruírem o grupo.' },
]

const AVENTURAS = [
  {
    nome: 'O Batismo de Areia',
    foco: 'Foco em Combate e Moralidade',
    cenario: 'A cantina La Última Gota — um casebre de adobe caindo aos pedaços na fronteira de Sonora. O calor lá dentro é pior que do lado de fora. O ar cheira a suor, fumo barato e sangue seco.',
    situacao: 'Os jogadores estão falidos, com os cantis vazios e as armas na mesa. Um tenente mexicano corrupto está oferecendo o primeiro contrato: 50 moedas de prata adiantadas para caçarem escalpos em um vilarejo próximo.',
    estopim: 'Antes que os jogadores peguem a prata, a porta é chutada. Três Caçadores de Escalpos rivais entram, bêbados e armados com escopetas. Eles matam o tenente com um tiro no rosto e olham para os jogadores. "O contrato e a prata são nossos, gringos."',
    mecanicas: [
      'Tiroteio confinado: errar um tiro (6−) significa acertar lamparinas de óleo — a cantina começa a pegar fogo.',
      'Teste de Pólvora sob pressão com fumaça ardendo nos olhos.',
    ],
    especial: {
      label: '☁ A Escolha da Sombra',
      texto: 'Com a taverna em chamas, o dono (um civil) fica preso sob uma viga. Os jogadores podem ajudá-lo (não ganham nada, perdem tempo) ou deixá-lo queimar para saquear o tenente e roubar a prata — ganham o dinheiro, mas marcam +1 Sombra.',
    },
  },
  {
    nome: 'A Carroça de Ossos',
    foco: 'Foco em Mistério e Terror',
    cenario: 'Um desfiladeiro estreito no deserto de Chihuahua. O vento uiva entre as pedras. Os jogadores viajam há dias, com os suprimentos no limite.',
    situacao: 'Eles encontram uma diligência de colonos tombada. Três corpos no chão, crivados de flechas Apaches. Os cavalos foram mortos e a bagagem revirada.',
    estopim: 'Se um jogador rolar Deserto para investigar a cena, descobre a verdade: as flechas foram colocadas de propósito. Os cortes nos crânios foram feitos com facas de aço cirúrgico, não por nativos.',
    mecanicas: [
      'Os verdadeiros assassinos (Desertores Esfomeados) estão escondidos nas pedras acima, esperando os jogadores se distraírem com o saque para emboscá-los.',
      'Teste de Carne para buscar abrigo quando o primeiro tiro de rifle zunir pela orelha.',
    ],
    especial: {
      label: '☽ A Presença do Juiz',
      texto: 'Após o combate, os jogadores olham para cima. O Juiz está sentado em um pico inatingível, desenhando a carnificina em seu caderno. Ele sorri, atira uma moeda de ouro manchada de sangue para baixo, levanta-se e desaparece na poeira.',
    },
  },
  {
    nome: 'O Poço do Diabo',
    foco: 'Foco em Sobrevivência Extrema',
    cenario: 'Ruínas de uma missão jesuíta sem teto, cercada por cruzes de madeira apodrecidas. O único poço de água num raio de oitenta quilômetros fica no centro do pátio.',
    situacao: 'Os jogadores chegam no limite (talvez já com 1 Ferimento de Desidratação). A missão está ocupada por cinco Rurales. O líder, sargento Morales, tem uma metralhadora Gatling velha emperrada apontada para o portão.',
    estopim: '"A água é do Governador. Um cantil custa uma bota, um rifle ou uma orelha. Escolham." — Sargento Morales, sorrindo sob o chapéu.',
    mecanicas: [
      'O Falso Profeta pode tentar intimidar a milícia rolando Alma.',
      'O Rastreador pode rolar Deserto para achar uma entrada pelos fundos desmoronados da igreja e emboscá-los.',
    ],
    especial: {
      label: '💧 O Preço de Sangue',
      texto: 'Se tomarem o poço, a água está turva, marrom e cheirando a enxofre. Beber exige Carne. 10+: sacia a sede. 7–9: sacia, mas causa vômitos — desvantagem na próxima meia hora. 6−: disenteria (1 Ferimento contínuo até achar remédio).',
    },
  },
]

/* ── Página ──────────────────────────────────────────────── */
export default function LivroMestre() {
  return (
    <>
      <Nav />
      <header className="page-header">
        <h1>Livro do Mestre</h1>
        <p className="quote">
          O Juiz conhece a lei do deserto. Você é o deserto.
        </p>
      </header>

      <main className="book-page">

        {/* ── Intro ── */}
        <Secao titulo="Seu Papel como Mestre">
          <p>
            A paisagem é imparcial e letal. Você <strong>não rola dados em combate para atacar</strong> —
            o ataque dos NPCs acontece quando os jogadores <strong>falham (6−)</strong> em testes de
            esquiva ou tiro, ou quando tiram <strong>7–9 (Preço de Sangue)</strong>.
          </p>
          <p className="note" style={{ marginTop: 10 }}>
            Você narra as consequências. Os dados dos jogadores determinam quem sobrevive.
          </p>
        </Secao>

        {/* ── Mecânicas de Dano ── */}
        <Secao titulo="Mecânicas de Dano e Ambiente">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icone: '🔫', titulo: 'A Pólvora Molha (Armas de 1850)', desc: 'Quando um jogador atirar e rolar 6−, a arma não apenas erra — ela engasga ou explode. O jogador perde o turno destravando ou sofre 1 Ferimento se ela explodir na mão.' },
              { icone: '☀️', titulo: 'O Sol e a Sede', desc: 'Um dia sem água exige um teste de Deserto. 7–9: delírio (desvantagem em tudo). 6−: 1 Ferimento por desidratação.' },
              { icone: '💥', titulo: 'Dano de NPCs', desc: 'Tiro de raspão / facada / clava: 1 Ferimento. Tiro direto de rifle / flechada no peito: 2 Ferimentos.' },
            ].map(item => (
              <div key={item.titulo} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                background: 'rgba(0,0,0,0.15)', borderRadius: 6, padding: '12px 16px',
              }}>
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{item.icone}</span>
                <div>
                  <strong style={{ fontSize: '0.92rem' }}>{item.titulo}</strong>
                  <p className="note" style={{ margin: '4px 0 0', fontSize: '0.87rem' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Secao>

        {/* ── Tabela de Encontros ── */}
        <Secao titulo="Tabela de Encontros no Deserto">
          <p className="note">Role 1d6 por dia de viagem.</p>
          <TabelaD6 itens={ENCONTROS} />
        </Secao>

        {/* ── Como usar na prática ── */}
        <Secao titulo="Como usar as ameaças na prática">
          <p className="note">
            Exemplo: <em>"Eu saco meu revólver e atiro no Caçador de Escalpos antes que ele me alcance!"</em>
            — rola 2d6 + Pólvora.
          </p>
          <ExemploRolagem
            situacao="Atiro no Caçador de Escalpos antes que ele me alcance!"
            resultados={[
              { resultado: '10+', desc: 'Acerta um tiro perfeito no peito. O Caçador cai morto. Saqueia o corpo.' },
              { resultado: '8', desc: 'Mata o alvo, mas na pressa gastou 3 balas do tambor e o barulho chamou a atenção do resto da gangue atrás da duna. (Preço: recursos esgotados + ameaça crescente).' },
              { resultado: '4', desc: 'Sua arma engasga com a areia. O Caçador ri, pula em cima de você com a faca de esfolar e rasga o ombro. Marca 1 Ferimento e role Carne agora para empurrá-lo.' },
            ]}
          />
        </Secao>

        {/* ── Fichas de Ameaças ── */}
        <div className="section">
          <h2>Fichas de Ameaças do Deserto</h2>
          <p className="note" style={{ marginBottom: 20 }}>
            Como o sistema é focado na ação dos jogadores, os NPCs são definidos por seus <strong>Instintos</strong> e <strong>Movimentos</strong> — não por atributos numéricos.
          </p>
          {AMEACAS.map(a => <FichaAmeaca key={a.numero} {...a} />)}
        </div>

        {/* ── O Juiz ── */}
        <Secao titulo="☽ O Juiz Holden — O Antagonista Perfeito">
          <div style={{
            background: 'rgba(139,26,26,0.12)',
            border: '1px solid var(--vermelho)',
            borderRadius: 8, padding: '16px 20px', marginBottom: 20,
          }}>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              O Juiz é uma <strong>força da natureza</strong>. Tem mais de dois metros, é completamente calvo,
              pálido, erudito e incrivelmente cruel. Ele <strong>não tem Atributos e não tem Ferimentos</strong>.
              Não pode ser morto por balas — a arma dos jogadores sempre falhará ou ele desviará de forma não natural.
            </p>
          </div>

          <span className="admin-label">Habilidades Especiais</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, marginBottom: 20 }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '12px 16px' }}>
              <strong>🗣 A Lábia do Diabo</strong>
              <p className="note" style={{ margin: '6px 0 0', fontSize: '0.87rem' }}>
                Quando o Juiz discursa, qualquer jogador que tentar atacá-lo ou ignorá-lo rola <strong>Alma</strong>.
                10+: Resiste. 7–9: Hesita e fica em desvantagem. 6−: Fica aterrorizado e não pode agir contra ele.
              </p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '12px 16px' }}>
              <strong>🤝 O Pacto Sombrio</strong>
              <p className="note" style={{ margin: '6px 0 0', fontSize: '0.87rem' }}>
                O Juiz oferece salvação exata (água, pólvora, cura) em troca de um ato vil.
                Aceitar concede o recurso mas rende <strong>+2 de Sombra</strong> ao jogador.
              </p>
            </div>
          </div>

          <span className="admin-label">Esquema de Humor do Juiz (role 1d6)</span>
          <HumorJuiz itens={HUMOR_JUIZ} />

          <span className="admin-label" style={{ marginTop: 20, display: 'block' }}>Encontros com o Juiz (role 1d4 quando a tensão cair)</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {ENCONTROS_JUIZ.map(e => (
              <div key={e.resultado} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '10px 14px',
                borderLeft: '3px solid var(--vermelho)',
              }}>
                <span style={{
                  fontFamily: "'Rye', serif", fontSize: '1rem', fontWeight: 'bold',
                  color: 'var(--vermelho)', minWidth: 20,
                }}>{e.resultado}</span>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{e.nome}</strong>
                  <p className="note" style={{ margin: '4px 0 0', fontSize: '0.87rem' }}>{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Secao>

        {/* ── Aventuras ── */}
        <div className="section">
          <h2>Aventuras de Estreia</h2>
          <p className="note" style={{ marginBottom: 20 }}>
            Três cenários prontos para jogar os personagens no moedor de carne logo no
            primeiro minuto de jogo. Cada um apresenta um foco mecânico diferente.
          </p>

          {AVENTURAS.map((av, i) => (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.18)',
              border: '1px solid rgba(92,61,46,0.5)',
              borderRadius: 8,
              padding: '20px 22px',
              marginBottom: 20,
            }}>
              {/* Cabeçalho */}
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ color: 'var(--dourado)', margin: '0 0 4px', fontSize: '1.05rem' }}>
                  {i + 1}. {av.nome}
                </h3>
                <span style={{
                  fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--vermelho)', opacity: 0.9,
                }}>{av.foco}</span>
              </div>

              {/* Bloco de cenário / situação / estopim */}
              {[
                { label: '📍 Cenário',   texto: av.cenario },
                { label: '⚖ Situação',  texto: av.situacao },
                { label: '💥 Estopim',   texto: av.estopim },
              ].map(b => (
                <div key={b.label} style={{ marginBottom: 12 }}>
                  <span className="admin-label">{b.label}</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', lineHeight: 1.7 }}>{b.texto}</p>
                </div>
              ))}

              {/* Desafios mecânicos */}
              <div style={{ marginBottom: 12 }}>
                <span className="admin-label">🎲 Desafios Mecânicos</span>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '0.88rem', lineHeight: 1.8 }}>
                  {av.mecanicas.map((m, j) => <li key={j}>{m}</li>)}
                </ul>
              </div>

              {/* Elemento especial (sombra / juiz / preço) */}
              <div style={{
                background: 'rgba(139,26,26,0.12)',
                border: '1px solid rgba(139,26,26,0.35)',
                borderRadius: 6, padding: '10px 14px',
              }}>
                <span className="admin-label" style={{ color: 'var(--vermelho)' }}>
                  {av.especial.label}
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '0.87rem', lineHeight: 1.7 }}>
                  {av.especial.texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="quote" style={{ marginTop: '2rem' }}>
          A guerra é deus. E o Juiz é seu profeta.
        </p>
      </main>
    </>
  )
}
