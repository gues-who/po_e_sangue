(function () {
    'use strict';

    /* ── elementos do formulário ──────────────────────────── */
    var LS_KEY = 'poesangue_ficha_v1';

    var nomeEl             = document.getElementById('nome');
    var nivelEl            = document.getElementById('nivel');
    var fotoInput          = document.getElementById('fotoPlayer');
    var wantedImg          = document.getElementById('wantedImg');
    var wantedPlaceholder  = document.getElementById('wantedPlaceholder');
    var wantedNameDisplay  = document.getElementById('wantedNameDisplay');
    var wantedRewardDisplay = document.getElementById('wantedRewardDisplay');
    var form               = document.getElementById('fichaForm');

    /* ── cartaz de procurado ──────────────────────────────── */
    function syncPoster() {
        var n  = (nomeEl.value || '').trim();
        wantedNameDisplay.textContent = n || '— Sem nome —';
        var nv = parseInt(nivelEl.value, 10);
        wantedRewardDisplay.textContent = '$ ' + (Number.isFinite(nv) ? nv : 0);
    }

    /* ── coleta dados do formulário ───────────────────────── */
    var CAMPOS_TEXTO = [
        'nome', 'nivel', 'carne', 'polvora', 'deserto', 'alma', 'sombra',
        'arquetipo', 'aparencia', 'municao', 'arma1', 'arma2', 'agua',
        'provisoes', 'aparencia_hab'
    ];

    function collectData() {
        var o = {};
        CAMPOS_TEXTO.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) o[id] = el.value;
        });
        o.ferimento1 = document.getElementById('ferimento1').checked;
        o.ferimento2 = document.getElementById('ferimento2').checked;
        o.ferimento3 = document.getElementById('ferimento3').checked;
        return o;
    }

    function applyData(p) {
        CAMPOS_TEXTO.forEach(function (k) {
            var el = document.getElementById(k);
            if (el && p[k] != null) el.value = String(p[k]);
        });
        ['ferimento1', 'ferimento2', 'ferimento3'].forEach(function (k) {
            var el = document.getElementById(k);
            if (el) el.checked = !!p[k];
        });
        syncPoster();
    }

    /* ── localStorage ─────────────────────────────────────── */
    function saveToStorage() {
        try { localStorage.setItem(LS_KEY, JSON.stringify(collectData())); } catch (e) {}
    }

    function loadFromStorage() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (!raw) return false;
            applyData(JSON.parse(raw));
            return true;
        } catch (e) { return false; }
    }

    /* ── listeners do formulário ──────────────────────────── */
    nomeEl.addEventListener('input',  function () { syncPoster(); saveToStorage(); });
    nivelEl.addEventListener('input', function () { syncPoster(); saveToStorage(); });
    form.addEventListener('input',    saveToStorage);
    form.addEventListener('change',   saveToStorage);

    fotoInput.addEventListener('change', function () {
        var f = this.files && this.files[0];
        if (!f || !f.type.startsWith('image/')) {
            wantedImg.hidden = true;
            wantedPlaceholder.hidden = false;
            wantedImg.removeAttribute('src');
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            wantedImg.src = e.target.result;
            wantedImg.hidden = false;
            wantedPlaceholder.hidden = true;
        };
        reader.readAsDataURL(f);
    });

    syncPoster();
    loadFromStorage();

    /* ══════════════════════════════════════════════════════
       FIREBASE / NUVEM
    ══════════════════════════════════════════════════════ */

    var fbAuth = null;
    var fbDb   = null;
    var fbUser = null;
    var saveTimer = null;

    function isConfigured() {
        return window.FIREBASE_CONFIG &&
               window.FIREBASE_CONFIG.apiKey !== 'COLE_AQUI';
    }

    function setCloudStatus(msg, autoOk) {
        var el = document.getElementById('cloudStatus');
        if (!el) return;
        el.textContent = msg;
        if (autoOk) {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(function () { el.textContent = ''; }, 3500);
        }
    }

    function updateNavAuthLink(user) {
        var link = document.getElementById('navAuthLink');
        if (!link) return;
        if (user) {
            link.textContent = 'Sair';
            link.href = '#';
            link.onclick = function (e) { e.preventDefault(); sairDaConta(); };
        } else {
            link.textContent = 'Entrar';
            link.href = 'login.html';
            link.onclick = null;
        }
    }

    function updateAuthUI(user) {
        var banner = document.getElementById('cloudBanner');
        var panel  = document.getElementById('cloudPanel');
        var emailEl = document.getElementById('cloudUserEmail');
        if (!banner || !panel) return;
        if (user) {
            banner.hidden = true;
            panel.hidden  = false;
            if (emailEl) emailEl.textContent = user.email;
        } else {
            banner.hidden = false;
            panel.hidden  = true;
        }
        updateNavAuthLink(user);
    }

    function loadFromCloud(uid) {
        if (!fbDb) return;
        setCloudStatus('Carregando da nuvem…');
        fbDb.collection('fichas').doc(uid).get()
            .then(function (doc) {
                if (doc.exists) {
                    applyData(doc.data());
                    saveToStorage();
                    setCloudStatus('✔ Ficha carregada da nuvem.', true);
                } else {
                    setCloudStatus('');
                }
            })
            .catch(function (e) {
                setCloudStatus('Erro ao carregar: ' + e.message);
            });
    }

    /* exposta para o botão "Salvar na nuvem" */
    window.salvarNaNuvem = function () {
        if (!fbDb || !fbUser) {
            setCloudStatus('Você precisa estar logado para salvar na nuvem.');
            return;
        }
        var data = collectData();
        data.email     = fbUser.email;
        data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        setCloudStatus('Salvando…');
        fbDb.collection('fichas').doc(fbUser.uid).set(data)
            .then(function () { setCloudStatus('✔ Ficha salva na nuvem!', true); })
            .catch(function (e) { setCloudStatus('Erro ao salvar: ' + e.message); });
    };

    /* exposta para o botão "Carregar da nuvem" */
    window.carregarDaNuvem = function () {
        if (!fbDb || !fbUser) return;
        if (!confirm('Carregar da nuvem vai sobrescrever os dados locais. Continuar?')) return;
        loadFromCloud(fbUser.uid);
    };

    /* exposta para o botão "Sair" */
    window.sairDaConta = function () {
        if (fbAuth) {
            fbAuth.signOut().then(function () {
                window.location.href = 'login.html';
            });
        }
    };

    function initFirebase() {
        if (!isConfigured()) {
            updateAuthUI(null);
            return;
        }
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(window.FIREBASE_CONFIG);
            }
            fbAuth = firebase.auth();
            fbDb   = firebase.firestore();

            fbAuth.onAuthStateChanged(function (user) {
                fbUser = user;
                updateAuthUI(user);
                if (user) {
                    loadFromCloud(user.uid);
                }
            });
        } catch (e) {
            console.warn('Firebase não pôde ser inicializado:', e.message);
            updateAuthUI(null);
        }
    }

    initFirebase();

})();

