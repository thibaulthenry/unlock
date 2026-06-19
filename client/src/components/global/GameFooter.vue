<template>
  <v-footer
      class="dungeon-footer"
      :height="minimized ? '62px' : '200px'"
  >
    <v-row no-gutters class="pa-2 flex-nowrap align-center">
      <Mouse
          v-if="!$vuetify.display.mobile"
          class="footer-input"
          :class="minimized ? 'inputs-hidden' : undefined"
      />

      <v-spacer/>

      <Display/>

      <v-spacer/>

      <Keyboard
          v-if="!$vuetify.display.mobile"
          class="footer-input"
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

/* Largeur fluide pour les indicateurs Mouse/Keyboard : 220 px sur grand
 * écran, mais on shrink jusqu'à 140 px en sm/md pour ne pas écraser la
 * carte Display centrale (qui prend 50 % de la largeur). */
.footer-input {
  width: clamp(140px, 18vw, 220px);
  opacity: 1;
  transition: opacity 1s;
  flex-shrink: 0;
}
</style>
