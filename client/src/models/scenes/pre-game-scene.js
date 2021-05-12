import {Scene} from 'phaser'
import Axolotl from '../sprites/axolotl'
import lodash from 'lodash'
import PacketClientSceneMovement from '../packets/packet-client-scene-movement'
import PacketLabels from '../../constants/packet-labels'
import PacketServerSceneMovement from '../packets/packet-server-scene-movement'
import SceneKeys from '../../constants/scene-keys'
import SceneUtils from './scene-utils'
import Sign from '../sprites/sign'
import SpriteColors from '../../constants/sprite-colors'
import SpriteDirections from '../../constants/sprite-directions'
import store from '../../services/store'

export default class PreGameScene extends Scene {

  axolotlsMap = new Map()

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
    this.axolotlsMap.set(store.state.client.uuid, this.axolotl)
    this.sign = new Sign(this, 0, 75, 'dungeon-sign').setOrigin(0, 0)

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

  handlePacket(packet) {
    // noinspection JSIgnoredPromiseFromCall
    store.dispatch('handlePacket', packet)

    switch (packet.label) {
      case PacketLabels.SERVER_SCENE_MOVEMENT:
        new PacketServerSceneMovement(packet).receive(store, SceneKeys.PRE_GAME, this.axolotlsMap)
        break
    }
  }

  init(data) {
    this.points = data ? data.points : {}
    this.previousWinners = data ? data.previousWinners : {}
  }

  onSameFloor(playerUuid) {
    const clientUuid = store.state.client?.uuid

    if (!this.points || !playerUuid || !clientUuid) {
      return true
    }

    return this.points[playerUuid] === this.points[clientUuid]
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

    // Inputs

    this.throttledUpdatePlayersSprites = lodash.throttle(this.updatePlayersSprites, 500)
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

  update(time, delta) {
    // noinspection JSValidateTypes
    this.throttledUpdatePlayersSprites()
    this.axolotl.update(time, delta)

    this.axolotlCoordinates = this.axolotl.getChangedCoordinates()

    if (this.axolotlCoordinates) {
      // noinspection JSIgnoredPromiseFromCall
      store.dispatch('sendPacket', new PacketClientSceneMovement(this.axolotlCoordinates, this.axolotl.getMotion(), SceneKeys.PRE_GAME))
    }
  }

  updatePlayersSprites() {
    const lobby = store.state.lobby

    if (!lobby) {
      return
    }

    const clientPoints = this.points[store.state.client.uuid]
    const lobbyPlayersMap = lobby.getPlayersMap(this.points, clientPoints)

    for (let uuid of this.axolotlsMap.keys()) {
      if (!lobbyPlayersMap.has(uuid)) {
        this.axolotlsMap.get(uuid).destroy()
        this.axolotlsMap.delete(uuid)
      }
    }

    lobby.getPlayers().forEach(player => {
      if (!this.axolotlsMap.has(player.uuid) && this.onSameFloor(player.uuid)) {
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

        this.axolotlsMap.set(player.uuid, axolotl)
      }
    })

    if (!this.freezeMovements) {
      this.children.bringToTop(this.axolotl)
      this.children.bringToTop(this.axolotl.axolotlNameTriangle)
      this.children.bringToTop(this.axolotl.axolotlName)
    }
  }

  updateSignText(scene) {
    const floor = store.state.client.getFloor()

    if (scene.sign && floor) {
      scene.sign.updateText(floor)
    }
  }

  wonLastGame(uuid) {
    return this.previousWinners[uuid || store.state.client?.uuid]
  }

}