/* ── exportar ficha em .txt ───────────────────────────────── */
function exportarFicha() {
    var nome     = document.getElementById('nome').value     || 'Sem_Nome';
    var nivel    = document.getElementById('nivel').value    || '0';
    var arquetipo = document.getElementById('arquetipo').value;
    var aparencia = document.getElementById('aparencia').value || 'Nenhuma descrição.';
    var carne    = document.getElementById('carne').value;
    var polvora  = document.getElementById('polvora').value;
    var deserto  = document.getElementById('deserto').value;
    var alma     = document.getElementById('alma').value;
    var sombra   = document.getElementById('sombra').value;
    var f1 = document.getElementById('ferimento1').checked ? '[X]' : '[ ]';
    var f2 = document.getElementById('ferimento2').checked ? '[X]' : '[ ]';
    var f3 = document.getElementById('ferimento3').checked ? '[X]' : '[ ]';
    var hab      = document.getElementById('aparencia_hab').value || 'Nenhuma habilidade descrita.';
    var arma1    = document.getElementById('arma1').value    || 'Desarmado';
    var municao  = document.getElementById('municao').value;
    var arma2    = document.getElementById('arma2').value    || 'Nenhuma';
    var agua     = document.getElementById('agua').value;
    var provisoes = document.getElementById('provisoes').value || 'Nenhuma provisão.';

    var txt =
        '\n=========================================\n' +
        '      FICHA DE PERSONAGEM: PÓ E SANGUE\n' +
        '=========================================\n\n' +
        'NOME/ALCUNHA: ' + nome + '\n' +
        'NÍVEL (RECOMPENSA NO CARTAZ): ' + nivel + '\n' +
        'ARQUÉTIPO: ' + arquetipo + '\n\n' +
        'APARÊNCIA E CICATRIZES:\n' + aparencia + '\n\n' +
        '--- ATRIBUTOS ---------------------------\n' +
        'CARNE:   ' + carne   + '\n' +
        'PÓLVORA: ' + polvora + '\n' +
        'DESERTO: ' + deserto + '\n' +
        'ALMA:    ' + alma    + '\n\n' +
        '--- A SOMBRA ----------------------------\n' +
        'Nível Atual: [ ' + sombra + ' ] / 6\n\n' +
        '--- FERIMENTOS --------------------------\n' +
        f1 + ' 1º Ferimento: Sangrando\n' +
        f2 + ' 2º Ferimento: Debilitado\n' +
        f3 + ' 3º Ferimento: Morte\n\n' +
        '--- HABILIDADE DO ARQUÉTIPO -------------\n' + hab + '\n\n' +
        '--- INVENTÁRIO --------------------------\n' +
        'Arma Principal: ' + arma1 + '\n' +
        'Munição Restante: ' + municao + ' balas/cargas\n' +
        'Arma Secundária: ' + arma2 + '\n' +
        'Status da Água: ' + agua + '\n\n' +
        'Provisões e Pertences:\n' + provisoes + '\n' +
        '=========================================\n' +
        '"A guerra é deus."\n';

    var blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href     = url;
    link.download = 'Ficha_PoeSangue_' + nome.replace(/\s+/g, '_') + '.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
