import {GameObjects} from 'phaser'

export default class Star extends GameObjects.Sprite {

  constructor(scene, x, y, key) {
    super(scene, x, y, key)
    scene.physics.world.enable(this)
    scene.add.existing(this)
    this.body.setAllowGravity(false)
    this.body.setCircle(80)
    this.body.offset.set(175, 190)
    this.body.pushable = false
    this.body.bounce = 0
    this.setScale(0.125, 0.125)
  }

  destroy() {
    if (this.body && this.body.checkCollision) {
      this.body.checkCollision.none = true
    }

    super.destroy()
  }

}
