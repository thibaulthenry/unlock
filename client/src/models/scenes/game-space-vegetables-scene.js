import {Actions, Geom, Math as PhaserMath, Scene} from 'phaser'
import Laser from '../sprites/laser'
import lodash from 'lodash'
import SceneKeys from '../../constants/scene-keys'
import SceneUtils from './scene-utils'
import Spaceship from '../sprites/spaceship'
import store from '../../services/store'
import Vegetable from '../sprites/vegetable'
import VegetableSmall from '../sprites/vegetable-small'
import PacketClientWin from '../packets/packet-client-win'

export default class GameSpaceVegetablesScene extends Scene {

  constructor() {
    super({
      key: SceneKeys.GAME_SPACE_VEGETABLES,
      physics: {
        arcade: {
          debug: false,
        }
      }
    })
  }

  create() {
    // Data

    this.sceneWidth = this.scale.width
    this.sceneWidthMiddle = this.scale.width / 2
    this.sceneHeight = this.scale.height
    this.sceneHeightMiddle = this.scale.height / 2

    // Background

    SceneUtils.createBackground(this, 'sky', 'sky-galaxy', 1, 0)

    // Sprites

    this.vegetable = new Vegetable(this, this.sceneWidthMiddle, this.sceneHeightMiddle, 'vegetable')

    this.vegetableSmallFirst = this.physics.add.group()
    this.vegetableSmallFirst.addMultiple(this.createVegetableSmalls(18))
    Actions.PlaceOnCircle(this.vegetableSmallFirst.getChildren(), new Geom.Circle(this.sceneWidthMiddle, this.sceneHeightMiddle, 100))

    this.vegetableSmallSecond = this.physics.add.group()
    this.vegetableSmallSecond.addMultiple(this.createVegetableSmalls(30))
    Actions.PlaceOnCircle(this.vegetableSmallSecond.getChildren(), new Geom.Circle(this.sceneWidthMiddle, this.sceneHeightMiddle, 150))

    this.spaceship = new Spaceship(this, this.sceneWidthMiddle, this.sceneHeight - 50, 'spaceship-black')
    this.laserGroup = this.add.group()

    // Physics

    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.physics.world.on('worldbounds', (event) => event.gameObject.destroy())

    this.physics.world.addCollider(this.vegetableSmallFirst, this.laserGroup, (vegetableSmallGameObject, laserGameObject) => {
      this.laserGroup.remove(laserGameObject)
      this.vegetableSmallFirst.remove(vegetableSmallGameObject)
      laserGameObject.destroy()
      vegetableSmallGameObject.destroy()
    })

    this.physics.world.addCollider(this.vegetableSmallSecond, this.laserGroup, (vegetableSmallGameObject, laserGameObject) => {
      this.laserGroup.remove(laserGameObject)
      this.vegetableSmallSecond.remove(vegetableSmallGameObject)
      laserGameObject.destroy()
      vegetableSmallGameObject.destroy()
    })

    this.physics.world.addCollider(this.vegetable, this.laserGroup, (vegetableGameObject, laserGameObject) => {
      this.laserGroup.clear(true)
      laserGameObject.destroy()
      vegetableGameObject.destroy()
      this.gameWon = true
      store.dispatch('sendPacket', new PacketClientWin())
      this.vegetableSmallFirst.clear(true)
      this.vegetableSmallSecond.clear(true)
    })

    // Camera

    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.fadeIn(200, 0, 0, 0)

    // Inputs

    this.input.on('pointermove', (pointer) => {
      const {angle, x, y} = this.locateFromMiddle(Math.max(100, Math.min(500, pointer.x)))
      this.spaceship.setAngle(angle)
      this.spaceship.setPosition(x, y)
    }, this)

    this.throttledCreateLaser = lodash.throttle(
        (pointer) =>this.laserGroup.add(new Laser(this, this.spaceship.x, this.spaceship.y, this.locateFromMiddle(Math.max(100, Math.min(500, pointer.x))).angle, 'laser')),
        400
    )

    this.input.on('pointerdown', this.throttledCreateLaser)
  }

  createVegetableSmalls(number) {
    const vegetableSmalls = []

    for (let i = 0; i < number; i++) {
      vegetableSmalls.push(new VegetableSmall(this, 0, 0, 'vegetable-small'))
    }

    return vegetableSmalls
  }

  handlePacket(packet) {
    // noinspection JSIgnoredPromiseFromCall
    store.dispatch('handlePacket', packet)
  }

  locateFromMiddle(x) {
    const angle = Math.acos((x - this.sceneWidthMiddle) / 250)
    const y = this.sceneHeightMiddle + 250 * Math.sin(angle)

    return {
      angle: PhaserMath.RAD_TO_DEG * PhaserMath.Angle.Between(this.sceneWidthMiddle, this.sceneHeightMiddle, x, y) - 90,
      x,
      y
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

    this.load.image('sky-galaxy', '../assets/scenes/game-space-vegetables/sky.png')

    // Sprites

    this.load.spritesheet('laser', '../assets/sprites/spaceships/laser.png', {
      frameWidth: 13,
      frameHeight: 37
    })
    this.load.spritesheet('spaceship-black', '../assets/sprites/spaceships/spaceship_black.png', {
      frameWidth: 97,
      frameHeight: 84
    })
    this.load.spritesheet('vegetable', '../assets/sprites/vegetables/vegetable.png', {
      frameWidth: 100,
      frameHeight: 100
    })
    this.load.spritesheet('vegetable', '../assets/sprites/vegetables/vegetable.png', {
      frameWidth: 100,
      frameHeight: 100
    })
    this.load.spritesheet('vegetable-explode', '../assets/sprites/vegetables/vegetable_explode.png', {
      frameWidth: 400,
      frameHeight: 400
    })
    this.load.spritesheet('vegetable-small', '../assets/sprites/vegetables/vegetable_small.png', {
      frameWidth: 155,
      frameHeight: 140
    })
  }

  update(time, delta) {
    if (this.gameWon) {
      Actions.Call(this.vegetableSmallFirst.getChildren(), (item) => {
        item.body.setVelocity(item.body.x - this.sceneWidthMiddle, item.body.y - this.sceneHeightMiddle)
        item.body.velocity.multiply({x: 5, y: 5})
      }, this)

      Actions.Call(this.vegetableSmallSecond.getChildren(), (item) => {
        item.body.setVelocity(item.body.x - this.sceneWidthMiddle, item.body.y - this.sceneHeightMiddle)
        item.body.velocity.multiply({x: 5, y: 5})
      }, this)
    } else {
      Actions.RotateAroundDistance(this.vegetableSmallFirst.children.getArray(), {
        x: this.sceneWidthMiddle,
        y: this.sceneHeightMiddle
      }, delta * -0.0020, 100)

      Actions.RotateAroundDistance(this.vegetableSmallSecond.children.getArray(), {
        x: this.sceneWidthMiddle,
        y: this.sceneHeightMiddle
      }, delta * 0.0014, 150)

      this.laserGroup.children.each((laser) => this.physics.moveTo(laser, this.sceneWidthMiddle, this.sceneHeightMiddle, 280), this)
    }
  }

}
