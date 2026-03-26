// =============================================================
// CONFIGURAÇÃO DO FIREBASE — Pó e Sangue
// =============================================================
// PASSO A PASSO:
// 1. Acesse https://console.firebase.google.com
// 2. Crie um projeto (ex: "po-e-sangue")
// 3. Configurações do projeto (⚙) → "Seus apps" → ícone Web (</>)
//    Registre o app; copie o bloco firebaseConfig abaixo
// 4. No console: Authentication → Sign-in method → Email/senha → Ativar
// 5. No console: Firestore Database → Criar banco → Modo produção
// 6. No console: Firestore → Regras → cole o conteúdo de firestore.rules
// 7. Substitua "ADMIN_EMAIL" pelo seu e-mail de mestre (DEVE ser igual
//    ao e-mail cadastrado no Authentication e nas regras do Firestore)
// =============================================================

window.FIREBASE_CONFIG = {
    apiKey:            "COLE_AQUI",
    authDomain:        "COLE_AQUI",
    projectId:         "COLE_AQUI",
    storageBucket:     "COLE_AQUI",
    messagingSenderId: "COLE_AQUI",
    appId:             "COLE_AQUI"
};

// E-mail do mestre/admin — deve ser idêntico ao da regra no Firestore
window.ADMIN_EMAIL = "mestre@seudominio.com";
