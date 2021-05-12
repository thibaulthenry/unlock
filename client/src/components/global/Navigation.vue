<template>
  <v-app-bar
      fixed
      app
      color="grey darken-2"
      height="64px"
      style="z-index: 8"
  >
    <v-row style="height: 100%" class="d-flex justify-center align-center">
      <img src="../../assets/images/logo.svg" alt="logo" height="100%"/>

      <LanguageSwitcher style="position: absolute; right: 0" class="mr-2"/>
    </v-row>

  </v-app-bar>
</template>

<script>
import LanguageSwitcher from './LanguageSwitcher'

export default {
  components: {LanguageSwitcher}
}
</script>
