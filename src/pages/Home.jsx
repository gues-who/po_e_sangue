import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

const cards = [
  {
    to: '/ficha',
    title: 'Ficha',
    desc: 'Cartaz de procurado, atributos, Sombra, ferimentos, inventário e exportação em texto.',
    icon: '📜',
  },
  {
    to: '/rolagens',
    title: 'Rolagens',
    desc: '2d6 + atributo, contexto da cena e efeitos visuais por tipo de dado.',
    icon: '🎲',
  },
  {
    to: '/habilidades',
    title: 'Habilidades',
    desc: 'Instinto de Trincheira, Nascido no Fogo, Olhos de Abutre, Fogo e Enxofre.',
    icon: '⚔️',
  },
  {
    to: '/livro-jogador',
    title: 'Livro do jogador',
    desc: 'Resumo das regras: resultados, atributos, Sombra, ferimentos.',
    icon: '📖',
  },
]

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
        {cards.map(({ to, title, desc, icon }) => (
          <Link key={to} className="portal-card group" to={to}>
            <span className="text-3xl mb-3 block">{icon}</span>
            <h2 className="mb-2">{title}</h2>
            <p className="text-sm leading-relaxed opacity-80">{desc}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
