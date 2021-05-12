import {Math, Scene} from 'phaser'
import Apple from '../sprites/apple'
import Basket from '../sprites/basket'
import SceneKeys from '../../constants/scene-keys'
import SceneUtils from './scene-utils'
import store from '../../services/store'

export default class GameFallingApplesScene extends Scene {

  constructor() {
    super({
      key: SceneKeys.GAME_FALLING_APPLES,
      physics: {
        arcade: {
          debug: false,
          gravity: {
            y: 1000
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

    this.appleCount = 0
    this.knockback = 0
    this.sceneWidth = this.scale.width * 1.25
    this.sceneWidthMiddle = this.sceneWidth / 2
    this.sceneHeight = this.scale.height
    this.sceneHeightMiddle = this.sceneHeight / 2 - 50

    // Background

    SceneUtils.createBackground(this, 'sky', 'sky', 1, 0)
    SceneUtils.createBackground(this, 'far', 'far', 1, 0.1)
    SceneUtils.createBackground(this, 'back', 'back', 1, 0.25)
    SceneUtils.createBackground(this, 'front_0', 'front_0', 2, 1)
    SceneUtils.createBackground(this, 'front_1', 'front_1', 2, 1)
    SceneUtils.createBackground(this, 'ground', 'ground_grass', 2, 1)
    this.backgroundTextures['front_1'].forEach(image => image.setDepth(1))
    this.backgroundTextures['ground'].forEach(image => image.setDepth(1))

    // Sprites

    this.basket = new Basket(this, this.sceneWidthMiddle, this.sceneHeightMiddle + 50, 'basket_0')

    // Physics

    this.physics.world.setBounds(0, 100, this.sceneWidth, this.sceneHeight)
    this.physics.world.on('worldbounds', (event) => event.gameObject.destroy())

    // Camera

    this.cameras.main.setBounds(0, 0, this.sceneWidth, this.sceneHeight)
    this.cameras.main.startFollow(this.basket, true)
    this.cameras.main.fadeIn(200, 0, 0, 0)

    // Time

    this.time.addEvent({
      delay: 1200,
      callback: (scene) => new Apple(scene, Math.Between(50, scene.sceneWidth), 75, 'apple'),
      args: [this],
      loop: true,
      paused: false
    })
  }

  handlePacket(packet) {
    // noinspection JSIgnoredPromiseFromCall
    store.dispatch('handlePacket', packet)
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

    this.load.image('back', '../assets/scenes/game-falling-apples/back.png')
    this.load.image('far', '../assets/scenes/game-falling-apples/far.png')
    this.load.image('front_0', '../assets/scenes/game-falling-apples/front_0.png')
    this.load.image('front_1', '../assets/scenes/game-falling-apples/front_1.png')
    this.load.image('ground_grass', '../assets/scenes/game-falling-apples/ground.png')
    this.load.image('sky', '../assets/scenes/game-falling-apples/sky.png')
    this.load.image('basket_0', '../assets/sprites/baskets/basket_apple_0.png')
    this.load.image('basket_1', '../assets/sprites/baskets/basket_apple_1.png')
    this.load.image('basket_2', '../assets/sprites/baskets/basket_apple_2.png')
    this.load.image('basket_3', '../assets/sprites/baskets/basket_apple_3.png')
    this.load.image('basket_4', '../assets/sprites/baskets/basket_apple_4.png')
    this.load.image('basket_5', '../assets/sprites/baskets/basket_apple_5.png')
    this.load.image('basket_6', '../assets/sprites/baskets/basket_apple_6.png')
    this.load.image('basket_7', '../assets/sprites/baskets/basket_apple_7.png')
    this.load.image('apple', '../assets/sprites/apples/apple.png')
  }

  update() {
    this.input.mousePointer.updateWorldPoint(this.cameras.main)
    this.pointerDistance = Math.Distance.Between(this.basket.body.x, this.basket.body.y, this.input.mousePointer.worldX, this.input.mousePointer.worldY)

    if (this.basket.body.y < this.sceneHeightMiddle) {
      this.basket.body.y = this.sceneHeightMiddle
    }

    if (this.pointerDistance >= 50) {
      if (this.knockback) {
        this.physics.accelerateTo(this.basket, this.input.mousePointer.worldX, this.input.mousePointer.worldY, 800, 300, 300)
      } else {
        this.basket.body.setMaxVelocity(10000, 10000)
        this.physics.moveTo(this.basket, this.input.mousePointer.worldX, this.input.mousePointer.worldY, 100, 300)
      }
    } else {
      this.basket.body.velocity.multiply(new Math.Vector2(0.96, this.knockback ? 1 : 0.94))
      this.basket.body.acceleration.multiply(new Math.Vector2(0.90, this.knockback ? 1 : 0.9))
    }

    this.physics.moveTo(this.basketLeftCircle, this.basket.body.x - 8, this.basket.body.position.y - 3, 100, 25)
    this.physics.moveTo(this.basketRightCircle, this.basket.body.x + 78, this.basket.body.position.y - 3, 100, 25)
  }

}
