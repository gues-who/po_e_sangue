(function () {
    'use strict';

    var LS_KEY = 'poesangue_ficha_v1';

    var nomeEl = document.getElementById('nome');
    var nivelEl = document.getElementById('nivel');
    var fotoInput = document.getElementById('fotoPlayer');
    var wantedImg = document.getElementById('wantedImg');
    var wantedPlaceholder = document.getElementById('wantedPlaceholder');
    var wantedNameDisplay = document.getElementById('wantedNameDisplay');
    var wantedRewardDisplay = document.getElementById('wantedRewardDisplay');
    var form = document.getElementById('fichaForm');

    function syncPoster() {
        var n = (nomeEl.value || '').trim();
        wantedNameDisplay.textContent = n || '— Sem nome —';
        var nv = parseInt(nivelEl.value, 10);
        wantedRewardDisplay.textContent = '$ ' + (Number.isFinite(nv) ? nv : 0);
    }

    function collectData() {
        var ids = [
            'nome', 'nivel', 'carne', 'polvora', 'deserto', 'alma', 'sombra', 'arquetipo',
            'aparencia', 'municao', 'arma1', 'arma2', 'agua', 'provisoes', 'aparencia_hab'
        ];
        var o = {};
        ids.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) o[id] = el.value;
        });
        o.ferimento1 = document.getElementById('ferimento1').checked;
        o.ferimento2 = document.getElementById('ferimento2').checked;
        o.ferimento3 = document.getElementById('ferimento3').checked;
        return o;
    }

    function saveToStorage() {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(collectData()));
        } catch (e) {}
    }

    function loadFromStorage() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            var p = JSON.parse(raw);
            Object.keys(p).forEach(function (k) {
                var el = document.getElementById(k);
                if (!el) return;
                if (el.type === 'checkbox') {
                    el.checked = !!p[k];
                } else {
                    el.value = p[k] != null ? String(p[k]) : '';
                }
            });
        } catch (e) {}
        syncPoster();
    }

    nomeEl.addEventListener('input', function () {
        syncPoster();
        saveToStorage();
    });
    nivelEl.addEventListener('input', function () {
        syncPoster();
        saveToStorage();
    });

    form.addEventListener('input', saveToStorage);
    form.addEventListener('change', saveToStorage);

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
})();

function exportarFicha() {
    var nome = document.getElementById('nome').value || 'Sem_Nome';
    var nivel = document.getElementById('nivel').value || '0';
    var arquetipo = document.getElementById('arquetipo').value;
    var aparencia = document.getElementById('aparencia').value || 'Nenhuma descrição.';

    var carne = document.getElementById('carne').value;
    var polvora = document.getElementById('polvora').value;
    var deserto = document.getElementById('deserto').value;
    var alma = document.getElementById('alma').value;

    var sombra = document.getElementById('sombra').value;

    var f1 = document.getElementById('ferimento1').checked ? '[X]' : '[ ]';
    var f2 = document.getElementById('ferimento2').checked ? '[X]' : '[ ]';
    var f3 = document.getElementById('ferimento3').checked ? '[X]' : '[ ]';

    var hab = document.getElementById('aparencia_hab').value || 'Nenhuma habilidade descrita.';

    var arma1 = document.getElementById('arma1').value || 'Desarmado';
    var municao = document.getElementById('municao').value;
    var arma2 = document.getElementById('arma2').value || 'Nenhuma';
    var agua = document.getElementById('agua').value;
    var provisoes = document.getElementById('provisoes').value || 'Nenhuma provisão.';

    var textoExportacao =
        '\n=========================================\n' +
        '      FICHA DE PERSONAGEM: PÓ E SANGUE\n' +
        '=========================================\n\n' +
        'NOME/ALCUNHA: ' + nome + '\n' +
        'NÍVEL (RECOMPENSA NO CARTAZ): ' + nivel + '\n' +
        'ARQUÉTIPO: ' + arquetipo + '\n\n' +
        'APARÊNCIA E CICATRIZES:\n' +
        aparencia + '\n\n' +
        '--- ATRIBUTOS ---------------------------\n' +
        'CARNE:   ' + carne + '\n' +
        'PÓLVORA: ' + polvora + '\n' +
        'DESERTO: ' + deserto + '\n' +
        'ALMA:    ' + alma + '\n\n' +
        '--- A SOMBRA ----------------------------\n' +
        'Nível Atual: [ ' + sombra + ' ] / 6\n\n' +
        '--- FERIMENTOS --------------------------\n' +
        f1 + ' 1º Ferimento: Sangrando\n' +
        f2 + ' 2º Ferimento: Debilitado\n' +
        f3 + ' 3º Ferimento: Morte\n\n' +
        '--- HABILIDADE DO ARQUÉTIPO -------------\n' +
        hab + '\n\n' +
        '--- INVENTÁRIO --------------------------\n' +
        'Arma Principal: ' + arma1 + '\n' +
        'Munição Restante: ' + municao + ' balas/cargas\n' +
        'Arma Secundária: ' + arma2 + '\n' +
        'Status da Água: ' + agua + '\n\n' +
        'Provisões e Pertences:\n' +
        provisoes + '\n' +
        '=========================================\n' +
        '"A guerra é deus."\n';

    var blob = new Blob([textoExportacao], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);

    var link = document.createElement('a');
    link.href = url;
    link.download = 'Ficha_PoeSangue_' + nome.replace(/\s+/g, '_') + '.txt';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
