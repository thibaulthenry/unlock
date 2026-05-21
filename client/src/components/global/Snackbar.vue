<template>
  <v-snackbar
      v-model="show"
      :color="snackbar.color"
      :timeout="6000"
      location="bottom right"
  >
    <v-row class="d-flex align-baseline ma-0">
      <span class="ml-3">{{ snackbar.message }}</span>
      <v-spacer/>
      <v-btn variant="text" @click="hide(snackbar)">Fermer</v-btn>
    </v-row>
  </v-snackbar>
</template>

<script>
export default {
  computed: {
    snackbar() { return this.$store.state.snackbar },
    show: {
      get() { return this.$store.state.snackbar.show },
      set(value) {
        if (!value) this.$store.dispatch('hideNotification', this.$store.state.snackbar)
      },
    },
  },

  methods: {
    hide(value) { this.$store.dispatch('hideNotification', value) },
  },
}
</script>

<style scoped>
:deep(.v-snackbar__content) {
  padding: 8px 12px !important;
}
</style>
