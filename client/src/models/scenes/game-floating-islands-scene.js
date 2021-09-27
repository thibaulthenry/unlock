import {Input, Math, Scene} from 'phaser'
import Axolotl from '../../models/sprites/axolotl'
import PacketClientSceneFloatingIslandsCollide from '../../models/packets/packet-client-scene-floating-islands-collide'
import PacketClientSceneFloatingIslandsFall from '../../models/packets/packet-client-scene-floating-islands-fall';
import PacketClientSceneMovement from '../../models/packets/packet-client-scene-movement'
import PacketLabels from '../../constants/packet-labels'
import PacketServerSceneData from '../../models/packets/packet-server-scene-data'
import PacketServerSceneMovement from '../../models/packets/packet-server-scene-movement'
import SceneInputs from '../../constants/scene-inputs'
import SceneKeys from '../../constants/scene-keys'
import SceneUtils from '../../models/scenes/scene-utils'
import store from '../../services/store'

export default class GameFloatingIslandsScene extends Scene {

  axolotlMap = new Map()
  built = false
  islandStateMap = new Map()
  islandMap = new Map()
  lost = false

  constructor() {
    super({
      key: SceneKeys.GAME_FLOATING_ISLANDS,
      physics: {
        arcade: {
          debug: false,
          gravity: {
            y: 700
          },
          checkCollision: {
            up: false
          },
        }
      }
    })
  }

  create() {
    // Data

    this.sceneWidth = this.scale.width * 2
    this.sceneHeight = this.scale.height * 5

    // Background

    this.createBackground('floating-islands-sky', 2, 1)

    // Sprites

    this.axolotl = new Axolotl(this, Math.Between(200, this.sceneWidth - 200), -100, 'axolotl', store.state.client.name, store.state.client.spriteColor, true, null, 0.5)
    this.axolotl.setSpeedFactor(1.5)
    this.axolotlMap.set(store.state.client.uuid, this.axolotl)

    // Physics

    this.freezeMovements = true
    this.islandGroup = this.physics.add.staticGroup()
    this.axolotl.body.width = this.axolotl.body.halfWidth / 2
    this.axolotl.body.offset.x = this.axolotl.width / 2.7
    this.axolotl.body.onWorldBounds = true

    this.physics.add.collider(this.axolotl, this.islandGroup, (axolotlSprite, islandSprite) => {
      const key = islandSprite.getData('key')

      if (axolotlSprite.y < islandSprite.y - axolotlSprite.body.halfHeight) {
        // noinspection JSIgnoredPromiseFromCall
        store.dispatch('sendPacket', new PacketClientSceneFloatingIslandsCollide(key))
      }
    })

    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight + this.scale.height)

    this.physics.world.on('worldbounds', (event) => {
      if (event.gameObject.body.y > this.sceneHeight) {
        this.physics.world.off('worldbounds')
        this.processLoss()
      }
    })

    // Camera

    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.setZoom(0.5, 0.5)
    this.cameras.main.startFollow(this.axolotl, true)
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Time

