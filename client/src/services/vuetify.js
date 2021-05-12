import Vue from 'vue'
import Vuetify from 'vuetify'
import fr from 'vuetify/es5/locale/fr'
import en from 'vuetify/es5/locale/en'
import 'vuetify/dist/vuetify.min.css'
import '@mdi/font/css/materialdesignicons.css'

Vue.use(Vuetify)

export default new Vuetify({
    icons: {
        iconfont: 'mdiSvg',
    },
    lang: {
        locales: { fr, en },
        current: 'fr'
    }
})
