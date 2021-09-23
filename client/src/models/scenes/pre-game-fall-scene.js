import {Math as PhaserMath, Scene} from 'phaser'
import Axolotl from '../sprites/axolotl'
import PacketServerGameWait from '../packets/packet-server-game-wait'
import SceneKeys from '../../constants/scene-keys'
import SceneUtils from './scene-utils'
import Sign from '../sprites/sign'
import SpriteDirections from '../../constants/sprite-directions'
import store from '../../services/store'

export default class PreGameFallScene extends Scene {

  constructor() {
    super({
      key: SceneKeys.PRE_GAME_FALL,
      physics: {
        arcade: {
          debug: false,
          gravity: {
            y: 500
          }
        }
      }
    })
  }

  create() {
    // Data

    this.sceneWidth = this.scale.width * 2
    this.sceneHeight = this.scale.height
    this.fallPosition = {
      x: 390,
      y: 454
    }
    this.readyToFall = false

    // Background

    SceneUtils.createBackgroundPreGame(this)

    // Sprites

    this.axolotl = new Axolotl(this, this.sceneWidth / 2, this.sceneHeight - 150, 'axolotl', store.state.client.name, store.state.client.spriteColor)
    this.axolotl.setMotion({direction: SpriteDirections.LEFT, jumping: false, walking: true})
    this.axolotl.setOrigin(0, 0)
    this.axolotl.playAnimations()
    this.sign = new Sign(this, 0, 75, 'dungeon-sign').setOrigin(0, 0)
    this.physics.moveTo(this.axolotl, this.fallPosition.x, this.fallPosition.y, 10, 1500)

    // Particles

    this.particles = this.add.particles('key')

    this.particles.createEmitter({
      frame: {frames: [0]},
      scaleX: 0.8,
      scaleY: 0.8,
      speedY: -20,
      quantity: 1,
      lifespan: 2500,
      alpha: {start: 1, end: 0},
      on: false
    })

    // Physics

    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight - 150)

    // Camera

    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.startFollow(this.axolotl, true, 1, 0.01)
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Time

    this.time.addEvent({
      callback: this.updateSignText,
      callbackScope: this,
      delay: 300,
      loop: true,
      paused: false
    })
  }

  destroy() {
    if (this.timeoutChangeScene) {
      clearTimeout(this.timeoutChangeScene)
    }

    this.sound.stopByKey('door-open')
  }

  handlePacket(packet) {
    // noinspection JSIgnoredPromiseFromCall
    store.dispatch('handlePacket', packet)
  }

  init(data) {
    this.points = data ? data.points : {}
    this.previousWinners = data ? data.previousWinners : {}
  }

  preload() {
    // Events

    store.state.webSocket.onmessage = (payload) => {
      try {
        this.handlePacket(JSON.parse(payload.data))
      } catch (ignored) {
      }
    }

    this.events.on('destroy', this.destroy, this)

    // Textures

    SceneUtils.loadBackgroundPreGame(this)

    // Sprites

    SceneUtils.preloadAxolotls(this)

    // Particles

    this.load.spritesheet('key', '../assets/particles/keys/key.png', {frameWidth: 58, frameHeight: 62})

    // Audio

    this.load.audio('door-open', '../assets/sounds/pre-game-fall/door_open.mp3')

    // Inputs

    this.cursors = this.input.keyboard.createCursorKeys()
  }

  update() {
    if (!this.readyToFall
        && this.axolotl.body.speed > 0
        && PhaserMath.Distance.Between(this.axolotl.body.x, this.axolotl.body.y, this.fallPosition.x - this.axolotl.body.width, this.fallPosition.y - this.axolotl.body.height) < 10) {
      this.readyToFall = true
      this.axolotl.body.reset(this.axolotl.body.x, this.axolotl.body.y)
      this.axolotl.setMotion({walking: false})
      this.particles.emitParticleAt(this.axolotl.body.x + this.axolotl.body.width / 2, this.axolotl.body.y - this.axolotl.body.height / 2)

      this.time.delayedCall(1000, () => {
        this.sound.play('door-open')
        this.backgroundTextures['dungeon-ground-bottom'].forEach(image => image.setDepth(1))
        this.backgroundTextures['dungeon-ground-middle'][0].setTexture('dungeon-ground-middle-left-hole')
        this.backgroundTextures['dungeon-ground-trap'][0].setTexture('dungeon-ground-trap-open').setDepth(1)
        this.backgroundTextures['dungeon-ground-middle'].forEach(image => image.setDepth(1))
      })

      this.time.delayedCall(2000, () => {
        this.axolotl.setMotion({jumping: true})
        this.axolotl.body.setVelocity(-60, -250)
        this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight + 100)
      })

      this.time.delayedCall(4000, () => {
        this.cameras.main.fadeOut(750, 0, 0, 0)
      })

      this.timeoutChangeScene = setTimeout(() =>
          new PacketServerGameWait({
            points: this.points,
            previousWinners: this.previousWinners
          }, true).receive(),
          4750)
    }

    if (this.readyToFall) {
      this.axolotl.playAnimations()
    }
  }

  updateSignText() {
    const floor = store.state.client.getFloor() + 1

    if (this.sign && floor) {
      this.sign.updateText(floor)
    }
  }

}
