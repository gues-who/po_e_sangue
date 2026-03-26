(function () {
    'use strict';

    var LS_KEY = 'poesangue_ficha_v1';
    var PoeSangue = window.PoeSangue;
    if (!PoeSangue) return;

    var animGeneration = 0;
    var lastRollResult = null;

    var diceStage = document.getElementById('diceStage');
    var diceStageWrap = document.getElementById('diceStageWrap');
    var diceResult = document.getElementById('diceResult');
    var diceResultInner = document.getElementById('diceResultInner');
    var diceLabelText = document.getElementById('diceLabelText');
    var diceDetail = document.getElementById('diceDetail');
    var diceIntervencoes = document.getElementById('diceIntervencoes');
    var diceTierBadge = document.getElementById('diceTierBadge');
    var ctxCombate = document.getElementById('ctxCombate');
    var ctxIsolado = document.getElementById('ctxIsolado');
    var ctxRastreamento = document.getElementById('ctxRastreamento');
    var ctxIntimidacao = document.getElementById('ctxIntimidacao');
    var ctxUsarSombra = document.getElementById('ctxUsarSombra');
    var ferimento1 = document.getElementById('ferimento1');

    var attrIds = { carne: 'carne', polvora: 'polvora', deserto: 'deserto', alma: 'alma' };

    var labels = {
        carne: 'Carne — sangue na lona',
        polvora: 'Pólvora — Colt e pólvora',
        alma: 'Alma — luz de outro mundo',
        deserto: 'Deserto — areia e vento'
    };

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
    }

    function isRollAlive(rollId) {
        return rollId === animGeneration;
    }

    function getVisualElems() {
        return {
            stageWrap: diceStageWrap,
            overlay: null,
            detailEl: diceDetail,
            tierBadge: diceTierBadge
        };
    }

    function createColtSvg() {
        var wrap = document.createElement('div');
        wrap.className = 'colt-wrap';
        wrap.setAttribute('aria-hidden', 'true');
        var uid = 'g' + Math.random().toString(36).slice(2, 9);
        wrap.innerHTML =
            '<svg class="colt-svg" viewBox="0 0 160 56" xmlns="http://www.w3.org/2000/svg">' +
            '<defs>' +
            '<linearGradient id="' + uid + 'metal" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#7a6850"/><stop offset="100%" stop-color="#3a3228"/>' +
            '</linearGradient>' +
            '<linearGradient id="' + uid + 'grip" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#6b4a38"/><stop offset="100%" stop-color="#1e120c"/>' +
            '</linearGradient>' +
            '</defs>' +
            '<rect x="0" y="21" width="58" height="11" rx="1.5" fill="#252018"/>' +
            '<rect x="54" y="19" width="8" height="15" fill="#120c08"/>' +
            '<ellipse cx="68" cy="25" rx="14" ry="16" fill="url(#' + uid + 'metal)" stroke="#1a0f08" stroke-width="1"/>' +
            '<ellipse cx="68" cy="25" rx="6" ry="7" fill="#0d0a08" opacity="0.5"/>' +
            '<path d="M56 11 L102 13 L106 20 L60 20 Z" fill="#5c4e42"/>' +
            '<path d="M82 16 L82 31 L74 33 L88 46 L110 48 L122 34 L118 12 L96 6 Z" fill="url(#' + uid + 'metal)"/>' +
            '<path d="M90 32 L84 54 L100 58 L112 48 L94 36 Z" fill="url(#' + uid + 'grip)"/>' +
            '<path d="M78 36 Q68 38 70 50" stroke="#140c08" fill="none" stroke-width="2" stroke-linecap="round"/>' +
            '<path d="M104 8 L112 0 L118 4 L110 18 Z" fill="#4a4034"/>' +
            '<rect x="52" y="13" width="4" height="8" fill="#0d0a08"/>' +
            '<circle cx="118" cy="22" r="3" fill="#2a2218"/>' +
            '</svg>';
        return wrap;
    }

    function resetDiceResultStyles() {
        diceResult.style.transform = '';
        diceResultInner.style.boxShadow = '';
        diceResultInner.style.filter = '';
    }

    function clearFx() {
        animGeneration++;
        diceStage.className = 'dice-stage';
        diceStageWrap.className = 'dice-stage-wrap';
        diceStage.querySelectorAll('.blood-layer, .gun-layer, .soul-layer, .sand-layer').forEach(function (n) {
            n.remove();
        });
        resetDiceResultStyles();
        if (diceIntervencoes) diceIntervencoes.innerHTML = '';
    }

    function getValorAtributo(kind) {
        var el = document.getElementById(attrIds[kind]);
        if (!el) return 0;
        var v = parseInt(el.value, 10);
        return Number.isFinite(v) ? v : 0;
    }

    function montarEntrada(kind) {
        return {
            atributo: kind,
            valorAtributo: getValorAtributo(kind),
            arquetipo: document.getElementById('arquetipo').value,
            sombraAtual: parseInt(document.getElementById('sombra').value, 10) || 0,
            contexto: {
                combate: ctxCombate && ctxCombate.checked,
                isoladoOuUltimo: ctxIsolado && ctxIsolado.checked,
                rastreamentoRecursos: ctxRastreamento && ctxRastreamento.checked,
                intimidacaoAlma: ctxIntimidacao && ctxIntimidacao.checked,
                ferimento1: ferimento1 && ferimento1.checked,
                usarSombraNoLugar: ctxUsarSombra && ctxUsarSombra.checked
            }
        };
    }

    function animateDiceSpin(diceResultEl, rollId) {
        var start = performance.now();
        var dur = 550;
        function frame() {
            if (!isRollAlive(rollId)) return;
            var now = performance.now();
            var p = Math.min(1, (now - start) / dur);
            var ease = easeOutCubic(p);
            diceResultEl.style.transform =
                'perspective(400px) rotateY(' + (ease * 360) + 'deg) scale(' + (0.9 + ease * 0.1) + ')';
            if (p < 1) {
                requestAnimationFrame(frame);
            } else {
                diceResultEl.style.transform = 'perspective(400px) rotateY(0deg) scale(1)';
            }
        }
        requestAnimationFrame(frame);
    }

    function animateBloodFx(layer, rollId) {
        var splat = layer.querySelector('.blood-splat');
        var drops = layer.querySelectorAll('.blood-drop');
        var t0 = performance.now();
        function tick() {
            if (!isRollAlive(rollId)) return;
            var t = performance.now() - t0;
            if (splat) {
                var sp = Math.min(1, t / 600);
                splat.style.opacity = String(0.75 * easeOutQuad(sp));
                splat.style.transform = 'scale(' + easeOutQuad(sp) + ')';
            }
            drops.forEach(function (d) {
                var delay = parseFloat(d.getAttribute('data-delay')) || 0;
                var dt = Math.max(0, t - delay * 1000);
                if (dt < 1200) {
                    var p = dt / 1200;
                    var y = -30 + p * 150;
                    var op = p < 0.12 ? p / 0.12 : 0.85 - p * 0.25;
                    d.style.opacity = String(Math.max(0, Math.min(1, op)));
                    d.style.transform = 'translateY(' + y + 'px)';
                }
            });
            if (t < 1600) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function animateGunFx(layer, rollId) {
        var flash = layer.querySelector('.gun-flash');
        var smoke = layer.querySelector('.gun-smoke');
        var colt = layer.querySelector('.colt-wrap');
        var t0 = performance.now();
        function tick() {
            if (!isRollAlive(rollId)) return;
            var t = performance.now() - t0;
            if (flash) {
                var fp = t / 350;
                if (fp < 0.15) flash.style.opacity = String(fp / 0.15 * 0.95);
                else if (fp < 0.35) flash.style.opacity = String(0.95 * (1 - (fp - 0.15) / 0.2));
                else flash.style.opacity = '0';
            }
            if (smoke) {
                var sp = Math.min(1, t / 1000);
                smoke.style.opacity = String(0.85 * (1 - sp));
                smoke.style.transform = 'translate(-50%, ' + (-40 * easeOutQuad(sp)) + 'px) scale(' + (0.8 + sp * 0.65) + ')';
            }
            if (colt) {
                var kick = t / 220;
                if (kick < 1) {
                    var k = easeOutQuad(kick);
                    colt.style.transform =
                        'translateX(calc(-50% + ' + 6 * (1 - k) + 'px)) rotate(' + (-12 * (1 - k)) + 'deg)';
                } else {
                    colt.style.transform = 'translateX(-50%) rotate(0deg)';
                }
            }
            if (t < 1100) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function buildBloodFx() {
        var layer = document.createElement('div');
        layer.className = 'blood-layer';
        var splat = document.createElement('div');
        splat.className = 'blood-splat';
        splat.style.transform = 'scale(0)';
        layer.appendChild(splat);
        for (var i = 0; i < 12; i++) {
            var d = document.createElement('div');
            d.className = 'blood-drop';
            d.style.left = 10 + Math.random() * 80 + '%';
            d.setAttribute('data-delay', String(Math.random() * 0.4));
            layer.appendChild(d);
        }
        return layer;
    }

    function buildGunFx() {
        var layer = document.createElement('div');
        layer.className = 'gun-layer';
        var flash = document.createElement('div');
        flash.className = 'gun-flash';
        var smoke = document.createElement('div');
        smoke.className = 'gun-smoke';
        layer.appendChild(flash);
        layer.appendChild(smoke);
        layer.appendChild(createColtSvg());
        return layer;
    }

    function buildSoulFx() {
        var layer = document.createElement('div');
        layer.className = 'soul-layer';
        var rays = document.createElement('div');
        rays.className = 'soul-rays';
        layer.appendChild(rays);
        return layer;
    }

    function buildSandFx() {
        var layer = document.createElement('div');
        layer.className = 'sand-layer';
        for (var i = 0; i < 24; i++) {
            var p = document.createElement('div');
            p.className = 'sand-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            var angle = Math.random() * Math.PI * 2;
            var dist = 40 + Math.random() * 90;
            p.style.setProperty('--txv', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--tyv', Math.sin(angle) * dist * 0.55 + 'px');
            p.style.setProperty('--sd', Math.random() * 0.85 + 's');
            layer.appendChild(p);
        }
        return layer;
    }

    function renderIntervencoes() {
        if (!diceIntervencoes || !lastRollResult) return;
        diceIntervencoes.innerHTML = '';
        PoeSangue.verificarHabilidadesAtivas(lastRollResult).forEach(function (o) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dice-intervencao-btn secondary';
            btn.textContent = o.label;
            btn.addEventListener('click', function () {
                var est = { sombraAtual: parseInt(document.getElementById('sombra').value, 10) || 0 };
                var novo = PoeSangue.aplicarIntervencao(o.id, lastRollResult, est);
                if (novo.sombraApos !== undefined) {
                    document.getElementById('sombra').value = String(novo.sombraApos);
                    try {
                        var d = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
                        d.sombra = novo.sombraApos;
                        localStorage.setItem(LS_KEY, JSON.stringify(d));
                    } catch (e) {}
                }
                lastRollResult = novo;
                diceResultInner.textContent = String(novo.total);
                diceResultInner.classList.toggle('dice-result-tight', novo.total >= 10);
                PoeSangue.processarResultadoVisual(novo, getVisualElems());
                renderIntervencoes();
            });
            diceIntervencoes.appendChild(btn);
        });
    }

    function showRoll(kind) {
        clearFx();
        var rollId = animGeneration;

        var resultado = PoeSangue.calcularRolagem(montarEntrada(kind));
        lastRollResult = resultado;

        if (diceDetail) diceDetail.innerHTML = '';
        if (diceTierBadge) diceTierBadge.textContent = '';

        diceLabelText.textContent = labels[kind] || '';
        diceResultInner.textContent = '…';
        diceResultInner.classList.remove('dice-result-tight');

        var fx;
        if (kind === 'carne') {
            diceStage.classList.add('fx-blood');
            fx = buildBloodFx();
        } else if (kind === 'polvora') {
            diceStage.classList.add('fx-gun');
            fx = buildGunFx();
        } else if (kind === 'alma') {
            diceStage.classList.add('fx-soul');
            fx = buildSoulFx();
        } else if (kind === 'deserto') {
            diceStage.classList.add('fx-sand');
            fx = buildSandFx();
        }

        if (fx) diceStage.insertBefore(fx, diceResult);

        if (kind === 'carne' && fx) animateBloodFx(fx, rollId);
        else if (kind === 'polvora' && fx) animateGunFx(fx, rollId);

        requestAnimationFrame(function () {
            if (!isRollAlive(rollId)) return;
            diceResultInner.textContent = String(resultado.total);
            diceResultInner.classList.toggle('dice-result-tight', resultado.total >= 10);
            PoeSangue.processarResultadoVisual(resultado, getVisualElems());
            animateDiceSpin(diceResult, rollId);
            renderIntervencoes();
        });
    }

    function loadFromFicha() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            var p = JSON.parse(raw);
            ['carne', 'polvora', 'deserto', 'alma', 'sombra', 'arquetipo'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el && p[id] != null) el.value = String(p[id]);
            });
            if (document.getElementById('ferimento1') && p.ferimento1 != null) {
                document.getElementById('ferimento1').checked = !!p.ferimento1;
            }
        } catch (e) {}
    }

    document.querySelectorAll('.dice-buttons [data-dice]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            showRoll(this.getAttribute('data-dice'));
        });
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) animGeneration++;
    });

    loadFromFicha();
})();
