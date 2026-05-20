import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { fr, en } from 'vuetify/locale'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export default createVuetify({
    components,
    directives,
    locale: {
        locales: { fr, en },
        current: 'fr'
    },
    theme: {
        defaultTheme: 'light'
    }
})
