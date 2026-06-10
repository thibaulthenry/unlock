<template>
  <v-dialog
      v-model="show"
      max-width="420"
      persistent
  >
    <v-card theme="dark">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="amber">mdi-rotate-3d-variant</v-icon>
        {{ $t('mobile.gyro.title') }}
      </v-card-title>

      <v-card-text class="text-body-1">
        <p class="mb-2">{{ $t('mobile.gyro.description') }}</p>
        <ul class="pl-4">
          <li>{{ $t('mobile.gyro.controlsTilt') }}</li>
          <li>{{ $t('mobile.gyro.controlsShake') }}</li>
          <li>{{ $t('mobile.gyro.controlsTap') }}</li>
          <li>{{ $t('mobile.gyro.controlsDoubleTap') }}</li>
        </ul>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-btn variant="text" @click="decline">
          {{ $t('mobile.gyro.later') }}
        </v-btn>
        <v-spacer/>
        <v-btn
            color="amber"
            variant="elevated"
            :loading="requesting"
            @click="accept"
        >
          {{ $t('mobile.gyro.enable') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import GyroControls from '@/services/gyro-controls'

export default {
  emits: ['update:modelValue'],

  props: {
    modelValue: { type: Boolean, default: false },
  },

  data: () => ({
    requesting: false,
  }),

  computed: {
    show: {
      get() { return this.modelValue },
      set(v) { this.$emit('update:modelValue', v) },
    },
  },

  methods: {
    async accept() {
      this.requesting = true
      try {
        const granted = await GyroControls.requestPermissions()
        if (granted) {
          GyroControls.setPreference('enabled')
        } else {
          GyroControls.setPreference('disabled')
          this.$store.dispatch('notifyError', this.$t('mobile.gyro.permissionDenied'))
        }
      } finally {
        this.requesting = false
        this.show = false
      }
    },

    decline() {
      GyroControls.setPreference('disabled')
      this.show = false
    },
  },
}
</script>
