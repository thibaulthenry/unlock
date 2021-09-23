import {Input, Scene} from 'phaser'
import PacketClientSceneMovement from '../../models/packets/packet-client-scene-movement'
import PacketClientSceneStarWarsCollect from '../../models/packets/packet-client-scene-star-wars-collect'
import PacketLabels from '../../constants/packet-labels'
import PacketServerSceneData from '../../models/packets/packet-server-scene-data'
import PacketServerSceneMovement from '../../models/packets/packet-server-scene-movement'
import SceneKeys from '../../constants/scene-keys'
import SceneUtils from '../../models/scenes/scene-utils'
import Spaceship from '../../models/sprites/spaceship'
import Star from '../../models/sprites/star'
import store from '../../services/store'

export default class GameStarWarsScene extends Scene {

  spaceshipMap = new Map()
  starMap = new Map()

  constructor() {
    super({
      key: SceneKeys.GAME_STAR_WARS,
      physics: {
        arcade: {
          debug: false,
        }
      }
    })
  }

  create() {
    // Data

    this.sceneWidth = this.scale.width * 2
    this.sceneHeight = this.scale.height * 2

    // Background

    this.createBackground('star-wars-0', 2, 1)
    this.createBackground('star-wars-1', 2, 0.8)
    this.createBackground('star-wars-2', 2, 0.65)
    this.createBackground('star-wars-3', 1, 0.5)
    this.createBackground('star-wars-4', 1, 0.35)
    this.createBackground('star-wars-5', 2, 0.20)
    this.createBackground('star-wars-6', 1, 0.1)
    this.createBackground('star-wars-7', 2, 1)

    // Sprites

    this.spaceship = new Spaceship(this, this.sceneWidth / 2, this.sceneHeight / 2, 'spaceship', store.state.client.name, store.state.client.spriteColor, 0)
    this.spaceshipMap.set(store.state.client.uuid, this.spaceship)
    this.starGroup = this.physics.add.group()

    // Physics

    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.noMotion = {direction: false, jumping: false, walking: false}

    this.physics.world.addOverlap(this.spaceship, this.starGroup, (spaceshipGameObject, starGameObject) => {
      // noinspection JSIgnoredPromiseFromCall
      store.dispatch('sendPacket', new PacketClientSceneStarWarsCollect(starGameObject.getData('uuid')))
    })

    // Camera

    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.startFollow(this.spaceship, true)
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Time

    this.time.addEvent({
      callback: this.updateSpaceshipSprites,
      callbackScope: this,
      delay: 500,
      loop: true,
      paused: false
    })

    this.time.addEvent({
      callback: this.updateSpaceshipStarCount,
      callbackScope: this,
      delay: 50,
      loop: true,
      paused: false
    })
  }

  createBackground(key, count, scrollFactor) {
    SceneUtils.createBackground(this, key, key, count, scrollFactor, scrollFactor)
    SceneUtils.createBackgroundPositioned(this, this.scale.height * 2, key, key, count, scrollFactor, scrollFactor)
  }

  handlePacket(packet) {
    // noinspection JSIgnoredPromiseFromCall
    store.dispatch('handlePacket', packet)

    switch (packet.label) {
      case PacketLabels.SERVER_SCENE_DATA:
        new PacketServerSceneData(packet).receive(
            SceneKeys.GAME_STAR_WARS,
            packet => this.updateStarSprites(packet)
        )
        break
      case PacketLabels.SERVER_SCENE_MOVEMENT:
        new PacketServerSceneMovement(packet).receive(
            SceneKeys.GAME_STAR_WARS,
            packet => this.handleSpaceshipMovement(packet)
        )
        break
    }
  }

  handleSpaceshipMovement(packet) {
    const uuid = store.state.client.uuid

    for (let [clientUuid, spaceship] of this.spaceshipMap.entries()) {
      if (packet.clientUuid !== uuid && packet.clientUuid === clientUuid) {
        spaceship.setPosition(packet.x, packet.y)
        spaceship.setRotation(packet.r)
        spaceship.updateNamePosition(packet.x - 1, packet.y - 46)
        spaceship.updateNameTrianglePosition(packet.x + 8, packet.y - 20)
        spaceship.updateStarCountPosition(packet.x, packet.y - 66)
      }
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

    this.load.image('star-wars-0', '../assets/scenes/game-star-wars/star_wars_0.png')
    this.load.image('star-wars-1', '../assets/scenes/game-star-wars/star_wars_1.png')
    this.load.image('star-wars-2', '../assets/scenes/game-star-wars/star_wars_2.png')
    this.load.image('star-wars-3', '../assets/scenes/game-star-wars/star_wars_3.png')
    this.load.image('star-wars-4', '../assets/scenes/game-star-wars/star_wars_4.png')
    this.load.image('star-wars-5', '../assets/scenes/game-star-wars/star_wars_5.png')
    this.load.image('star-wars-6', '../assets/scenes/game-star-wars/star_wars_6.png')
    this.load.image('star-wars-7', '../assets/scenes/game-star-wars/star_wars_7.png')

    // Sprites

    this.load.spritesheet('spaceship', '../assets/sprites/spaceships/spaceship_red.png', {
      frameWidth: 106,
      frameHeight: 80
    })

    this.load.spritesheet('star', '../assets/sprites/star/star.png', {
      frameWidth: 512,
      frameHeight: 512
    })

    // Audio

    // Inputs

    this.cursors = this.input.keyboard.createCursorKeys()
    this.cursors.KeyQ = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.Q);
    this.cursors.KeyA = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.A);
    this.cursors.KeyZ = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.Z);
    this.cursors.KeyW = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.W);
    this.cursors.KeyD = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.D);
  }

  update(time, delta) {
    this.spaceship.update(time, delta)

    this.spaceshipCoordinates = this.spaceship.getChangedCoordinates();

    if (this.spaceshipCoordinates) {
      // noinspection JSIgnoredPromiseFromCall
      store.dispatch('sendPacket', new PacketClientSceneMovement(this.spaceshipCoordinates, this.noMotion, SceneKeys.GAME_STAR_WARS))
    }
  }

  updateSpaceshipSprites() {
    SceneUtils.updatePlayersSprites(
        this.spaceshipMap,
        player => new Spaceship(
            this,
            this.sceneWidth / 2,
            this.sceneHeight / 2,
            'spaceship',
            player.name,
            player.spriteColor,
            0
        )
    )

    this.children.bringToTop(this.spaceship)
    this.children.bringToTop(this.spaceship.spaceshipNameTriangle)
    this.children.bringToTop(this.spaceship.spaceshipName)
  }

  updateSpaceshipStarCount() {
    if (!(store.state.game && store.state.game.data && store.state.game.data.points)) {
      return
    }

    Object.entries(store.state.game.data.points).forEach(([key, value]) => {
      if (this.spaceshipMap.has(key)) {
        this.spaceshipMap.get(key).updateStarCount(value)
      }
    })
  }

  updateStarSprites(packet) {
    if (packet && packet.data && packet.data.stars) {
      SceneUtils.updateMap(
          packet.data.stars,
          this.starMap,
          star => {
            const sprite = new Star(this, star.coordinates.x, star.coordinates.y, 'star')
            sprite.setData('uuid', star.uuid)
            this.starGroup.add(sprite)
            return sprite
          }
      )
    }
  }

}
