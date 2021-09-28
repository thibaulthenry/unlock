<template>
  <v-container fluid fill-height class="pa-0">
    <v-row class="d-flex justify-center">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <v-form ref="form" v-model="validForm" @submit.prevent="">
          <v-row class="d-flex justify-center ma-0">
            <v-carousel
                class="carousel"
                height="350px"
                hide-delimiters
                show-arrows-on-hover
                cycle
            >
              <v-carousel-item
                  v-for="(item,i) in items"
                  :key="i"
                  :src="item.src"
              />
            </v-carousel>
          </v-row>

          <v-row justify="center" class="pa-0">
            <v-col cols="12" md="8">
              <v-btn
                  :loading="loadingJoin"
                  :color="'#BB8600'"
                  small
                  block
                  dark
                  type="submit"
                  @click="join"
                  @submit="join"
              >
                {{ $t('buttons.lobby.join') }}
              </v-btn>
            </v-col>

            <!-- <v-col cols="12" md="5">-->
            <!--   <v-btn-->
            <!--       :loading="loadingSpectate"-->
            <!--       :color="'#BB8600'"-->
            <!--       block-->
            <!--       dark-->
            <!--       disabled-->
            <!--       @click="spectate"-->
            <!--   >-->
            <!--     {{ $t('buttons.lobby.spectate') }}-->
            <!--   </v-btn>-->
            <!-- </v-col>-->
          </v-row>

          <v-row class="d-flex justify-center">
            <v-col cols="12" md="8" class="pb-0">
              <v-text-field
                  v-model="lobbyCode"
                  :label="$t('buttons.lobby.code')"
                  :rules="[value => !!value || $t('errors.required')]"
                  :disabled="loadingCreate || loadingJoin || loadingSpectate"
                  :counter="(lobbyCode && lobbyCode.length > 200) ? 300 : undefined"
                  maxlength="300"
                  clearable
                  outlined
                  rounded
                  dark
              />
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Lobby from '../models/data/lobby'

export default {
  data() {
    return {
      items: [
        {src: 'https://firebasestorage.googleapis.com/v0/b/unlock-db.appspot.com/o/games%2Fgame_falling_apples.png?alt=media'},
        {src: 'https://firebasestorage.googleapis.com/v0/b/unlock-db.appspot.com/o/games%2Fgame_floating_islands.png?alt=media'},
        {src: 'https://firebasestorage.googleapis.com/v0/b/unlock-db.appspot.com/o/games%2Fgame_space_vegetables.png?alt=media'},
        {src: 'https://firebasestorage.googleapis.com/v0/b/unlock-db.appspot.com/o/games%2Fgame_star_wars.png?alt=media'},
      ],
      loadingCreate: false,
      loadingJoin: false,
      loadingSpectate: false,
      lobbyCode: null,
      validForm: false,
    }
  },

  methods: {
    join() {
      this.$refs.form.validate()

      if (!this.validForm) {
        return
      }

      this.loadingJoin = true

      const lobbyReference = this.$fire.doc(`/lobbies/${this.lobbyCode}`)

      lobbyReference.get()
          .then(snapshot => {
            if (snapshot.exists && new Lobby(snapshot.data()).isFull()) {
              this.$store.dispatch('notifyError', this.$t('snackbar.error.lobbyFull'))
              return
            }

            this.$router.push(`lobbies/${this.lobbyCode}`)
          })
          .catch(() => this.$store.dispatch('notifyError', this.$t('snackbar.error.connectionLost')))
          .finally(() => this.loadingJoin = false)
    }
  },

  watch: {
    lobbyCode() {
      this.lobbyCode = typeof this.lobbyCode === 'string' ? this.lobbyCode.toLowerCase() : this.lobbyCode
    }
  },
}
</script>

<style scoped>
.carousel {
  width: 350px;
  border: 3px solid white;
}
</style>
