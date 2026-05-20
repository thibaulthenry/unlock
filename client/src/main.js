import { createApp } from 'vue'
import App from './App.vue'
import router from './services/router'
import store from './services/store'
import vuetify from './services/vuetify'
import i18n from './services/i18n'
import lodash from 'lodash'

const app = createApp(App)

app.config.globalProperties.$_ = lodash
app.config.globalProperties.$window = window
app.config.globalProperties.$document = document

app.use(router)
app.use(store)
app.use(vuetify)
app.use(i18n)

app.mount('#app')
