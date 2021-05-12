<template>
  <div class="d-flex flex-column">
    <v-row class="ma-0 d-flex justify-center align-end">
      <v-btn
          ref="keyUp"
          max-height="45"
          :style="{'border': keysAvailable.up ? '#00C853 2px solid' : undefined}"
      >
        <v-icon
            dark
            :color="keysAvailable.up ? 'green darken-1' : undefined"
        >
          mdi-arrow-up-drop-circle
        </v-icon>
      </v-btn>
    </v-row>

    <v-row class="ma-0 d-flex justify-center align-center">
      <v-btn
          ref="keyLeft"
          class="ml-1 mr-1"
          :style="{'border': keysAvailable.left ? '#00C853 2px solid' : undefined}"
      >
        <v-icon
            dark
            :color="keysAvailable.left ? 'green darken-1' : undefined"
        >
          mdi-arrow-left-drop-circle
        </v-icon>
      </v-btn>

      <v-btn
          ref="keyDown"
          class="ml-1 mr-1"
          :style="{'border': keysAvailable.down ? '#00C853 2px solid' : undefined}"
      >
        <v-icon
            dark
            :color="keysAvailable.down ? 'green darken-1' : undefined"
        >
          mdi-arrow-down-drop-circle
        </v-icon>
      </v-btn>

      <v-btn
          ref="keyRight"
          class="ml-1 mr-1"
          :style="{'border': keysAvailable.right ? '#00C853 2px solid' : undefined}"
      >
        <v-icon
            dark
            :color="keysAvailable.right ? 'green darken-1' : undefined"
        >
          mdi-arrow-right-drop-circle
        </v-icon>
      </v-btn>
    </v-row>

    <v-row class="ma-0 mt-n2 ml-1 mr-1 d-flex justify-center align-center">
      <v-btn
          ref="keySpace"
          class="ml-1 mr-1 "
          block
          :style="{'border': keysAvailable.right ? '#00C853 2px solid' : undefined}"
      >
        <v-icon
            dark
            :color="keysAvailable.space ? 'green darken-1' : undefined"
        >
          mdi-keyboard-space
        </v-icon>
      </v-btn>
    </v-row>
  </div>
</template>

<script>
import Keys from '../constants/keys'
import InputTypes from '../constants/input-types'

export default {
  data: () => {
    return {
      keysPressed: {}
    }
  },

  computed: {
    keysAvailable() {
      return this.$store.state.sceneInputs.keyboard
    }
  },

  methods: {
    keyDown(event) {
      this.move(event, InputTypes.PRESS)
    },

    keyUp(event) {
      this.move(event, InputTypes.RELEASE)
    },

    move(event, type) {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.simulateMouseEvent(this.$refs.keyUp.$el, type, Keys.keyboard.UP)
          break
        case 'ArrowDown':
        case 'KeyS':
          this.simulateMouseEvent(this.$refs.keyDown.$el, type, Keys.keyboard.DOWN)
          break
        case 'ArrowRight':
        case 'KeyD':
          this.simulateMouseEvent(this.$refs.keyRight.$el, type, Keys.keyboard.RIGHT)
          break
        case 'ArrowLeft':
        case 'KeyA':
          this.simulateMouseEvent(this.$refs.keyLeft.$el, type, Keys.keyboard.LEFT)
          break
        case 'Space':
          this.simulateMouseEvent(this.$refs.keySpace.$el, type, Keys.keyboard.SPACE)
          break
      }
    },

    simulateMouseEvent(element, type, direction) {
      if (type === InputTypes.PRESS) {
        if (this.keysPressed[direction]) {
          return
        } else {
          this.keysPressed[direction] = true
        }
      } else if (type === InputTypes.RELEASE) {
        delete this.keysPressed[direction]
      }

      const event = new Event(type)
      const offset = element.getBoundingClientRect()
      event.clientX = offset.left + offset.width / 2
      event.clientY = offset.top + offset.height / 2
      element.dispatchEvent(event)
    }
  },

  mounted() {
    this.$window.addEventListener('keydown', this.keyDown)
    this.$window.addEventListener('keyup', this.keyUp)
  },

  beforeDestroy() {
    this.$window.removeEventListener('keydown', this.keyDown)
    this.$window.removeEventListener('keyup', this.keyUp)
  }
}
</script>

<style scoped>

</style>
