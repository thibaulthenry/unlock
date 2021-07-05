import {Math as PhaserMath, Scene} from 'phaser'
import Axolotl from '../sprites/axolotl'
import bus from '../../services/event-bus'
import Cage from '../sprites/cage'
import EventTypes from '../../constants/event-types'
import i18n from '../../services/i18n'
import SceneKeys from '../../constants/scene-keys'
import SceneUtils from './scene-utils'
import Sign from '../sprites/sign'
import SpriteColors from '../../constants/sprite-colors'
import SpriteDirections from '../../constants/sprite-directions'
import store from '../../services/store'

export default class EndScene extends Scene {

  constructor() {
    super({
      key: SceneKeys.END,
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
    this.sceneWidthMiddle = this.sceneWidth / 2
    this.sceneTop = 1800
    this.sceneHeight = (this.scale.height + 100) * store.state.lobby.pointsGoal + this.sceneTop
    this.endPosition = {
      x: this.sceneWidth - 180,
      y: this.sceneHeight - 150
    }
    this.readyToEnd = false
    this.readyToMove = false

    // Background

    SceneUtils.createBackgroundPositioned(this, this.sceneHeight, 'dungeon-sky', 'dungeon-sky', 2, 1)
    SceneUtils.createBackgroundPositioned(this, this.sceneHeight, 'dungeon-mountains', 'dungeon-mountains', 2, 1)
    SceneUtils.createBackgroundPositioned(this, this.sceneHeight, 'dungeon-plateau', 'dungeon-plateau', 2, 1)
    SceneUtils.createBackgroundPositioned(this, this.sceneHeight, 'dungeon-end-wall', 'dungeon-end-wall', 2, 1)
    SceneUtils.createBackgroundPositioned(this, this.sceneHeight, 'dungeon-ceil', 'dungeon-ceil', 2, 1, null, 2)
    SceneUtils.createBackgroundPositioned(this, this.sceneHeight, 'dungeon-ground-bottom', 'dungeon-ground-bottom', 2, 1)
    SceneUtils.createBackgroundPositioned(this, this.sceneHeight, 'dungeon-ground-middle', 'dungeon-ground-middle', 2, 1)
    SceneUtils.createBackgroundPositioned(this, this.sceneHeight, 'dungeon-ground-top', 'dungeon-ground-top', 2, 1)
    this.add.image(this.sceneWidth, this.sceneHeight, 'dungeon-door-open-right').setOrigin(1, 1).setDepth(1)
    this.add.image(this.sceneWidth, this.sceneHeight, 'dungeon-door-floor').setOrigin(1, 1)
    this.end = this.add.image(this.sceneWidth, this.sceneHeight, 'dungeon-door-closed').setOrigin(1, 1)


    let sign, y

    for (let i = 1; i <= store.state.lobby.pointsGoal; i++) {
      y = this.sceneHeight - (600 + 100) * i
      SceneUtils.createBackgroundPositioned(this, y, 'dungeon-sky', 'dungeon-sky', 2, 1)
      SceneUtils.createBackgroundPositioned(this, y, 'dungeon-mountains', 'dungeon-mountains', 2, 1)
      SceneUtils.createBackgroundPositioned(this, y, 'dungeon-plateau', 'dungeon-plateau', 2, 1)
      SceneUtils.createBackgroundPositioned(this, y, 'dungeon-wall', 'dungeon-wall', 2, 1)
      SceneUtils.createBackgroundPositioned(this, y, 'dungeon-ceil', 'dungeon-ceil', 2, 1)
      SceneUtils.createBackgroundPositioned(this, y, 'dungeon-ground-bottom', 'dungeon-ground-bottom', 2, 1)
      SceneUtils.createBackgroundPositioned(this, y, 'dungeon-ground-middle', 'dungeon-ground-middle', 2, 1)
      SceneUtils.createBackgroundPositioned(this, y, 'dungeon-ground-top', 'dungeon-ground-top', 2, 1)
      SceneUtils.createBackgroundPositioned(this, y, 'dungeon-ground-trap', 'dungeon-ground-trap', 1, 1)
      sign = new Sign(this, 0, y - 525, 'dungeon-sign').setOrigin(0, 0)
      sign.updateText(i)
    }

    this.add.image(this.sceneWidthMiddle, 300, 'dungeon-logo')

    this.endText = this.add.text(this.sceneWidthMiddle, 600, '' + i18n.t('lobby.states.ended'), {
      fontFamily: '"Brush Script MT"',
      fontSize: '130px',
      color: '#ffffff'
    })
        .setPadding(10, 10, 10, 10)
        .setShadow(-2, 2, "#000000", 15, true, true)
        .setOrigin(0.5, 0.5)

    // Sprites

    const winner = this.winners ? Object.values(this.winners)[0] : store.state.client
    this.axolotl = new Axolotl(this, 200, this.sceneHeight - 750, 'axolotl', winner.name, winner.spriteColor).setDepth(3)
    this.axolotl.setMotion({direction: SpriteDirections.RIGHT, jumping: true})
    this.axolotl.setOrigin(0, 0)
    this.axolotl.playAnimations()
    this.sign = new Sign(this, 0, this.sceneHeight - 525, 'dungeon-sign').setOrigin(0, 0)
    this.sign.updateText('0')
    this.createLosers()

    // Physics

    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight - 150)

    // Camera

    this.cameras.main.centerOnY(this.sceneHeight)
    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Particles

    this.particles = this.add.particles('key')

    this.particles.createEmitter({
      frame: {frames: [0]},
      scaleX: 0.8,
      scaleY: 0.8,
      speedY: -80,
      quantity: 1,
      lifespan: 1250,
      alpha: {start: 1, end: 0},
      on: false
    })
  }

  createLosers() {
    const availablePlaces = new Map()

    for (let points = 0; points <= store.state.lobby.pointsGoal; points++) {
      availablePlaces.set(points, [])

      for (let place = 0; place < Math.ceil(store.state.lobby.capacity / 2); place++) {
        availablePlaces.get(points).push(this.sceneWidthMiddle + place * 150)

        if (place !== 0) {
          availablePlaces.get(points).push(this.sceneWidthMiddle - place * 150)
        }
      }

      availablePlaces.set(points, availablePlaces.get(points).reverse())
    }

    let axolotl, x, y

    for (let loser of this.losers ? Object.values(this.losers) : []) {
      x = availablePlaces.get(loser.points).pop()
      y = this.sceneTop + (600 + 100) * loser.points - 175

      if (x === null || x === undefined || y === null || y === undefined) {
        continue
      }

      axolotl = new Axolotl(this, x, y, 'axolotl', loser.name, loser.spriteColor, true, true)
      axolotl.setMotion({direction: Math.floor(Math.random() * 2) === 0 ? SpriteDirections.LEFT : SpriteDirections.RIGHT})
      axolotl.playAnimations()
      axolotl.updateNamePosition(axolotl.body.x + 50, axolotl.body.y - 28)
      axolotl.updateNameTrianglePosition(axolotl.body.x + 60, axolotl.body.y - 2)

      new Cage(this, axolotl.body.x + axolotl.body.width / 2, axolotl.body.y, 'cage', false)
    }
  }

  destroy() {
    bus.$off(EventTypes.LANGUAGE_CHANGE)
  }

  handlePacket(packet) {
    // noinspection JSIgnoredPromiseFromCall
    store.dispatch('handlePacket', packet)
  }

  init(data) {
    this.losers = data ? data.losers : {}
    this.winners = data ? data.winners : {}
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

    bus.$on(EventTypes.LANGUAGE_CHANGE, () => {
      if (this.endText) {
        this.endText.setText('' + i18n.t('lobby.states.ended'))
      }
    })

    // Textures

    this.load.image('dungeon-logo', '../assets/scenes/end/logo.png')
    this.load.image('dungeon-ceil', '../assets/scenes/end/ceil.png')
    this.load.image('dungeon-ground-bottom', '../assets/scenes/end/ground_bottom.png')
    this.load.image('dungeon-ground-hole', '../assets/scenes/end/ground_hole.png')
    this.load.image('dungeon-ground-middle', '../assets/scenes/end/ground_middle.png')
    this.load.image('dungeon-ground-top', '../assets/scenes/end/ground_top.png')
    this.load.image('dungeon-ground-trap', '../assets/scenes/end/ground_trap.png')
    this.load.image('dungeon-mountains', '../assets/scenes/end/mountains.png')
    this.load.image('dungeon-plateau', '../assets/scenes/end/plateau.png')
    this.load.image('dungeon-sky', '../assets/scenes/end/sky.png')
    this.load.image('dungeon-sign', '../assets/sprites/signs/sign.png')
    this.load.image('dungeon-wall', '../assets/scenes/pre-game/wall.png')
    this.load.image('dungeon-end-wall', '../assets/scenes/end/wall.png')
    this.load.image('dungeon-door-closed', '../assets/scenes/end/door_closed.png')
    this.load.image('dungeon-door-open', '../assets/scenes/end/door_open.png')
    this.load.image('dungeon-door-open-left', '../assets/scenes/end/door_open_left.png')
    this.load.image('dungeon-door-open-right', '../assets/scenes/end/door_open_right.png')
    this.load.image('dungeon-door-floor', '../assets/scenes/end/door_floor.png')

    // Sprites

    this.preloadAxolotls()
    this.load.spritesheet('cage', '../assets/sprites/cages/cage.png', {frameWidth: 120, frameHeight: 180})

    // Particles

    this.load.spritesheet('key', '../assets/particles/keys/key.png', {frameWidth: 58, frameHeight: 62})

    // Audio

    this.load.audio('door-open', '../assets/sounds/pre-game-fall/door_open.mp3')
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
    this.axolotl.updateNamePosition(this.axolotl.body.x + 50, this.axolotl.body.y - 28)
    this.axolotl.updateNameTrianglePosition(this.axolotl.body.x + 60, this.axolotl.body.y - 2)

    if (!this.readyToMove && this.axolotl.body.onFloor()) {
      this.readyToMove = true
      this.cameras.main.startFollow(this.axolotl, true, 1, 0.01)
      this.axolotl.setMotion({direction: SpriteDirections.RIGHT, jumping: false})
      this.axolotl.playAnimations()
      this.time.delayedCall(500, () => {
        this.axolotl.setMotion({direction: SpriteDirections.RIGHT, jumping: false, walking: true})
        this.axolotl.playAnimations()
        this.physics.moveTo(this.axolotl, this.endPosition.x, this.endPosition.y, 10, 5000)
      }, this)
    }

    if (!this.readyToEnd
        && this.axolotl.body.speed > 0
        && PhaserMath.Distance.Between(this.axolotl.body.x, this.axolotl.body.y, this.endPosition.x - this.axolotl.body.width, this.endPosition.y - this.axolotl.body.height) < 10) {
      this.readyToEnd = true
      this.axolotl.body.reset(this.axolotl.body.x, this.axolotl.body.y)
      this.axolotl.setDepth(0)
      this.axolotl.setMotion({walking: false})

      this.time.addEvent({
        delay: 250,
        callback: (scene) => scene.particles.emitParticleAt(this.axolotl.body.x + this.axolotl.body.width / 2, this.axolotl.body.y - this.axolotl.body.height / 2),
        args: [this],
        repeat: store.state.lobby.pointsGoal - 1
      })

      const timeOffset = 250 * store.state.lobby.pointsGoal

      this.time.delayedCall(timeOffset + 500, () => {
        this.sound.play('door-open')
        this.end.setTexture('dungeon-door-open-left')
      }, this)

      this.time.delayedCall(timeOffset + 2000, () => {
        this.physics.moveTo(this.axolotl, this.sceneWidth + 150, this.endPosition.y, 10, 3000)
        this.axolotl.setMotion({walking: true})
      }, this)

      this.time.delayedCall(timeOffset + 2500, () => {
        this.end.setTexture('dungeon-door-open')
        this.cameras.main.zoomTo(0.5, 2000)
        this.cameras.main.stopFollow()
      }, this)

      this.time.delayedCall(timeOffset + 5500, () => {
        this.cameras.main.pan(this.sceneWidthMiddle, 300, 1500 * store.state.lobby.pointsGoal)
      }, this)
    }

    if (this.readyToEnd) {
      this.axolotl.playAnimations()
    }
  }

}
