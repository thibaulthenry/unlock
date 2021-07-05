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
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <span
                v-bind="attrs"
                v-on="on"
            >
              [{{ lobby.getPlayers().length }} / {{ lobby.capacity }}]
            </span>
          </template>
          {{ $t('settings.capacity') }}
        </v-tooltip>
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

              <div
                  style="max-width: 120px; text-overflow: ellipsis; overflow-x: hidden"
              >
                {{ player.name || player.uuid.substring(0, 20) }}
              </div>
            </v-list-item-title>
          </v-list-item-content>

          <v-list-item-icon
              v-if="showPreviousWinners(player.uuid)"
              class="ml-0 mr-0"
          >
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-icon
                    color="green"
                    v-bind="attrs"
                    v-on="on"
                >
                  mdi-numeric-positive-1
                </v-icon>
              </template>
              {{ $t('settings.winner') }}
            </v-tooltip>
          </v-list-item-icon>

          <v-divider
              v-if="showPreviousWinners(player.uuid)"
              class="ml-2 mr-2 mt-3 mb-3"
              inset
              vertical
          />

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
import GameStates from '../constants/game-states'
import LobbyStates from '../constants/lobby-states'
import SpriteColorCodes from '../constants/sprite-color-codes'
import store from '../services/store';

export default {
  data: () => {
    return {
      players: [],
      spriteColorCodes: SpriteColorCodes
    }
  },

  computed: {
    game() {
      return this.$store.state.game
    },

    lobby() {
      return this.$store.state.lobby
    }
  },

  methods: {
    showPreviousWinners(uuid) {
      return this.lobby && this.lobby.state === LobbyStates.STARTED
          && this.game && this.game.state === GameStates.STARTING
          && !!store.state.previousWinners[uuid]
    }
  }
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
