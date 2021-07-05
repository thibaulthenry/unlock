import {Input, Scene} from 'phaser'
import Axolotl from '../sprites/axolotl'
import Cage from '../sprites/cage'
import lodash from 'lodash'
import PacketClientSceneMovement from '../packets/packet-client-scene-movement'
import PacketLabels from '../../constants/packet-labels'
import PacketServerLobbyCollapse from '../packets/packet-server-lobby-collapse'
import PacketServerSceneMovement from '../packets/packet-server-scene-movement'
import SceneKeys from '../../constants/scene-keys'
import SceneUtils from './scene-utils'
import SpriteColors from '../../constants/sprite-colors'
import store from '../../services/store'

export default class LobbyScene extends Scene {

  axolotlsMap = new Map()

  constructor() {
    super({
      key: SceneKeys.LOBBY,
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

    this.sceneWidth = this.scale.width * 3
    this.sceneHeight = this.scale.height

    // Background

    SceneUtils.createBackgroundPositioned(this, this.sceneHeight * 2, 'cave-sky', 'sky', 1, 0)
    SceneUtils.createBackgroundPositioned(this, this.sceneHeight * 2, 'cave-mountains', 'cave-mountains', 1, 0.25)
    SceneUtils.createBackgroundPositioned(this, this.sceneHeight * 2, 'cave-plateau', 'cave-plateau', 2, 0.6)
    SceneUtils.createBackgroundPositioned(this, this.sceneHeight * 2, 'cave-ground', 'cave-ground', 3, 1)
    SceneUtils.createBackground(this, 'sky', 'sky', 1, 0)
    SceneUtils.createBackground(this, 'mountains', 'mountains', 1, 0.25)
    SceneUtils.createBackground(this, 'dungeon', 'dungeon', 1, 0.4)
    SceneUtils.createBackground(this, 'plateau', 'plateau', 2, 0.6)
    SceneUtils.createBackground(this, 'ground', 'ground', 3, 1)

    // Sprites

    this.axolotl = new Axolotl(this, this.sceneWidth / 2, this.sceneHeight - 50, 'axolotl', store.state.client.name, store.state.client.spriteColor)
    this.axolotlsMap.set(store.state.client.uuid, this.axolotl)

    // Physics

    this.freezeMovements = false
    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight - 50)

    // Camera

    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.startFollow(this.axolotl, true, 1, 0.01)
    this.cameras.main.fadeIn(500, 0, 0, 0)
  }

  createCageSprites() {
    const y = this.sceneHeight * 2 - 90 - 48
    for (let player of this.axolotlsMap.values()) {
      player.body.setAllowGravity(true)
      new Cage(this, player.x, y, 'cage')
    }
  }

  destroy() {
    this.sound.stopByKey('earthquake')
    this.sound.stopByKey('landslide')
    this.sound.stopByKey('cage-lock')
  }

  handlePacket(packet) {
    // noinspection JSIgnoredPromiseFromCall
    store.dispatch('handlePacket', packet)

    switch (packet.label) {
      case PacketLabels.SERVER_LOBBY_COLLAPSE:
        new PacketServerLobbyCollapse().receive(this)
        break
      case PacketLabels.SERVER_SCENE_MOVEMENT:
        new PacketServerSceneMovement(packet).receive(
            SceneKeys.LOBBY,
            packet => SceneUtils.handleServerAxolotlMovement(packet, this.axolotlsMap)
        )
        break
    }
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

    this.load.image('cave-ground', '../assets/scenes/lobby/cave_ground.png')
    this.load.image('cave-mountains', '../assets/scenes/lobby/cave_mountains.png')
    this.load.image('cave-plateau', '../assets/scenes/lobby/cave_plateau.png')
    this.load.image('cave-sky', '../assets/scenes/lobby/cave_sky.png')
    this.load.image('dungeon', '../assets/scenes/lobby/dungeon.png')
    this.load.image('ground', '../assets/scenes/lobby/ground.png')
    this.load.image('ground-cracked-0', '../assets/scenes/lobby/ground_cracked_0.png')
    this.load.image('ground-cracked-1', '../assets/scenes/lobby/ground_cracked_1.png')
    this.load.image('ground-cracked-2', '../assets/scenes/lobby/ground_cracked_2.png')
    this.load.image('mountains', '../assets/scenes/lobby/mountains.png')
    this.load.image('plateau', '../assets/scenes/lobby/plateau.png')
    this.load.image('sky', '../assets/scenes/lobby/sky.png')

    // Sprites

    this.preloadAxolotls()
    this.load.spritesheet('cage', '../assets/sprites/cages/cage.png', {frameWidth: 120, frameHeight: 180})

    // Audio

    this.load.audio('cage-lock', '../assets/sounds/lobby/cage_lock.mp3')
    this.load.audio('earthquake', '../assets/sounds/lobby/earthquake.mp3')
    this.load.audio('landslide', '../assets/sounds/lobby/landslide.mp3')

    // Inputs

    this.throttledUpdatePlayersSprites = lodash.throttle(this.updatePlayersSprites, 500)
    this.cursors = this.input.keyboard.createCursorKeys()
    this.cursors.KeyA = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.A);
    this.cursors.KeyQ = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.Q);
    this.cursors.KeyD = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.D);
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

    this.axolotlCoordinates = this.axolotl.getChangedCoordinates();

    if (this.axolotlCoordinates) {
      // noinspection JSIgnoredPromiseFromCall
      store.dispatch('sendPacket', new PacketClientSceneMovement(this.axolotlCoordinates, this.axolotl.getMotion(), SceneKeys.LOBBY))
    }

    if (this.freezeMovements) {
      let axolotlCoordinates

      for (let axolotl of this.axolotlsMap.values()) {
        axolotlCoordinates = axolotl.getChangedCoordinates();

        if (axolotlCoordinates) {
          axolotl.updateNamePosition(axolotl.body.x + 50, axolotl.body.y - 28)
          axolotl.updateNameTrianglePosition(axolotl.body.x + 60, axolotl.body.y - 2)
        }
      }
    }
  }

  updatePlayersSprites() {
    SceneUtils.updateSprites(this.axolotlsMap, (player) => new Axolotl(this, this.sceneWidth / 2, this.sceneHeight - 50, 'axolotl', player.name, player.spriteColor, true))

    if (!this.freezeMovements) {
      this.children.bringToTop(this.axolotl)
      this.children.bringToTop(this.axolotl.axolotlNameTriangle)
      this.children.bringToTop(this.axolotl.axolotlName)
    }
  }

}
