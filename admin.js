(function () {
    'use strict';

    var auth = null;
    var db   = null;
    var todasRolagens = [];

    function isConfigured() {
        return window.FIREBASE_CONFIG &&
               window.FIREBASE_CONFIG.apiKey !== 'COLE_AQUI';
    }

    /* ── status helpers ──────────────────────────────────────── */
    function setStatus(id, msg) {
        var el = document.getElementById(id);
        if (el) el.textContent = msg;
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ── auth UI ─────────────────────────────────────────────── */
    function mostrarNegado() {
        document.getElementById('adminVerificando').hidden = true;
        document.getElementById('adminNegado').hidden      = false;
        document.getElementById('adminPanel').hidden       = true;
    }

    function mostrarPainel(user) {
        document.getElementById('adminVerificando').hidden = true;
        document.getElementById('adminNegado').hidden      = true;
        document.getElementById('adminPanel').hidden       = false;
        document.getElementById('adminEmail').textContent  = user.email;
    }

    /* ── abas ────────────────────────────────────────────────── */
    window.mostrarAba = function (aba) {
        var isRol = aba === 'rolagens';
        document.getElementById('secaoFichas').hidden    =  isRol;
        document.getElementById('secaoRolagens').hidden  = !isRol;
        document.getElementById('abaFichas').classList.toggle('admin-tab--active',    !isRol);
        document.getElementById('abaRolagens').classList.toggle('admin-tab--active',   isRol);
        if (isRol && todasRolagens.length === 0) carregarRolagens();
    };

    /* ══════════════════════════════════════════════════════════
       FICHAS
    ══════════════════════════════════════════════════════════ */
    function valorFerimentos(data) {
        var f = [];
        if (data.ferimento1) f.push('1º (Sangrando)');
        if (data.ferimento2) f.push('2º (Debilitado)');
        if (data.ferimento3) f.push('3º (Morte)');
        return f.length ? f.join(', ') : 'Nenhum';
    }

    function formatarData(ts) {
        if (!ts) return '—';
        var d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString('pt-BR');
    }

    function criarCardFicha(uid, data) {
        var card = document.createElement('div');
        card.className = 'admin-ficha-card';
        card.setAttribute('data-uid', uid);

        var nome      = data.nome      || '(sem nome)';
        var email     = data.email     || uid;
        var arquetipo = data.arquetipo || '—';
        var sombra    = data.sombra != null ? data.sombra : '—';

        card.innerHTML =
            '<div class="admin-ficha-header" onclick="toggleFicha(\'' + uid + '\')">' +
                '<div class="admin-ficha-header-info">' +
                    '<span class="admin-ficha-nome">' + escHtml(nome) + '</span>' +
                    '<span class="admin-ficha-email note">' + escHtml(email) + '</span>' +
                '</div>' +
                '<div class="admin-ficha-header-meta">' +
                    '<span class="note">Sombra: ' + escHtml(String(sombra)) + '/6</span>' +
                    '<span class="admin-ficha-toggle" id="toggle-' + uid + '">▼</span>' +
                '</div>' +
            '</div>' +
            '<div class="admin-ficha-detalhe" id="detalhe-' + uid + '" hidden>' +
                '<div class="admin-ficha-grid">' +
                    '<div><span class="admin-label">Arquétipo</span><span>' + escHtml(arquetipo) + '</span></div>' +
                    '<div><span class="admin-label">Nível (recompensa)</span><span>' + escHtml(String(data.nivel || 0)) + '</span></div>' +
                    '<div><span class="admin-label">Carne</span><span>'   + escHtml(String(data.carne   || 0)) + '</span></div>' +
                    '<div><span class="admin-label">Pólvora</span><span>' + escHtml(String(data.polvora || 0)) + '</span></div>' +
                    '<div><span class="admin-label">Deserto</span><span>' + escHtml(String(data.deserto || 0)) + '</span></div>' +
                    '<div><span class="admin-label">Alma</span><span>'    + escHtml(String(data.alma    || 0)) + '</span></div>' +
                    '<div><span class="admin-label">A Sombra</span><span>' + escHtml(String(sombra)) + '/6</span></div>' +
                    '<div><span class="admin-label">Ferimentos</span><span>' + escHtml(valorFerimentos(data)) + '</span></div>' +
                    '<div><span class="admin-label">Arma principal</span><span>'  + escHtml(data.arma1   || '—') + '</span></div>' +
                    '<div><span class="admin-label">Munição</span><span>'         + escHtml(String(data.municao || 0)) + '</span></div>' +
                    '<div><span class="admin-label">Arma secundária</span><span>' + escHtml(data.arma2   || '—') + '</span></div>' +
                    '<div><span class="admin-label">Água</span><span>'            + escHtml(data.agua    || '—') + '</span></div>' +
                '</div>' +
                (data.aparencia     ? '<div style="margin-top:10px;"><span class="admin-label">Aparência</span><p class="note" style="margin:4px 0 0;">'   + escHtml(data.aparencia)     + '</p></div>' : '') +
                (data.aparencia_hab ? '<div style="margin-top:10px;"><span class="admin-label">Habilidade</span><p class="note" style="margin:4px 0 0;">'  + escHtml(data.aparencia_hab) + '</p></div>' : '') +
                (data.provisoes     ? '<div style="margin-top:10px;"><span class="admin-label">Provisões</span><p class="note" style="margin:4px 0 0;">'   + escHtml(data.provisoes)     + '</p></div>' : '') +
                '<p class="note" style="margin-top:14px;border-top:1px solid var(--marrom);padding-top:8px;">Última atualização: ' + formatarData(data.updatedAt) + '</p>' +
            '</div>';

        return card;
    }

    window.toggleFicha = function (uid) {
        var detalhe = document.getElementById('detalhe-' + uid);
        var toggle  = document.getElementById('toggle-'  + uid);
        if (!detalhe) return;
        var aberto = !detalhe.hidden;
        detalhe.hidden = aberto;
        if (toggle) toggle.textContent = aberto ? '▼' : '▲';
    };

    function carregarFichas() {
        if (!db) return;
        setStatus('adminStatus', 'Carregando fichas…');
        var lista = document.getElementById('fichasLista');
        lista.innerHTML = '';
        db.collection('fichas').get()
            .then(function (snap) {
                if (snap.empty) { lista.innerHTML = '<p class="note">Nenhuma ficha cadastrada ainda.</p>'; setStatus('adminStatus', ''); return; }
                snap.forEach(function (doc) { lista.appendChild(criarCardFicha(doc.id, doc.data())); });
                setStatus('adminStatus', snap.size + ' ficha(s) carregada(s).');
            })
            .catch(function (e) { setStatus('adminStatus', 'Erro: ' + e.message); });
    }

    window.recarregarFichas = function () { carregarFichas(); };

    /* ══════════════════════════════════════════════════════════
       HISTÓRICO DE ROLAGENS
    ══════════════════════════════════════════════════════════ */

    var ATTR_LABEL = { carne: 'Carne', polvora: 'Pólvora', alma: 'Alma', deserto: 'Deserto' };
    var TIER_CLASS = { sucesso_total: 'hist-tier--sucesso', preco_sangue: 'hist-tier--preco', falha: 'hist-tier--falha' };

    function formatarHora(ts) {
        if (!ts) return '—';
        var d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
               ' ' + d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    function tempoRelativo(ts) {
        if (!ts) return '';
        var d  = ts.toDate ? ts.toDate() : new Date(ts);
        var ms = Date.now() - d.getTime();
        if (ms < 60000)    return 'agora';
        if (ms < 3600000)  return Math.floor(ms / 60000)    + ' min atrás';
        if (ms < 86400000) return Math.floor(ms / 3600000)  + 'h atrás';
        return Math.floor(ms / 86400000) + 'd atrás';
    }

    function dadosTexto(data) {
        if (data.modo !== '2d6' && data.dadosBrutos) {
            return '[' + data.dadosBrutos.join('+') + ' desc.' + data.dadosDescartado + '→' + data.somaDados + ']';
        }
        if (data.dadosUsados && data.dadosUsados.length >= 2) {
            return '[' + data.dadosUsados[0] + '+' + data.dadosUsados[1] + '=' + data.somaDados + ']';
        }
        return '';
    }

    function criarLinhaRolagem(data) {
        var li = document.createElement('div');
        li.className = 'hist-row';

        var attrLabel = ATTR_LABEL[data.atributo] || data.atributo || '—';
        var tierCls   = TIER_CLASS[data.tierId] || '';
        var modSinal  = (data.modTotal || 0) >= 0 ? '+' + (data.modTotal || 0) : String(data.modTotal);
        var hora      = formatarHora(data.timestamp);
        var quando    = tempoRelativo(data.timestamp);

        li.innerHTML =
            '<span class="hist-hora" title="' + hora + '">' + quando + '</span>' +
            '<span class="hist-nome">' + escHtml(data.personagem || '—') + '</span>' +
            '<span class="hist-email note">' + escHtml(data.email || '') + '</span>' +
            '<span class="hist-attr hist-attr--' + escHtml(data.atributo || '') + '">' + escHtml(attrLabel) + '</span>' +
            '<span class="hist-dados">' + escHtml(dadosTexto(data)) + ' ' + modSinal + '</span>' +
            '<span class="hist-total">= ' + escHtml(String(data.total || 0)) + '</span>' +
            '<span class="hist-tier ' + tierCls + '">' + escHtml(data.tierLabel || '') + '</span>' +
            (data.intervencaoAplicada
                ? '<span class="hist-intervencao note">' + escHtml(data.intervencaoAplicada.replace(/_/g, ' ')) + '</span>'
                : '');
        return li;
    }

    function preencherFiltroJogadores(rolls) {
        var select = document.getElementById('filtroJogador');
        if (!select) return;
        var atual = select.value;
        var emails = {};
        rolls.forEach(function (r) { if (r.email) emails[r.email] = r.personagem || r.email; });
        while (select.options.length > 1) select.remove(1);
        Object.keys(emails).sort().forEach(function (email) {
            var opt = document.createElement('option');
            opt.value = email;
            opt.textContent = (emails[email] || email) + ' (' + email + ')';
            select.appendChild(opt);
        });
        select.value = atual;
    }

    function renderizarRolagens(rolls) {
        var lista = document.getElementById('rolagensLista');
        if (!lista) return;
        lista.innerHTML = '';
        if (!rolls.length) {
            lista.innerHTML = '<p class="note">Nenhuma rolagem encontrada.</p>';
            return;
        }
        rolls.forEach(function (r) { lista.appendChild(criarLinhaRolagem(r)); });
    }

    window.filtrarRolagens = function () {
        var filtro = (document.getElementById('filtroJogador') || {}).value || '';
        var filtradas = filtro
            ? todasRolagens.filter(function (r) { return r.email === filtro; })
            : todasRolagens;
        renderizarRolagens(filtradas);
        setStatus('rolagensStatus', filtradas.length + ' rolagem(ns)' + (filtro ? ' de ' + filtro : '') + '.');
    };

    function carregarRolagens() {
        if (!db) return;
        setStatus('rolagensStatus', 'Carregando rolagens…');
        db.collection('rolagens')
            .orderBy('timestamp', 'desc')
            .limit(200)
            .get()
            .then(function (snap) {
                todasRolagens = [];
                snap.forEach(function (doc) { todasRolagens.push(doc.data()); });
                preencherFiltroJogadores(todasRolagens);
                renderizarRolagens(todasRolagens);
                setStatus('rolagensStatus', todasRolagens.length + ' rolagem(ns) carregada(s).');
            })
            .catch(function (e) { setStatus('rolagensStatus', 'Erro: ' + e.message); });
    }

    window.recarregarRolagens = function () {
        todasRolagens = [];
        carregarRolagens();
    };

    /* ══════════════════════════════════════════════════════════
       INIT
    ══════════════════════════════════════════════════════════ */
    window.fazerLogout = function () {
        if (auth) auth.signOut().then(function () { window.location.href = 'login.html'; });
    };

    function init() {
        if (!isConfigured()) {
            document.getElementById('adminVerificando').innerHTML =
                '<p style="color:var(--vermelho);">⚠ Firebase não configurado. Preencha firebase-config.js.</p>';
            return;
        }
        try {
            if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
            auth = firebase.auth();
            db   = firebase.firestore();

            auth.onAuthStateChanged(function (user) {
                if (!user) { mostrarNegado(); return; }
                if (!window.ADMIN_EMAIL || user.email !== window.ADMIN_EMAIL) { mostrarNegado(); return; }
                mostrarPainel(user);
                carregarFichas();
            });
        } catch (e) {
            document.getElementById('adminVerificando').innerHTML =
                '<p style="color:var(--vermelho);">Erro Firebase: ' + e.message + '</p>';
        }
    }

    init();
})();
