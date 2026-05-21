import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueFire, VueFireFirestoreOptionsAPI } from 'vuefire'
import FlagIcon from 'vue-flag-icon'
import * as lodash from 'lodash-es'
import App from './App.vue'
import router from './services/router'
import { firebaseApp, firestore } from './services/firebase'
import storeAdapter from './services/store'
import vuetify from './plugins/vuetify'
import i18n from './services/i18n'

const app = createApp(App)

app.use(createPinia())
app.use(VueFire, {
  firebaseApp,
  modules: [VueFireFirestoreOptionsAPI()],
})
app.use(router)
app.use(vuetify)
app.use(i18n)
app.use(FlagIcon)

app.config.globalProperties.$document = document
app.config.globalProperties.$window = window
app.config.globalProperties.$_ = lodash
app.config.globalProperties.$fire = firestore
app.config.globalProperties.$store = storeAdapter

app.mount('#app')

if (import.meta.env.DEV) {
  window.$store = storeAdapter
}
