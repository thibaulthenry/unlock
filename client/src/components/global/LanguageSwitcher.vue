<template>
  <v-flex shrink>
    <v-select
        v-model="$i18n.locale"
        :items="$i18n.availableLocales"
        :hide-details="true"
        @change="changeVuetifyLocale()"
        dark
    >
      <template slot="selection" slot-scope="data">
        <flag :iso="data.item" :squared="false"/>
        <span v-if="!$vuetify.breakpoint.mobile" class="ml-2">{{ $t('languages.' + data.item) }}</span>
      </template>
      <template slot="item" slot-scope="data">
        <flag :iso="data.item" :squared="false"/>
        <span v-if="!$vuetify.breakpoint.mobile" class="ml-2">{{ $t('languages.' + data.item) }}</span>
      </template>
    </v-select>
  </v-flex>
</template>

<script>
import bus from '../../services/event-bus'
import EventTypes from '../../constants/event-types'

export default {
  methods: {
    changeVuetifyLocale() {
      let locale = 'fr'

      switch (this.$i18n.locale) {
        case 'gb':
          locale = 'en'
          break
      }

      this.$vuetify.lang.current = locale
      bus.$emit(EventTypes.LANGUAGE_CHANGE, locale)
    }
  }
}
</script>

<style scoped>
::v-deep .v-select__selections input {
  display: none;
}

.flag-icon {
  margin-right: 0;
}
</style>
