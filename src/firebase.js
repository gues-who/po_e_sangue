import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Configuração do projeto Firebase (poesangue).
// Valores de app web são públicos por design — a segurança
// é garantida pelas Firestore Security Rules, não pelo config.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyAn_zXoJig_fvN_T3MABw9WKXL980q5M08',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'poesangue.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'poesangue',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'poesangue.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '888361241051',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:888361241051:web:e17777273335aff8567ffe',
}

export const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || 'jhophjm@gmail.com'

export let auth = null
export let isFirebaseConfigured = false

let _app = null

try {
  _app = initializeApp(firebaseConfig)
  auth = getAuth(_app)
  isFirebaseConfigured = true
} catch (e) {
  console.warn('Firebase: falha na inicialização —', e.message)
}

/* ── Firestore carregado sob demanda (lazy) ──────────────────
   O chunk de 284 kB só é baixado quando uma página
   realmente precisa do banco de dados.
──────────────────────────────────────────────────────────── */
let _db = null
let _dbReady = false

export async function getDb() {
  if (!isFirebaseConfigured) return null
  if (_dbReady) return _db
  const { getFirestore } = await import('firebase/firestore')
  _db = getFirestore(_app)
  _dbReady = true
  return _db
}

export { _db as db }
