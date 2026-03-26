import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

export default function Home() {
  return (
    <>
      <Nav />
      <header className="page-header">
        <h1>Pó e Sangue</h1>
        <p className="quote">
          Um RPG nas fronteiras do inferno · inspirado em{' '}
          <em>Meridiano de Sangue</em> (Cormac McCarthy).
        </p>
      </header>

      <div className="portal-grid">
        <Link className="portal-card" to="/ficha">
          <h2>Ficha</h2>
          <p>Cartaz de procurado, atributos, Sombra, ferimentos, inventário e exportação em texto.</p>
        </Link>
        <Link className="portal-card" to="/rolagens">
          <h2>Rolagens</h2>
          <p>2d6 + atributo, contexto da cena e efeitos visuais por tipo de dado.</p>
        </Link>
        <Link className="portal-card" to="/habilidades">
          <h2>Habilidades</h2>
          <p>Instinto de Trincheira, Nascido no Fogo, Olhos de Abutre, Fogo e Enxofre.</p>
        </Link>
        <Link className="portal-card" to="/livro-jogador">
          <h2>Livro do jogador</h2>
          <p>Resumo das regras: resultados, atributos, Sombra, ferimentos.</p>
        </Link>
      </div>
    </>
  )
}
