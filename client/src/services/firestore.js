import firebase from 'firebase/app'
import 'firebase/firestore'
import Vue from 'vue'
import VueFirestore from 'vue-firestore'

Vue.use(VueFirestore)

firebase.initializeApp({
    apiKey: process.env.VUE_APP_FIREBASE_API_KEY || 'AIzaSyBlZ4GO2mbBI5ig2Qig1aD_w9-n3lFM3Fw',
    authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN || 'unlock-db.firebaseapp.com',
    projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID || 'unlock-db',
    storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET || 'unlock-db.appspot.com',
    messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID || '573371100077',
    appId: process.env.VUE_APP_FIREBASE_APP_ID || '1:573371100077:web:fa0a2f8459329c47fb4f24',
})

export default firebase.firestore()
