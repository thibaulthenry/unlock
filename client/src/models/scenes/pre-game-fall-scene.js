import {Math as PhaserMath, Scene} from 'phaser'
import Axolotl from '../sprites/axolotl'
import PacketServerGameWait from '../packets/packet-server-game-wait'
import SceneKeys from '../../constants/scene-keys'
import SceneUtils from './scene-utils'
import Sign from '../sprites/sign'
import SpriteColors from '../../constants/sprite-colors'
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

    SceneUtils.createBackground(this, 'dungeon-sky', 'dungeon-sky', 1, 0)
    SceneUtils.createBackground(this, 'dungeon-mountains', 'dungeon-mountains', 1, 0.25)
    SceneUtils.createBackground(this, 'dungeon-plateau', 'dungeon-plateau', 1, 0.6)
    SceneUtils.createBackground(this, 'dungeon-wall', 'dungeon-wall', 2, 1)
    SceneUtils.createBackground(this, 'dungeon-ceil', 'dungeon-ceil', 2, 1)
    SceneUtils.createBackground(this, 'dungeon-ground-bottom', 'dungeon-ground-bottom', 2, 1)
    SceneUtils.createBackground(this, 'dungeon-ground-middle-right-hole', 'dungeon-ground-middle-right-hole', 1, 1)
    SceneUtils.createBackground(this, 'dungeon-ground-middle', 'dungeon-ground-middle', 2, 1)
    SceneUtils.createBackground(this, 'dungeon-ground-top', 'dungeon-ground-top', 2, 1)
    SceneUtils.createBackground(this, 'dungeon-ground-hole', 'dungeon-ground-hole', 1, 1)
    SceneUtils.createBackground(this, 'dungeon-ground-trap', 'dungeon-ground-trap', 1, 1)

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
      delay: 300,
      callback: (scene) => this.updateSignText(scene),
      args: [this],
      loop: true,
      paused: false
    })
  }

  destroy() {
    if (this.timeoutChangeScene) {
      clearTimeout(this.timeoutChangeScene)
    }
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

    this.load.image('dungeon-ceil', '../assets/scenes/pre-game/ceil.png')
    this.load.image('dungeon-ground-bottom', '../assets/scenes/pre-game/ground_bottom.png')
    this.load.image('dungeon-ground-hole', '../assets/scenes/pre-game/ground_hole.png')
    this.load.image('dungeon-ground-middle', '../assets/scenes/pre-game/ground_middle.png')
    this.load.image('dungeon-ground-middle-left-hole', '../assets/scenes/pre-game/ground_middle_left_hole.png')
    this.load.image('dungeon-ground-middle-right-hole', '../assets/scenes/pre-game/ground_middle_right_hole.png')
    this.load.image('dungeon-ground-top', '../assets/scenes/pre-game/ground_top.png')
    this.load.image('dungeon-ground-trap', '../assets/scenes/pre-game/ground_trap.png')
    this.load.image('dungeon-ground-trap-open', '../assets/scenes/pre-game/ground_trap_open.png')
    this.load.image('dungeon-mountains', '../assets/scenes/pre-game/mountains.png')
    this.load.image('dungeon-plateau', '../assets/scenes/pre-game/plateau.png')
    this.load.image('dungeon-sky', '../assets/scenes/pre-game/sky.png')
    this.load.image('dungeon-sign', '../assets/sprites/signs/sign.png')
    this.load.image('dungeon-wall', '../assets/scenes/pre-game/wall.png')

    // Sprites

    this.preloadAxolotls()

    // Particles

    this.load.spritesheet('key', '../assets/particles/keys/key.png', {frameWidth: 58, frameHeight: 62})

    // Audio

    this.load.audio('door-open', '../assets/sounds/pre-game-fall/door_open.mp3')

    // Inputs

    this.cursors = this.input.keyboard.createCursorKeys()
  }

  preloadAxolotls() {
    let color

    for (let i = 0; i < SpriteColors.length; i++) {
      color = SpriteColors[i]

      this.load.spritesheet(
          `axolotl-${color}`,
          `../assets/sprites/axolotls/axolotl-${color}.png`,
          {frameWidth: 100, frameHeight: 86}
      )
    }
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

  updateSignText(scene) {
    const floor = store.state.client.getFloor() + 1

    if (scene.sign && floor) {
      scene.sign.updateText(floor)
    }
  }

}
