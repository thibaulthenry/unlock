<template>
  <v-form v-model="validForm">
    <v-col>
      <v-row class="ma-0 mt-5">
        <v-text-field
            ref="clientNameField"
            v-model="clientName"
            :rules="[value => !!value || $t('errors.required')]"
            :label="$t('settings.name')"
            maxlength="20"
            counter="20"
            clearable
            variant="outlined"
            rounded
            theme="dungeon"
            color="primary"
        />
      </v-row>

      <v-row class="d-flex flex-column ma-0 mt-8">
        <v-slider
            v-model="lobbyCapacity"
            class="dungeon-slider"
            show-ticks="always"
            thumb-label="always"
            thumb-size="30"
            color="primary"
            :min="2"
            :max="10"
            :step="1"
            theme="dungeon"
            hide-details
        />
        <span class="dungeon-subtitle text-caption ml-2">
          {{ $t('buttons.lobby.capacity') }}
        </span>
      </v-row>

      <v-row class="d-flex flex-column ma-0 mt-15">
        <v-slider
            v-model="lobbyPointsGoal"
            class="dungeon-slider"
            show-ticks="always"
            thumb-label="always"
            thumb-size="30"
            color="primary"
            :min="2"
            :max="20"
            :step="1"
            theme="dungeon"
            hide-details
        />
        <span class="dungeon-subtitle text-caption ml-2">
          {{ $t('buttons.lobby.pointsGoal') }}
        </span>
      </v-row>
    </v-col>
  </v-form>
</template>

<script>
export default {
  data: () => ({
    validForm: false,
  }),

  computed: {
    clientName: {
      get() { return this.$store.state.client?.name },
      set(value) { this.$store.commit('SET_CLIENT', { client: { ...this.$store.state.client, name: value } }) },
    },

    lobbyCapacity: {
      get() {
        if (!this.$store.state.lobby?.capacity) {
          this.$store.commit('SET_LOBBY_CAPACITY', { lobbyCapacity: 5 })
        }
        return this.$store.state.lobby?.capacity
      },
      set(value) { this.$store.commit('SET_LOBBY_CAPACITY', { lobbyCapacity: value }) },
    },

    lobbyPointsGoal: {
      get() {
        if (!this.$store.state.lobby?.pointsGoal) {
          this.$store.commit('SET_LOBBY_POINTS_GOAL', { lobbyPointsGoal: 5 })
        }
        return this.$store.state.lobby?.pointsGoal
      },
      set(value) { this.$store.commit('SET_LOBBY_POINTS_GOAL', { lobbyPointsGoal: value }) },
    },
  },
}
</script>

<style scoped>
:deep(.v-slider__thumb-label) {
  font-size: 0.9rem;
}
</style>
