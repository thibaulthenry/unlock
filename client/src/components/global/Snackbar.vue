<template>
  <v-snackbar
    :value="snackbar.show"
    :color="snackbar.color"
    :timeout="6000"
    bottom
    right
    @input="hide(snackbar)"
  >
    <v-row class="d-flex align-baseline">
      <span class="ml-3">{{ snackbar.message }}</span>
      <v-spacer />
      <v-btn text @click="hide(snackbar)">
        Fermer
      </v-btn>
    </v-row>
  </v-snackbar>
</template>

<script>
export default {
  computed: {
    snackbar () {
      return this.$store.state.snackbar
    }
  },

  methods: {
    hide (value) {
      this.$store.dispatch('hideNotification', value)
    }
  }
}
</script>

<style scoped>
::v-deep .v-snack__content {
  padding: 8px 12px !important;
}
</style>
