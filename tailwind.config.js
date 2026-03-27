/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // preflight desligado para não sobrescrever o CSS temático do projeto
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        // paleta "Pó e Sangue" disponível como classes tw
        'ps-creme':      '#f5e9c8',
        'ps-bege':       '#e8d5a3',
        'ps-marrom':     '#5c3d1e',
        'ps-marrom-esc': '#2a1a0a',
        'ps-vermelho':   '#8b1a1a',
        'ps-areia':      '#c4a265',
      },
      fontFamily: {
        rye:     ['"Rye"', 'serif'],
        elite:   ['"Special Elite"', 'serif'],
      },
    },
  },
  plugins: [],
}
