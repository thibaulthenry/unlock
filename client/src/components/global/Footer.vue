<template>
  <v-footer color="grey-darken-2" height="80px">
    <v-row justify="center" no-gutters>
      <v-btn
          v-for="link in links"
          :key="link.icon"
          :href="link.href"
          :to="link.to"
          target="_blank"
          color="white"
          variant="text"
          rounded
      >
        <v-icon>{{ link.icon }}</v-icon>
      </v-btn>

      <v-col class="d-flex justify-center align-center text-white mt-1" cols="12">
        <img :src="logo" alt="logo" width="35px"/>
        <span class="ml-2 mr-2">
          {{ new Date().getFullYear() }} — <strong>4K Games</strong>
        </span>
        <img :src="logo" alt="logo" width="35px"/>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script>
import logo from '@/assets/images/4k.png'

export default {
  data: () => ({
    logo,
    links: [
      { icon: 'mdi-github',      href: 'https://github.com/thibaulthenry/unlock' },
      { icon: 'mdi-discord',     href: 'https://discord.gg/73xCehtWsK' },
      { icon: 'mdi-twitter',     href: 'https://twitter.com/UnlockWebGame' },
      { icon: 'mdi-facebook',    href: 'https://www.facebook.com/UnlockWebGame' },
      { icon: 'mdi-instagram',   href: 'https://www.instagram.com/unlockwebgame' },
      { icon: 'mdi-reddit',      href: 'https://www.reddit.com/r/UnlockWebGame' },
      { icon: 'mdi-help-circle', to: '/about' },
    ],
  }),
}
</script>
