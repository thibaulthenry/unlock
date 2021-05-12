<template>
  <v-footer color="grey darken-2">
    <v-row
        no-gutters
        class="pa-2"
    >
      <Mouse
          v-if="!$vuetify.breakpoint.mobile"
          style="width: 220px"
      />

      <v-spacer/>

      <Display/>

      <v-spacer/>

      <Keyboard
          v-if="!$vuetify.breakpoint.mobile"
          style="width: 220px"
      />
    </v-row>
  </v-footer>
</template>

<script>
import Keyboard from '../Keyboard'
import Mouse from '../Mouse'
import Display from '../Display'

export default {
  components: {Display, Keyboard, Mouse}
}
</script>

<style scoped>

</style>