    this.time.addEvent({
      callback: this.updatePlayersSprites,
      callbackScope: this,
      delay: 500,
      loop: true,
      paused: false
    })
  }

  createBackground(key, count, scrollFactor) {
    SceneUtils.createBackground(this, key, key, count, scrollFactor, scrollFactor)

    for (let i = 2; i < 6; i++) {
      SceneUtils.createBackgroundPositioned(this, this.scale.height * i, key, key, count, scrollFactor, scrollFactor)
    }
  }

  createIslands(packet) {
    if (this.built) {
      return
    }

    this.built = true
    const packetArray = []

    Object.values(packet.data.islands).forEach(value => packetArray.push(value))

    packetArray.sort((a, b) => {
      if (a.coordinates.y < b.coordinates.y) {
        return -1;
      }

      if (a.coordinates.y > b.coordinates.y) {
        return 1;
      }

      if (a.coordinates.x > b.coordinates.x) {
        return 1;
      }

      if (a.coordinates.x < b.coordinates.x) {
        return -1;
      }

      return 0;
    })

    const buildDelay = 25

    this.time.addEvent({
      args: [packetArray],
      callback: (packetArray) => {
        if (packetArray.length === 0) {
          return
        }

        const packetIsland = packetArray.shift()
        const island = this.islandGroup.create(packetIsland.coordinates.x, packetIsland.coordinates.y, this.getIslandTexture(packetIsland))

        island.setScale(1.2)
        island.setData('key', packetIsland.key)
        this.islandMap.set(packetIsland.key, island)
        this.islandStateMap.set(packetIsland.key, 0)
      },
      callbackScope: this,
      delay: buildDelay,
      loop: true,
      repeatCount: packetArray.length
    })

    this.time.delayedCall(
        (packet.data.stage + 1) * 9 * buildDelay,
        () => {
          this.axolotl.body.setAllowGravity(true)
          this.freezeMovements = false
        },
        undefined,
        this
    )
  }

  getIslandTexture(island) {
    return `floating-island-${island.type}-${island.state}${island.small ? '-small' : ''}`
  }

  handlePacket(packet) {
    // noinspection JSIgnoredPromiseFromCall
    store.dispatch('handlePacket', packet)

    switch (packet.label) {
      case PacketLabels.SERVER_SCENE_DATA:
        new PacketServerSceneData(packet).receive(
            SceneKeys.GAME_FLOATING_ISLANDS,
            packet => {
              if (this.built) {
                this.updateIslandSprites(packet)
              } else {
                this.createIslands(packet)
              }
            }
        )
        break
      case PacketLabels.SERVER_SCENE_MOVEMENT:
        new PacketServerSceneMovement(packet).receive(
            SceneKeys.GAME_FLOATING_ISLANDS,
            packet => SceneUtils.handleServerAxolotlMovement(packet, this.axolotlMap)
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

    // Textures

    this.load.image('floating-islands-sky', '../assets/scenes/game-floating-islands/sky.png')
    this.load.image('floating-island-blue-0', '../assets/sprites/islands/island_blue_0.png')
    this.load.image('floating-island-blue-0-small', '../assets/sprites/islands/island_blue_0_small.png')
    this.load.image('floating-island-blue-1', '../assets/sprites/islands/island_blue_1.png')
    this.load.image('floating-island-blue-1-small', '../assets/sprites/islands/island_blue_1_small.png')
    this.load.image('floating-island-grey-0', '../assets/sprites/islands/island_grey_0.png')
    this.load.image('floating-island-grey-0-small', '../assets/sprites/islands/island_grey_0_small.png')
    this.load.image('floating-island-grey-1', '../assets/sprites/islands/island_grey_1.png')
    this.load.image('floating-island-grey-1-small', '../assets/sprites/islands/island_grey_1_small.png')
    this.load.image('floating-island-white-0', '../assets/sprites/islands/island_white_0.png')
    this.load.image('floating-island-white-0-small', '../assets/sprites/islands/island_white_0_small.png')
    this.load.image('floating-island-white-1', '../assets/sprites/islands/island_white_1.png')
    this.load.image('floating-island-white-1-small', '../assets/sprites/islands/island_white_1_small.png')

    // Sprites

    SceneUtils.preloadAxolotls(this)

    // Inputs

    this.cursors = this.input.keyboard.createCursorKeys()
    this.cursors.KeyQ = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.Q)
    this.cursors.KeyA = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.A)
    this.cursors.KeyD = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.D)
    this.cursors.KeyZ = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.Z);
    this.cursors.KeyW = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.W);
    this.cursors.KeyS = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.S);
  }

  processLoss() {
    // noinspection JSIgnoredPromiseFromCall
    store.dispatch('sendPacket', new PacketClientSceneFloatingIslandsFall())
  }

  update(time, delta) {
    if (this.freezeMovements) {
      return
    }

    if (this.lost) {
      if (this.cursors.up.isDown || this.cursors.KeyZ.isDown || this.cursors.KeyW.isDown) {
        this.cameras.main.scrollY -= 20
      }

      if (this.cursors.down.isDown || this.cursors.KeyS.isDown) {
        this.cameras.main.scrollY += 20
      }

      return
    }

    this.axolotl.update(time, delta)

    this.axolotlCoordinates = this.axolotl.getChangedCoordinates()

    if (this.axolotlCoordinates) {
      // noinspection JSIgnoredPromiseFromCall
      store.dispatch('sendPacket', new PacketClientSceneMovement(this.axolotlCoordinates, this.axolotl.getMotion(), SceneKeys.GAME_FLOATING_ISLANDS))
    }
  }

  updateIslandSprites(packet) {
    if (!(packet && packet.data && packet.data.islands)) {
      return
    }

    this.playersCount = packet.data.playersCount
    this.remainingPlayers = packet.data.remainingPlayers

    Object.entries(packet.data.islands).forEach(([key, island]) => {
      const islandSprite = this.islandMap.get(key)

      if (!islandSprite || island.state === this.islandStateMap.get(key)) {
        return
      }

      this.islandStateMap.set(key, island.state)

      switch (island.state) {
        case 0:
        case 1:
          islandSprite.setTexture(this.getIslandTexture(island));
          break;
        case 2:
          islandSprite.destroy()
      }
    })
  }

  updatePlayersSprites() {
    if (!this.lost && this.remainingPlayers && !this.remainingPlayers[store.state.client.uuid]) {
      this.lost = true
      this.cameras.main.stopFollow()
      this.axolotl.destroy()
      store.commit('SET_SCENE_INPUTS', {inputs: SceneInputs['GameFloatingIslandsLost']})
    }

    SceneUtils.updatePlayersSprites(
        this.axolotlMap,
        player => new Axolotl(
            this,
            this.sceneWidth / 2,
            this.sceneHeight - 50,
            'axolotl',
            player.name,
            player.spriteColor,
            true
        ),
        playerUuid => !this.remainingPlayers || this.remainingPlayers[playerUuid],
        player => !this.remainingPlayers || this.remainingPlayers[player.uuid],
    )

    this.children.bringToTop(this.axolotl)
    this.children.bringToTop(this.axolotl.axolotlNameTriangle)
    this.children.bringToTop(this.axolotl.axolotlName)
  }

}
