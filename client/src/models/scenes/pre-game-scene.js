import {Input, Scene} from 'phaser'
import Axolotl from '../sprites/axolotl'
import PacketClientSceneMovement from '../packets/packet-client-scene-movement'
import PacketLabels from '../../constants/packet-labels'
import PacketServerSceneMovement from '../packets/packet-server-scene-movement'
import SceneKeys from '../../constants/scene-keys'
import SceneUtils from './scene-utils'
import Sign from '../sprites/sign'
import SpriteDirections from '../../constants/sprite-directions'
import store from '../../services/store'

export default class PreGameScene extends Scene {

  axolotlMap = new Map()

  constructor() {
    super({
      key: SceneKeys.PRE_GAME,
      physics: {
        arcade: {
          debug: false,
          gravity: {
            y: 500
          },
          checkCollision: {
            up: false
          }
        },
      }
    })
  }

  create() {
    // Data

    this.sceneWidth = this.scale.width * 2
    this.sceneWidthMiddle = this.sceneWidth / 2
    this.sceneHeight = this.scale.height

    // Background

    SceneUtils.createBackgroundPreGame(this)

    // Sprites

    const wonLastGame = this.wonLastGame()

    this.axolotl = new Axolotl(
        this,
        wonLastGame ? 250 : this.sceneWidth / 2,
        wonLastGame ? -100 : this.sceneHeight - 50,
        'axolotl',
        store.state.client.name,
        store.state.client.spriteColor
    )

    this.axolotl.setMotion({direction: wonLastGame ? SpriteDirections.LEFT : SpriteDirections.RIGHT})
    this.axolotlMap.set(store.state.client.uuid, this.axolotl)
    this.sign = new Sign(this, 0, 75, 'dungeon-sign').setOrigin(0, 0)

    // Physics

    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight - 150)

    // Camera

    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.fadeIn(500, 0, 0, 0)
    this.cameras.main.startFollow(this.axolotl, true, 1, 0.01)

    // Time

    this.time.addEvent({
      callback: this.updateSignText,
      callbackScope: this,
      delay: 300,
      loop: true,
      paused: false
    })

    this.time.addEvent({
      args: this,
      callback: (scene) => this.updatePlayersSprites(scene),
      delay: 500,
      loop: true,
      paused: false
    })
  }

  handlePacket(packet) {
    // noinspection JSIgnoredPromiseFromCall
    store.dispatch('handlePacket', packet)

    switch (packet.label) {
      case PacketLabels.SERVER_SCENE_MOVEMENT:
        new PacketServerSceneMovement(packet).receive(
            SceneKeys.PRE_GAME,
            packet => SceneUtils.handleServerAxolotlMovement(packet, this.axolotlMap)
        )
        break
    }
  }

  // noinspection JSUnusedGlobalSymbols
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

    // Textures

    SceneUtils.loadBackgroundPreGame(this)

    // Sprites

    SceneUtils.preloadAxolotls(this)

    // Inputs

    this.cursors = this.input.keyboard.createCursorKeys()
    this.cursors.KeyA = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.A)
    this.cursors.KeyD = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.D)
    this.cursors.KeyQ = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.Q)
  }

  update(time, delta) {
    this.axolotl.update(time, delta)

    this.axolotlCoordinates = this.axolotl.getChangedCoordinates()

    if (this.axolotlCoordinates) {
      // noinspection JSIgnoredPromiseFromCall
      store.dispatch('sendPacket', new PacketClientSceneMovement(this.axolotlCoordinates, this.axolotl.getMotion(), SceneKeys.PRE_GAME))
    }
  }

  updatePlayersSprites() {
    SceneUtils.updatePlayersSprites(
        this.axolotlMap,
        player => {

          const wonLastGame = this.wonLastGame(player.uuid)

          const axolotl = new Axolotl(
              this,
              wonLastGame ? 250 : this.sceneWidth / 2,
              wonLastGame ? -100 : this.sceneHeight - 50,
              'axolotl',
              player.name,
              player.spriteColor,
              true
          )

          axolotl.setMotion({direction: wonLastGame ? SpriteDirections.LEFT : SpriteDirections.RIGHT})

          return axolotl
        },
        playerUuid => {
          const clientUuid = store.state.client?.uuid

          if (!this.points || !playerUuid || !clientUuid) {
            return true
          }

          return this.points[playerUuid] === this.points[clientUuid]
        },
        player => {
          const pointsRequired = this.points[store.state.client.uuid]
          return !this.points || pointsRequired === null || pointsRequired === undefined || this.points[player.uuid] === pointsRequired
        }
  )

    if (!this.freezeMovements) {
      this.children.bringToTop(this.axolotl)
      this.children.bringToTop(this.axolotl.axolotlNameTriangle)
      this.children.bringToTop(this.axolotl.axolotlName)
    }
  }

  updateSignText() {
    const floor = store.state.client.getFloor()

    if (this.sign && floor) {
      this.sign.updateText(floor)
    }
  }

  wonLastGame(uuid) {
    return this.previousWinners[uuid || store.state.client?.uuid]
  }

}
