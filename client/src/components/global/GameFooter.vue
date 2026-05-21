<template>
  <v-footer
      color="grey-darken-2"
      :height="minimized ? '62px' : '200px'"
  >
    <v-row no-gutters class="pa-2">
      <Mouse
          v-if="!$vuetify.display.mobile"
          style="width: 220px; opacity: 1; transition: opacity 1s"
          :class="minimized ? 'inputs-hidden' : undefined"
      />

      <v-spacer/>

      <Display/>

      <v-spacer/>

      <Keyboard
          v-if="!$vuetify.display.mobile"
          style="width: 220px; opacity: 1; transition: opacity 1s"
          :class="minimized ? 'inputs-hidden' : undefined"
      />
    </v-row>
  </v-footer>
</template>

<script>
import Keyboard from '@/components/Keyboard.vue'
import Mouse from '@/components/Mouse.vue'
import Display from '@/components/Display.vue'

export default {
  components: { Display, Keyboard, Mouse },

  computed: {
    minimized() { return this.$store.state.footerMinimized },
  },
}
</script>

<style scoped>
.v-footer {
  overflow-y: hidden;
  transition: height 1s;
}

.inputs-hidden {
  opacity: 0 !important;
}
</style>
