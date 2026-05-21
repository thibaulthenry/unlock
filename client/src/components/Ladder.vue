<template>
  <v-card height="100%" elevation="4" rounded theme="dark">
    <v-card-title>
      {{ $t('settings.ladder') }}
      <span v-if="lobby" class="text-overline ml-auto">
        <v-tooltip location="right">
          <template #activator="{ props }">
            <span v-bind="props">
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
        <v-list-item
            v-for="player in lobby.getPlayers()"
            :key="player.uuid"
            class="ml-5 mr-5"
        >
          <div class="d-flex align-center">
            <div
                class="d-flex align-center"
                style="flex: 1"
                :class="{ 'text-amber': $store.state.client && player.uuid === $store.state.client.uuid }"
            >
              <div
                  style="width:10px;height:10px;border:1px solid #000;margin-right: 20px"
                  :style="{ 'background-color': spriteColorCodes[player.spriteColor].web }"
              />
              <div style="max-width: 120px; text-overflow: ellipsis; overflow-x: hidden">
                {{ player.name || player.uuid.substring(0, 20) }}
              </div>
            </div>

            <div v-if="showPreviousWinners(player.uuid)" class="d-flex align-center ml-2">
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-icon color="green" v-bind="props">mdi-numeric-positive-1</v-icon>
                </template>
                {{ $t('settings.winner') }}
              </v-tooltip>
              <v-divider class="ml-2 mr-2" inset vertical/>
            </div>

            <div class="d-flex align-center ml-2">
              <span class="mr-1">{{ player.points }}</span>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-icon color="white" v-bind="props">mdi-key-variant</v-icon>
                </template>
                {{ $t('settings.points') }}
              </v-tooltip>
            </div>

            <div v-if="lobby.owner === player.uuid" class="d-flex align-center ml-2">
              <v-divider class="mr-2" inset vertical/>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-icon color="#febf04" v-bind="props">mdi-crown</v-icon>
                </template>
                {{ $t('settings.owner') }}
              </v-tooltip>
            </div>
          </div>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import GameStates from '@/constants/game-states'
import LobbyStates from '@/constants/lobby-states'
import SpriteColorCodes from '@/constants/sprite-color-codes'
import store from '@/services/store'

export default {
  data: () => ({
    players: [],
    spriteColorCodes: SpriteColorCodes,
  }),

  computed: {
    game() { return this.$store.state.game },
    lobby() { return this.$store.state.lobby },
  },

  methods: {
    showPreviousWinners(uuid) {
      return this.lobby && this.lobby.state === LobbyStates.STARTED
        && this.game && this.game.state === GameStates.STARTING
        && !!store.state.previousWinners[uuid]
    },
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
