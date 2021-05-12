import {GameObjects} from 'phaser'

export default class Spaceship extends GameObjects.Sprite {

  constructor(scene, x, y, key) {
    super(scene, x, y, key)
    scene.physics.world.enable(this)
    scene.add.existing(this)
    this.setScale(0.4, 0.4)
    this.setDepth(1)
    this.body.setAllowGravity(false)
  }

}
