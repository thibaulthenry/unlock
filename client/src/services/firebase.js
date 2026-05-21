import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

export const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBlZ4GO2mbBI5ig2Qig1aD_w9-n3lFM3Fw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'unlock-db.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'unlock-db',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'unlock-db.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '573371100077',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:573371100077:web:fa0a2f8459329c47fb4f24',
})

export const firestore = getFirestore(firebaseApp)
export default firestore
