import firebase from 'firebase/app'
import 'firebase/firestore'
import Vue from 'vue'
import VueFirestore from 'vue-firestore'

Vue.use(VueFirestore)

firebase.initializeApp({
    apiKey: 'AIzaSyBlZ4GO2mbBI5ig2Qig1aD_w9-n3lFM3Fw',
    authDomain: 'unlock-db.firebaseapp.com',
    projectId: 'unlock-db',
    storageBucket: 'unlock-db.appspot.com',
    messagingSenderId: '573371100077',
    appId: '1:573371100077:web:fa0a2f8459329c47fb4f24',
})

export default firebase.firestore()
