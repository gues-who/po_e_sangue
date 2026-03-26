import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

export default function LivroJogador() {
  return (
    <>
      <Nav />
      <header className="page-header">
        <h1>Livro do jogador</h1>
        <p className="quote">
          Resumo de <strong>Pó e Sangue</strong> — Velho Oeste, década de 1850.
          Sobrevivência, terror e violência. Inspirado em <em>Meridiano de Sangue</em> (Cormac McCarthy).
        </p>
      </header>

      <main className="book-page">
        <div className="section">
          <h2>Resolução (2d6 + atributo)</h2>
          <ul>
            <li><strong>10+ — Sangue Frio:</strong> sucesso total.</li>
            <li><strong>7–9 — Preço de Sangue:</strong> sucesso com custo (munição, ferimento leve, água, complicação).</li>
            <li><strong>6− — O Deserto Ri:</strong> falha; o Mestre aplica consequência.</li>
          </ul>
          <p className="note">Use a página <Link to="/rolagens">Rolagens</Link> para jogar os dados.</p>
        </div>

        <div className="section">
          <h2>Atributos</h2>
          <p>Distribuição típica: <strong>+2, +1, +1, 0</strong>.</p>
          <ul>
            <li><strong>Carne</strong> — força, briga, resistência física.</li>
            <li><strong>Pólvora</strong> — armas de fogo, reflexos, iniciativa.</li>
            <li><strong>Deserto</strong> — sobrevivência, rastreamento, percepção, elementos.</li>
            <li><strong>Alma</strong> — vontade, intimidação, loucura, persuasão profana.</li>
          </ul>
        </div>

        <div className="section">
          <h2>A Sombra</h2>
          <p>
            Todos começam em <strong>0</strong>. Atos cruéis ou pactos aumentam a Sombra. Ela pode substituir
            um atributo em atos vis. Em <strong>6</strong>, o personagem perde a humanidade e vira NPC.
          </p>
        </div>

        <div className="section">
          <h2>Ferimentos</h2>
          <p>Sem pontos de vida. Até <strong>3 ferimentos</strong>:</p>
          <ol>
            <li><strong>Sangrando</strong> — desvantagem em rolagens físicas (Carne/Pólvora): 3d6, descarta o maior.</li>
            <li><strong>Debilitado</strong> — mal consegue andar.</li>
            <li><strong>Morte</strong> — deixado para os abutres.</li>
          </ol>
        </div>

        <div className="section">
          <h2>Onde ir no site</h2>
          <ul>
            <li><Link to="/ficha">Ficha</Link> — personagem, inventário, exportação .txt.</li>
            <li><Link to="/rolagens">Rolagens</Link> — 2d6 e efeitos visuais.</li>
            <li><Link to="/habilidades">Habilidades</Link> — poderes de arquétipo.</li>
          </ul>
        </div>

        <p className="quote" style={{ marginTop: '2rem' }}>A guerra é deus.</p>
      </main>
    </>
  )
}
