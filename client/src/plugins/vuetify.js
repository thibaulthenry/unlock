import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { fr, en } from 'vuetify/locale'

// Palette "Tombeau d'Unlock" : ciel crépusculaire pourpre, grès chaud,
// or martelé. Cohérente avec les radiants du logo (#bb8600 → #febf04).
const dungeonTheme = {
  dark: true,
  colors: {
    background:    '#1c0e2a',
    surface:       '#2a1d12',
    'surface-bright': '#3a2818',
    primary:       '#febf04',
    'primary-darken-1': '#a37c08',
    secondary:     '#c4622d',
    accent:        '#c4a06b',
    info:          '#7bb3ca',
    success:       '#5fa663',
    warning:       '#e69b2c',
    error:         '#d94c2e',
    'on-background': '#f4e8d0',
    'on-surface':    '#f4e8d0',
    'on-primary':    '#1c0e2a',
    'on-secondary':  '#f4e8d0',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'dungeon',
    themes: { dungeon: dungeonTheme },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  locale: {
    locale: 'fr',
    fallback: 'en',
    messages: { fr, en },
  },
})
