import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

const configured = Object.values(firebaseConfig).every(v => v && v !== 'COLE_AQUI')

export let auth = null
export let isFirebaseConfigured = false

let _app = null

if (configured) {
  try {
    _app = initializeApp(firebaseConfig)
    auth = getAuth(_app)
    isFirebaseConfigured = true
  } catch (e) {
    console.warn('Firebase: falha na inicialização —', e.message)
  }
}

/* ── Firestore carregado sob demanda (lazy) ──────────────────
   O chunk de 284 kB só é baixado na primeira vez que uma página
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

// Compat síncrono para código que já verifica `if (!db)` —
// será null até a primeira chamada de getDb() resolver.
export { _db as db }
