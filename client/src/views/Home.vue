<template>
  <v-container fluid class="fill-height pa-0">
    <GyroPermissionDialog v-model="showGyroDialog"/>
    <v-row class="d-flex justify-center">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <v-form ref="form" v-model="validForm" @submit.prevent="">
          <v-row class="d-flex justify-center ma-0 mb-2">
            <h1 class="dungeon-title text-center" :style="{fontSize: $vuetify.display.xs ? '1.4rem' : '1.8rem'}">
              {{ $t('home.tagline') }}
            </h1>
          </v-row>

          <v-row class="d-flex justify-center ma-0">
            <v-carousel
                class="carousel dungeon-frame"
                :height="carouselHeight"
                hide-delimiters
                cycle
            >
              <v-carousel-item
                  v-for="(item,i) in items"
                  :key="i"
                  :src="item.src"
              />
            </v-carousel>
          </v-row>

          <v-row justify="center" class="pa-0 mt-6">
            <v-col cols="12" md="8">
              <v-btn
                  :loading="loadingJoin"
                  class="dungeon-btn"
                  size="large"
                  block
                  type="submit"
                  @click="join"
                  @submit="join"
              >
                <v-icon class="mr-2">mdi-key-variant</v-icon>
                {{ $t('buttons.lobby.join') }}
              </v-btn>
            </v-col>
          </v-row>

          <v-row class="d-flex justify-center mt-5">
            <v-col cols="12" md="8">
              <v-text-field
                  v-model="lobbyCode"
                  :label="$t('buttons.lobby.code')"
                  :rules="[value => !!value || $t('errors.required')]"
                  :disabled="loadingCreate || loadingJoin || loadingSpectate"
                  :counter="(lobbyCode && lobbyCode.length > 200) ? 300 : undefined"
                  maxlength="300"
                  clearable
                  variant="outlined"
                  rounded
                  theme="dark"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { doc, getDoc } from 'firebase/firestore'
import GyroControls from '@/services/gyro-controls'
import GyroPermissionDialog from '@/components/global/GyroPermissionDialog.vue'
import Lobby from '../models/data/lobby'
import { firestore } from '@/services/firebase'

export default {
  components: { GyroPermissionDialog },

  data() {
    const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'unlock-db.appspot.com'
    const carouselUrl = name => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/games%2F${name}.png?alt=media`
    return {
      items: [
        {src: carouselUrl('game_falling_apples')},
        {src: carouselUrl('game_floating_islands')},
        {src: carouselUrl('game_space_vegetables')},
        {src: carouselUrl('game_star_wars')},
      ],
      loadingCreate: false,
      loadingJoin: false,
      loadingSpectate: false,
      lobbyCode: null,
      validForm: false,
      showGyroDialog: false,
    }
  },

  computed: {
    // Sur petit écran, on shrink le carousel pour laisser de la place
    // au bouton "Rejoindre" et au champ code sans scroll.
    carouselHeight() {
      return this.$vuetify.display.xs ? '220px' : '350px'
    },
  },

  methods: {
    async join() {
      await this.$refs.form.validate()

      if (!this.validForm) {
        return
      }

      this.loadingJoin = true

      try {
        const snapshot = await getDoc(doc(firestore, 'lobbies', this.lobbyCode))
        if (snapshot.exists() && new Lobby(snapshot.data()).isFull()) {
          this.$store.dispatch('notifyError', this.$t('snackbar.error.lobbyFull'))
          return
        }

        this.$router.push(`lobbies/${this.lobbyCode}`)
      } catch (e) {
        this.$store.dispatch('notifyError', this.$t('snackbar.error.connectionLost'))
      } finally {
        this.loadingJoin = false
      }
    }
  },

  watch: {
    lobbyCode() {
      this.lobbyCode = typeof this.lobbyCode === 'string' ? this.lobbyCode.toLowerCase() : this.lobbyCode
    }
  },

  mounted() {
    // Première visite mobile : on propose d'activer le gyroscope. La
    // permission iOS exige un gesture utilisateur, donc on ne peut pas
    // l'auto-demander — uniquement informer via la modale.
    const shouldPrompt = this.$vuetify.display.mobile
        && GyroControls.isSupported()
        && GyroControls.getPreference() === null
    if (shouldPrompt) this.showGyroDialog = true
  },
}
</script>

<style scoped>
.carousel {
  width: 100%;
  max-width: 350px;
}
</style>
