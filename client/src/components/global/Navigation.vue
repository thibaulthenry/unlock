<template>
  <v-app-bar
      color="grey-darken-2"
      height="64"
      style="z-index: 8"
  >
    <v-row style="height: 100%" class="d-flex justify-center align-center ma-0">
      <img :src="logo" alt="logo" height="100%"/>
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
