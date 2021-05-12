import {GameObjects} from 'phaser'

export default class Laser extends GameObjects.Sprite {

  constructor(scene, x, y, angle, key) {
    super(scene, x, y, key)

    scene.physics.world.enable(this)
    scene.add.existing(this)

    this.setAngle(angle)
    this.body.setCircle(5)
    this.body.offset.set(0, this.height / 2)
    this.body.onWorldBounds = true
    this.body.collideWorldBounds = true
    this.setScale(0.8, 0.6)
  }

}
