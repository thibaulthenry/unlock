<template>
  <v-footer
      color="grey darken-2"
      height="80px"
  >
    <v-row
        justify="center"
        no-gutters
    >
      <v-btn
          href="https://github.com/thibaulthenry/unlock"
          target="_blank"
          color="white"
          text
          rounded
          dark
      >
        <v-icon>
          mdi-github
        </v-icon>
      </v-btn>

      <v-btn
          href="https://discord.gg/73xCehtWsK"
          target="_blank"
          color="white"
          text
          rounded
          dark
      >
        <v-icon>
          mdi-discord
        </v-icon>
      </v-btn>

      <v-btn
          href="https://twitter.com/UnlockWebGame"
          target="_blank"
          color="white"
          text
          rounded
          dark
      >
        <v-icon>
          mdi-twitter
        </v-icon>
      </v-btn>

      <v-btn
          href="https://www.facebook.com/UnlockWebGame"
          target="_blank"
          color="white"
          text
          rounded
          dark
      >
        <v-icon>
          mdi-facebook
        </v-icon>
      </v-btn>

      <v-btn
          href="https://www.instagram.com/unlockwebgame"
          target="_blank"
          color="white"
          text
          rounded
          dark
      >
        <v-icon>
          mdi-instagram
        </v-icon>
      </v-btn>

      <v-btn
          href="https://www.reddit.com/r/UnlockWebGame"
          target="_blank"
          color="white"
          text
          rounded
          dark
      >
        <v-icon>
          mdi-reddit
        </v-icon>
      </v-btn>

      <v-btn
          to="/about"
          color="white"
          text
          rounded
          dark
      >
        <v-icon>
          mdi-help-circle
        </v-icon>
      </v-btn>

      <v-col
          class="d-flex justify-center align-center white--text mt-1"
          cols="12"
      >
        <img src="../../assets/images/4k.png" alt="logo" width="35px"/>
        <span class="ml-2 mr-2">
          {{ new Date().getFullYear() }} — <strong>4K Games</strong>
        </span>
        <img src="../../assets/images/4k.png" alt="logo" width="35px"/>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script>
export default {}
</script>

<style scoped>

</style>
