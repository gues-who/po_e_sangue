import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
export let db   = null
export let isFirebaseConfigured = false

if (configured) {
  try {
    const app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db   = getFirestore(app)
    isFirebaseConfigured = true
  } catch (e) {
    console.warn('Firebase: falha na inicialização —', e.message)
  }
}
