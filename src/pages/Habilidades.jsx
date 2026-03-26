import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

export default function Habilidades() {
  return (
    <>
      <Nav />
      <header className="page-header">
        <h1>Habilidades de arquétipo</h1>
        <p className="quote">O que cada forasteiro carrega no deserto.</p>
      </header>

      <main className="book-page">
        <div className="section">
          <h2>O Ex-Soldado (O Desertor)</h2>
          <p>
            <strong>Instinto de Trincheira.</strong> Em combate, quando falhar (6−), pode transformar o resultado em{' '}
            <strong>Preço de Sangue (7–9)</strong> em vez de falha total. O deserto ainda cobra — mas você não cai de joelhos.
          </p>
          <p className="note">
            Na <Link to="/rolagens">sala de rolagem</Link>, marque <em>Combate</em> e use o botão quando aparecer.
          </p>
        </div>

        <div className="section">
          <h2>O Garoto (O Sobrevivente)</h2>
          <p>
            <strong>Nascido no Fogo.</strong> Quando estiver <strong>isolado</strong> ou for o{' '}
            <strong>último aliado de pé</strong>, recebe <strong>+1</strong> em rolagens de{' '}
            <strong>Carne</strong> e <strong>Alma</strong>.
          </p>
          <p className="note">Marque a opção correspondente nas rolagens.</p>
        </div>

        <div className="section">
          <h2>O Rastreador (O Batedor)</h2>
          <p>
            <strong>Olhos de Abutre.</strong> Ao usar <strong>Deserto</strong> para rastrear ou buscar recursos vitais,
            rola <strong>3d6</strong> e <strong>descarta o menor</strong> (em vez de 2d6).
          </p>
          <p className="note">
            Marque <em>Rastreamento / recursos vitais</em> na rolagem de Deserto.
          </p>
        </div>

        <div className="section">
          <h2>O Falso Profeta (O Pregador Caído)</h2>
          <p>
            <strong>Fogo e Enxofre.</strong> Pode usar <strong>Alma</strong> para intimidar. Se obtiver{' '}
            <strong>7–9</strong>, pode aceitar <strong>+1 Sombra</strong> para tratar o resultado como{' '}
            <strong>10+ (Sangue Frio)</strong>.
          </p>
          <p className="note">
            Marque <em>Intimidação com Alma</em>; o botão aparece em 7–9 se houver espaço na Sombra.
          </p>
        </div>
      </main>
    </>
  )
}
