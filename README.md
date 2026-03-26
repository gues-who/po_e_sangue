# Pó e Sangue: Um RPG nas Fronteiras do Inferno

Baseado na obra *Meridiano de Sangue* de Cormac McCarthy.

**Pó e Sangue** é um RPG de mesa focado em sobrevivência extrema, terror psicológico e violência crua no Velho Oeste da década de 1850.

## Site estático (sem Node)

Tudo funciona com **HTML + CSS + JavaScript** puro. Não há `node_modules`, build nem servidor obrigatório.

### Páginas

| Arquivo | Conteúdo |
|---------|----------|
| **`index.html`** | Início com links para as demais páginas |
| **`ficha.html`** | Ficha de personagem, cartaz de procurado, exportação `.txt` |
| **`rolagens.html`** | 2d6 + atributo, contexto da cena, efeitos visuais |
| **`habilidades.html`** | Texto das habilidades de arquétipo |
| **`livro-jogador.html`** | Resumo das regras para o jogador |

Arquivos compartilhados: **`style.css`**, **`logic.js`** (motor de rolagem), **`ficha.js`**, **`rolagens.js`**.

### Como enviar aos jogadores

1. Compacte a pasta do projeto (todos os `.html`, `.css` e `.js` acima).
2. Os jogadores descompactam e abrem **`index.html`** (ou qualquer página) no navegador.

**Sincronização:** a ficha grava dados no **localStorage** do navegador. A página **Rolagens** tenta carregar atributos, Sombra e arquétipo salvos na ficha no **mesmo computador/navegador**.

### Regras (resumo)

- Rolagem: **2d6 + atributo** — 10+ sucesso total, 7–9 preço de sangue, 6− falha.
- **Sombra** 0–6; em 6 o personagem vira NPC.
- **Ferimentos:** até 3; o 1º afeta rolagens físicas (3d6, descarta o maior).

Detalhes dos arquétipos em **`habilidades.html`** e **`livro-jogador.html`**.

---

*"A guerra é deus."*
