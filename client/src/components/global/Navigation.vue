<template>
  <v-app-bar
      color="grey-darken-2"
      :height="$vuetify.display.xs ? 56 : 64"
      style="z-index: 8"
  >
    <v-row style="height: 100%" class="d-flex justify-center align-center ma-0 flex-nowrap">
      <img :src="logo" alt="logo" class="navigation-logo"/>
      <LanguageSwitcher style="position: absolute; right: 0" class="mr-2"/>
    </v-row>
  </v-app-bar>
</template>

<script>
import LanguageSwitcher from './LanguageSwitcher.vue'
import logo from '@/assets/images/logo.svg'

export default {
  components: { LanguageSwitcher },
  data: () => ({ logo }),
}
</script>

<style scoped>
/* Logo : hauteur fluide proportionnelle à la navbar, sans casser le ratio
 * SVG, et bornée pour éviter le débordement sur tablette en paysage. */
.navigation-logo {
  height: 100%;
  max-height: 100%;
  width: auto;
  max-width: 70vw;
  object-fit: contain;
}
</style>
