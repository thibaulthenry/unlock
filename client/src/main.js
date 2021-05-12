import Vue from 'vue'
import FlagIcon from 'vue-flag-icon'
import lodash from 'lodash'
import router from './services/router'
import firestore from './services/firestore'
import store from './services/store'
import vuetify from './services/vuetify'
import i18n from './services/i18n'
import App from './App.vue'

Vue.use(FlagIcon)

Vue.config.productionTip = false

Vue.prototype.$document = document
Vue.prototype.$window = window
Vue.prototype.$_ = lodash
Vue.prototype.$fire = firestore

new Vue({
  router: router,
  store: store,
  vuetify: vuetify,
  i18n: i18n,
  render: h => h(App),
}).$mount('#app')
