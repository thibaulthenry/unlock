<template>
  <div class="shrink">
    <v-select
        v-model="locale"
        :items="availableLocales"
        :hide-details="true"
        density="compact"
        variant="plain"
        theme="dark"
    >
      <template #selection="{ item }">
        <flag :iso="item.value" :squared="false"/>
        <span v-if="!$vuetify.display.mobile" class="ml-2">{{ $t('languages.' + item.value) }}</span>
      </template>
      <template #item="{ item, props }">
        <v-list-item v-bind="props" title="">
          <flag :iso="item.value" :squared="false"/>
          <span v-if="!$vuetify.display.mobile" class="ml-2">{{ $t('languages.' + item.value) }}</span>
        </v-list-item>
      </template>
    </v-select>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { useLocale } from 'vuetify'
import bus from '@/services/event-bus'
import EventTypes from '@/constants/event-types'

export default {
  setup() {
    const i18n = useI18n()
    const vuetifyLocale = useLocale()
    return { i18n, vuetifyLocale }
  },

  computed: {
    locale: {
      get() { return this.i18n.locale.value },
      set(value) {
        this.i18n.locale.value = value
        this.applyLocale(value)
      },
    },

    availableLocales() {
      return this.i18n.availableLocales
    },
  },

  methods: {
    applyLocale(value) {
      const locale = value === 'gb' ? 'en' : 'fr'
      this.vuetifyLocale.current.value = locale
      bus.$emit(EventTypes.LANGUAGE_CHANGE, locale)
    },
  },
}
</script>

<style scoped>
:deep(.v-select__selection-text) {
  display: none;
}

.flag-icon {
  margin-right: 0;
}
</style>
