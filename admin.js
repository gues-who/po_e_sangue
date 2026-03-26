(function () {
    'use strict';

    var auth = null;
    var db = null;

    function isConfigured() {
        return window.FIREBASE_CONFIG &&
               window.FIREBASE_CONFIG.apiKey !== 'COLE_AQUI';
    }

    function setStatus(msg) {
        var el = document.getElementById('adminStatus');
        if (el) el.textContent = msg;
    }

    function mostrarNegado() {
        document.getElementById('adminVerificando').hidden = true;
        document.getElementById('adminNegado').hidden = false;
        document.getElementById('adminPanel').hidden = true;
    }

    function mostrarPainel(user) {
        document.getElementById('adminVerificando').hidden = true;
        document.getElementById('adminNegado').hidden = true;
        document.getElementById('adminPanel').hidden = false;
        document.getElementById('adminEmail').textContent = user.email;
    }

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

        var nome = data.nome || '(sem nome)';
        var email = data.email || uid;
        var arquetipo = data.arquetipo || '—';
        var sombra = data.sombra != null ? data.sombra : '—';
        var atualizado = formatarData(data.updatedAt);

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
                    '<div><span class="admin-label">Carne</span><span>' + escHtml(String(data.carne || 0)) + '</span></div>' +
                    '<div><span class="admin-label">Pólvora</span><span>' + escHtml(String(data.polvora || 0)) + '</span></div>' +
                    '<div><span class="admin-label">Deserto</span><span>' + escHtml(String(data.deserto || 0)) + '</span></div>' +
                    '<div><span class="admin-label">Alma</span><span>' + escHtml(String(data.alma || 0)) + '</span></div>' +
                    '<div><span class="admin-label">A Sombra</span><span>' + escHtml(String(sombra)) + '/6</span></div>' +
                    '<div><span class="admin-label">Ferimentos</span><span>' + escHtml(valorFerimentos(data)) + '</span></div>' +
                    '<div><span class="admin-label">Arma principal</span><span>' + escHtml(data.arma1 || '—') + '</span></div>' +
                    '<div><span class="admin-label">Munição</span><span>' + escHtml(String(data.municao || 0)) + '</span></div>' +
                    '<div><span class="admin-label">Arma secundária</span><span>' + escHtml(data.arma2 || '—') + '</span></div>' +
                    '<div><span class="admin-label">Água</span><span>' + escHtml(data.agua || '—') + '</span></div>' +
                '</div>' +
                (data.aparencia ? '<div style="margin-top:10px;"><span class="admin-label">Aparência</span><p class="note" style="margin:4px 0 0;">' + escHtml(data.aparencia) + '</p></div>' : '') +
                (data.aparencia_hab ? '<div style="margin-top:10px;"><span class="admin-label">Habilidade</span><p class="note" style="margin:4px 0 0;">' + escHtml(data.aparencia_hab) + '</p></div>' : '') +
                (data.provisoes ? '<div style="margin-top:10px;"><span class="admin-label">Provisões</span><p class="note" style="margin:4px 0 0;">' + escHtml(data.provisoes) + '</p></div>' : '') +
                '<p class="note" style="margin-top:14px;border-top:1px solid var(--marrom);padding-top:8px;">Última atualização: ' + atualizado + '</p>' +
            '</div>';

        return card;
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    window.toggleFicha = function (uid) {
        var detalhe = document.getElementById('detalhe-' + uid);
        var toggle = document.getElementById('toggle-' + uid);
        if (!detalhe) return;
        var aberto = !detalhe.hidden;
        detalhe.hidden = aberto;
        if (toggle) toggle.textContent = aberto ? '▼' : '▲';
    };

    window.fazerLogout = function () {
        if (auth) auth.signOut().then(function () {
            window.location.href = 'login.html';
        });
    };

    window.recarregarFichas = function () {
        carregarFichas();
    };

    function carregarFichas() {
        if (!db) return;
        setStatus('Carregando fichas…');
        var lista = document.getElementById('fichasLista');
        lista.innerHTML = '';

        db.collection('fichas').get()
            .then(function (snapshot) {
                if (snapshot.empty) {
                    lista.innerHTML = '<p class="note">Nenhuma ficha cadastrada ainda.</p>';
                    setStatus('');
                    return;
                }
                snapshot.forEach(function (doc) {
                    lista.appendChild(criarCardFicha(doc.id, doc.data()));
                });
                setStatus(snapshot.size + ' ficha(s) carregada(s).');
            })
            .catch(function (err) {
                setStatus('Erro ao carregar fichas: ' + err.message);
            });
    }

    function init() {
        if (!isConfigured()) {
            document.getElementById('adminVerificando').innerHTML =
                '<p style="color:var(--vermelho);">⚠ Firebase não configurado. Preencha firebase-config.js.</p>';
            return;
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(window.FIREBASE_CONFIG);
            }
            auth = firebase.auth();
            db = firebase.firestore();

            auth.onAuthStateChanged(function (user) {
                if (!user) {
                    mostrarNegado();
                    return;
                }
                if (!window.ADMIN_EMAIL || user.email !== window.ADMIN_EMAIL) {
                    mostrarNegado();
                    return;
                }
                mostrarPainel(user);
                carregarFichas();
            });
        } catch (err) {
            document.getElementById('adminVerificando').innerHTML =
                '<p style="color:var(--vermelho);">Erro Firebase: ' + err.message + '</p>';
        }
    }

    init();
})();
