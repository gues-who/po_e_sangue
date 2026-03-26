/**
 * Pó e Sangue — motor de regras (2d6 + atributo).
 */
(function (global) {
    'use strict';

    var ARQUETIPOS = {
        EX_SOLDADO: 'O Ex-Soldado',
        GAROTO: 'O Garoto',
        RASTREADOR: 'O Rastreador',
        FALSO_PROFETA: 'O Falso Profeta'
    };

    function clamp(n, a, b) {
        return Math.max(a, Math.min(b, n));
    }

    function rollD6(rng) {
        var r = rng || Math.random;
        return Math.floor(r() * 6) + 1;
    }

    function sortDesc(arr) {
        return arr.slice().sort(function (a, b) {
            return b - a;
        });
    }

    function sortAsc(arr) {
        return arr.slice().sort(function (a, b) {
            return a - b;
        });
    }

    function calcularRolagem(entrada) {
        var rng = entrada.rng ? entrada.rng : Math.random;
        var atributo = entrada.atributo;
        var valorAttr = parseInt(String(entrada.valorAtributo), 10);
        if (!Number.isFinite(valorAttr)) valorAttr = 0;

        var ctx = entrada.contexto || {};
        var arquetipo = entrada.arquetipo || '';
        var sombraAtual = clamp(parseInt(String(entrada.sombraAtual), 10) || 0, 0, 6);

        var modificadores = [];
        var modo = '2d6';
        var dadosBrutos = [rollD6(rng), rollD6(rng)];
        var dadosUsados;
        var descarte = null;

        var fisico = atributo === 'carne' || atributo === 'polvora';
        var rastreadorDeserto =
            arquetipo === ARQUETIPOS.RASTREADOR &&
            atributo === 'deserto' &&
            ctx.rastreamentoRecursos;

        if (rastreadorDeserto) {
            modo = '3d6_descarta_menor';
            dadosBrutos = [rollD6(rng), rollD6(rng), rollD6(rng)];
            var asc = sortAsc(dadosBrutos);
            descarte = asc[0];
            dadosUsados = asc.slice(1);
            modificadores.push({
                descricao: 'Olhos de Abutre (3d6, descarta o menor)',
                valor: 0
            });
        } else if (fisico && ctx.ferimento1) {
            modo = '3d6_descarta_maior';
            dadosBrutos = [rollD6(rng), rollD6(rng), rollD6(rng)];
            var desc = sortDesc(dadosBrutos);
            descarte = desc[0];
            dadosUsados = desc.slice(1);
            modificadores.push({
                descricao: '1º ferimento — desvantagem física (3d6, descarta o maior)',
                valor: 0
            });
        } else {
            dadosUsados = dadosBrutos.slice();
        }

        var somaDados = dadosUsados[0] + dadosUsados[1];

        var modAttr = 0;
        if (ctx.usarSombraNoLugar) {
            modAttr = sombraAtual;
            modificadores.push({
                descricao: 'Sombra no lugar do atributo',
                valor: modAttr
            });
        } else {
            modAttr = valorAttr;
            modificadores.push({
                descricao: 'Atributo (' + atributo + ')',
                valor: modAttr
            });
        }

        if (
            arquetipo === ARQUETIPOS.GAROTO &&
            (atributo === 'carne' || atributo === 'alma') &&
            ctx.isoladoOuUltimo &&
            !ctx.usarSombraNoLugar
        ) {
            modificadores.push({
                descricao: 'Nascido no Fogo (Garoto)',
                valor: 1
            });
        }

        var modTotal = modificadores.reduce(function (acc, m) {
            return acc + m.valor;
        }, 0);

        var total = somaDados + modTotal;

        var tierId;
        if (total >= 10) tierId = 'sucesso_total';
        else if (total >= 7) tierId = 'preco_sangue';
        else tierId = 'falha';

        var podeInstinto =
            arquetipo === ARQUETIPOS.EX_SOLDADO &&
            !!ctx.combate &&
            tierId === 'falha';

        var podeFogoEnxofre =
            arquetipo === ARQUETIPOS.FALSO_PROFETA &&
            atributo === 'alma' &&
            !!ctx.intimidacaoAlma &&
            tierId === 'preco_sangue' &&
            sombraAtual < 6;

        return {
            atributo: atributo,
            modo: modo,
            dadosBrutos: dadosBrutos,
            dadosDescartado: descarte,
            dadosUsados: dadosUsados,
            somaDados: somaDados,
            modificadores: modificadores,
            modTotal: modTotal,
            total: total,
            tierId: tierId,
            tierLabel: labelTier(tierId),
            intervencoes: {
                podeInstintoTrincheira: podeInstinto,
                podeFogoEnxofre: podeFogoEnxofre
            },
            intervencaoAplicada: null
        };
    }

    function labelTier(tierId) {
        if (tierId === 'sucesso_total') return 'Sangue Frio (10+)';
        if (tierId === 'preco_sangue') return 'Preço de Sangue (7–9)';
        return 'O Deserto Ri (6−)';
    }

    function formatarFormula(res) {
        var modoTxt;
        if (res.modo === '3d6_descarta_maior') {
            modoTxt =
                '[' +
                res.dadosBrutos.join(', ') +
                '] descarta ' +
                res.dadosDescartado +
                ' → [' +
                res.dadosUsados.join(', ') +
                ']';
        } else if (res.modo === '3d6_descarta_menor') {
            modoTxt =
                '[' +
                res.dadosBrutos.join(', ') +
                '] descarta ' +
                res.dadosDescartado +
                ' → [' +
                res.dadosUsados.join(', ') +
                ']';
        } else {
            modoTxt = '[' + res.dadosUsados.join(', ') + ']';
        }
        var mods = res.modificadores
            .map(function (m) {
                var s = m.valor >= 0 ? '+' + m.valor : String(m.valor);
                return m.descricao.split('(')[0].trim() + ' ' + s;
            })
            .join('; ');
        return modoTxt + ' + mods → **' + res.total + '** — ' + res.tierLabel;
    }

    function processarResultadoVisual(resultado, elementos) {
        var stageWrap = elementos.stageWrap;
        var overlay = elementos.overlay;

        var swClasses = ['anim-sucesso', 'anim-preco', 'anim-falha', 'anim-tremor'];
        stageWrap.classList.remove.apply(stageWrap.classList, swClasses);
        if (overlay) {
            overlay.classList.remove('anim-tremor');
        }

        if (resultado.tierId === 'sucesso_total') {
            stageWrap.classList.add('anim-sucesso');
        } else if (resultado.tierId === 'preco_sangue') {
            stageWrap.classList.add('anim-preco');
        } else {
            stageWrap.classList.add('anim-falha');
            stageWrap.classList.add('anim-tremor');
            if (overlay) {
                overlay.classList.add('anim-tremor');
                window.setTimeout(function () {
                    overlay.classList.remove('anim-tremor');
                }, 480);
            }
        }

        if (elementos.detailEl) {
            elementos.detailEl.innerHTML = formatarDetalheHtml(resultado);
        }
        if (elementos.tierBadge) {
            elementos.tierBadge.textContent = resultado.tierLabel;
        }
    }

    function formatarDetalheHtml(res) {
        var nota = res.notaIntervencao
            ? '<p class="dice-intervencao-nota">' + escapeHtml(res.notaIntervencao) + '</p>'
            : '';
        return (
            '<p class="dice-formula">' +
            escapeHtml(resumoFormula(res)) +
            '</p>' +
            nota
        );
    }

    function resumoFormula(res) {
        var partes = [];
        if (res.modo === '2d6') {
            partes.push('2d6 → ' + res.dadosUsados.join(' + ') + ' = ' + res.somaDados);
        } else {
            partes.push(
                res.dadosBrutos.join(' + ') +
                    ' (descarta ' +
                    res.dadosDescartado +
                    ') → ' +
                    res.somaDados
            );
        }
        partes.push('Total: ' + res.total + ' — ' + res.tierLabel);
        return partes.join(' · ');
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function verificarHabilidadesAtivas(resultado) {
        var opcoes = [];
        var inter = resultado.intervencoes || {};
        if (inter.podeInstintoTrincheira && !resultado.intervencaoAplicada) {
            opcoes.push({
                id: 'instinto_trincheira',
                label: 'Instinto de Trincheira — falha vira Preço de Sangue (7–9)'
            });
        }
        if (inter.podeFogoEnxofre && !resultado.intervencaoAplicada) {
            opcoes.push({
                id: 'fogo_enxofre',
                label: 'Fogo e Enxofre — +1 Sombra: 7–9 vira Sangue Frio (10+)'
            });
        }
        return opcoes;
    }

    function aplicarIntervencao(tipo, resultadoAnterior, estado) {
        var base = cloneResultado(resultadoAnterior);
        if (!base.intervencoes) {
            base.intervencoes = { podeInstintoTrincheira: false, podeFogoEnxofre: false };
        }
        var sombra = clamp(parseInt(String(estado.sombraAtual), 10) || 0, 0, 6);

        if (tipo === 'instinto_trincheira') {
            base.tierId = 'preco_sangue';
            base.tierLabel = labelTier('preco_sangue');
            base.total = Math.max(7, base.total);
            base.intervencaoAplicada = 'instinto_trincheira';
            base.notaIntervencao =
                'Instinto de Trincheira: o deserto cobra seu preço, mas você permanece de pé (trate como 7–9).';
            base.intervencoes.podeInstintoTrincheira = false;
        } else if (tipo === 'fogo_enxofre') {
            if (sombra >= 6) return base;
            base.tierId = 'sucesso_total';
            base.tierLabel = labelTier('sucesso_total');
            base.total = Math.max(10, base.total);
            base.intervencaoAplicada = 'fogo_enxofre';
            base.sombraApos = sombra + 1;
            base.notaIntervencao =
                'Fogo e Enxofre: +1 Sombra (ajuste na ficha). Sangue Frio alcançado.';
            base.intervencoes.podeFogoEnxofre = false;
        }

        return base;
    }

    function cloneResultado(r) {
        return JSON.parse(JSON.stringify(r));
    }

    global.PoeSangue = {
        calcularRolagem: calcularRolagem,
        processarResultadoVisual: processarResultadoVisual,
        verificarHabilidadesAtivas: verificarHabilidadesAtivas,
        aplicarIntervencao: aplicarIntervencao,
        formatarFormula: formatarFormula,
        resumoFormula: resumoFormula,
        ARQUETIPOS: ARQUETIPOS
    };
})(typeof window !== 'undefined' ? window : this);
