<template>
  <div class="d-flex flex-column">
    <v-row class="ma-0 mb-0 d-flex justify-center flex-grow-0">
      <v-btn
          ref="mouseLeft"
          class="rounded-tl-xl mr-1 elevation-5"
          height="60px"
          min-height="60px"
          width="40px"
          min-width="40px"
          :style="{'border': keysAvailable.leftClick ? '#00C853 2px solid' : undefined}"
      >
        <v-icon
            dark
            :color="keysAvailable.leftClick ? 'green darken-1' : undefined"
        >
          {{ $i18n.locale === 'fr' ? 'mdi-alpha-g-circle-outline' : 'mdi-alpha-l-circle-outline'}}
        </v-icon>
      </v-btn>

      <v-btn
          ref="mouseMiddle"
          class="rounded-xl mt-5 elevation-5"
          style="z-index: 1; position: absolute; transform:rotate(90deg);"
          x-small
          :style="{'border': keysAvailable.middleClick ? '#00C853 2px solid' : 'black 2px solid'}"
      />

      <v-btn
          ref="mouseRight"
          class="rounded-tr-xl ml-1 elevation-5"
          height="60px"
          min-height="60px"
          width="40px"
          min-width="40px"
          :style="{'border': keysAvailable.rightClick ? '#00C853 2px solid' : undefined}"
      >
        <v-icon
            dark
            :color="keysAvailable.rightClick ? 'green darken-1' : undefined"
        >
          {{ $i18n.locale === 'fr' ? 'mdi-alpha-d-circle-outline' : 'mdi-alpha-r-circle-outline'}}
        </v-icon>
      </v-btn>
    </v-row>

    <v-row class="ma-0 mt-1 d-flex justify-center">
      <div
          class="d-flex justify-space-around align-center rounded-b-xl elevation-12"
          style="background-color: #f5f5f5; width: 87px;"
          :style="{'border': keysAvailable.slide ? '#00C853 2px solid' : undefined}"
      >
        <v-icon :color="keysAvailable.slide ? 'green darken-1' : 'black'">
          mdi-arrow-left-drop-circle
        </v-icon>

        <v-icon :color="keysAvailable.slide ? 'green darken-1' : 'black'">
          mdi-arrow-right-drop-circle
        </v-icon>
      </div>
    </v-row>
  </div>
</template>

<script>
import bus from '../services/event-bus'
import EventTypes from '../constants/event-types'
import Keys from '../constants/keys'
import InputTypes from '../constants/input-types'

export default {
  data: () => {
    return {
      keysPressed: {},
      listening: false
    }
  },

  computed: {
    keysAvailable() {
      return this.$store.state.sceneInputs.mouse
    }
  },

  methods: {
    addListeners() {
      const container = this.$document.querySelector('#game-container')

      if (container && !this.listening) {
        this.listening = true
        bus.$off(EventTypes.LISTEN_MOUSE_EVENTS, this.addListeners)
        container.addEventListener(InputTypes.PRESS, this.mouseDown)
        container.addEventListener(InputTypes.RELEASE, this.mouseUp)
      }
    },

    mouseDown(event) {
      this.move(event, InputTypes.PRESS)
    },

    mouseUp(event) {
      this.move(event, InputTypes.RELEASE)
    },

    move(event, type) {
      let el, key

      switch (event.button) {
        case 0:
          el = this.$refs.mouseLeft.$el
          key = Keys.mouse.LEFT
          break
        case 1:
          el = this.$refs.mouseMiddle.$el
          key = Keys.mouse.MIDDLE
          break
        case 2:
          el = this.$refs.mouseRight.$el
          key = Keys.mouse.RIGHT
          break
      }

      if (!el || !key) {
        return
      }

      const x = event.clientX
      const y = event.clientY
      const rect = el.getBoundingClientRect()

      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return
      }

      this.simulateMouseEvent(el, type, key)
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
    this.addListeners()
    bus.$on(EventTypes.LISTEN_MOUSE_EVENTS, this.addListeners)
  },

  beforeDestroy() {
    bus.$off(EventTypes.LISTEN_MOUSE_EVENTS, this.addListeners)

    const container = this.$document.querySelector('#game-container')

    if (container) {
      container.removeEventListener(InputTypes.PRESS, this.mouseDown)
      container.removeEventListener(InputTypes.RELEASE, this.mouseUp)
    }
  }
}
</script>

<style scoped>

</style>
