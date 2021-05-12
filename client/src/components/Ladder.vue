<template>
  <v-card
      height="100%"
      raised
      rounded
      dark
  >
    <v-card-title>
      {{ $t('settings.ladder') }}
      <span
          v-if="lobby"
          class="overline ml-auto"
      >
        [{{ lobby.getPlayers().length }} / {{ lobby.capacity }}]
      </span>
    </v-card-title>

    <v-divider class="ml-3 mr-3"/>

    <v-card-text class="pl-0 pr-0" style="height: 100%">
      <v-list style="height: 100%; overflow-y: auto">
        <v-list-item class="ml-5 mr-5" v-for="player in lobby.getPlayers()" :key="player.uuid">
          <v-list-item-content>
            <v-list-item-title
                class="d-flex align-center"
                :class="{
                  'amber--text': $store.state.client && player.uuid === $store.state.client.uuid
                }"
            >
              <div
                  style="width:10px;height:10px;border:1px solid #000;margin-right: 20px"
                  :style="{ 'background-color': spriteColorCodes[player.spriteColor].web }"
              />

              {{ player.name || player.uuid.substring(0, 20) }}
            </v-list-item-title>
          </v-list-item-content>

          <v-list-item-icon class="ml-0 mr-0">
            <span class="mr-1">{{ player.points }}</span>

            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-icon
                    color="white"
                    v-bind="attrs"
                    v-on="on"
                >
                  mdi-key-variant
                </v-icon>
              </template>
              {{ $t('settings.points') }}
            </v-tooltip>
          </v-list-item-icon>

          <v-divider
              v-if="lobby.owner === player.uuid"
              class="ml-2 mr-2 mt-3 mb-3"
              inset
              vertical
          />

          <v-list-item-icon
              v-if="lobby.owner === player.uuid"
              class="ml-0 mr-0"
          >
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-icon
                    :color="'#febf04'"
                    v-bind="attrs"
                    v-on="on"
                >
                  mdi-crown
                </v-icon>
              </template>
              {{ $t('settings.owner') }}
            </v-tooltip>
          </v-list-item-icon>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import SpriteColorCodes from '../constants/sprite-color-codes'

export default {
  data: () => {
    return {
      players: [],
      spriteColorCodes: SpriteColorCodes
    }
  },

  computed: {
    lobby() {
      return this.$store.state.lobby
    }
  },
}
</script>

<style scoped>
.v-card-text {
  height: 100%
}

.v-list {
  height: 100%;
  overflow-y: auto;
}
</style>
