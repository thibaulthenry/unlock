import {GameObjects} from 'phaser'

export default class Basket extends GameObjects.Sprite {

  constructor(scene, x, y, key) {
    super(scene, x, y, key)

    scene.add.existing(this)
    scene.physics.world.enable(this)

    this.setOrigin(0.5, 0.5)
    this.body.setAllowGravity(false)
    this.body.setSize(70, 1, true)
    this.body.collideWorldBounds = true
    this.body.checkCollision.down = false
    this.body.checkCollision.left = false
    this.body.checkCollision.right = false

    scene.basketLeftCircle = scene.add.circle(scene.sceneWidthMiddle - 40, scene.sceneHeightMiddle + 60, 8)
    scene.physics.world.enable(scene.basketLeftCircle)
    scene.basketLeftCircle.setVisible(false)
    scene.basketLeftCircle.body.setImmovable(true)
    scene.basketLeftCircle.body.setCircle(8)
    scene.basketLeftCircle.body.setAllowGravity(false)

    scene.basketRightCircle = scene.add.circle(scene.sceneWidthMiddle + 40, scene.sceneHeightMiddle + 60, 8)
    scene.physics.world.enable(scene.basketRightCircle)
    scene.basketRightCircle.setVisible(false)
    scene.basketRightCircle.body.setImmovable(true)
    scene.basketRightCircle.body.setCircle(8)
    scene.basketRightCircle.body.setAllowGravity(false)
  }

}
