import {GameObjects} from 'phaser'

export default class VegetableSmall extends GameObjects.Sprite {

  constructor(scene, x, y, key) {
    super(scene, x, y, key)
    scene.physics.world.enable(this)
    scene.add.existing(this)
    this.body.setAllowGravity(false)
    this.body.setCircle(20)
    this.body.offset.set(58, 50)
    this.body.pushable = false
    this.setScale(0.6, 0.6)
    this.createAnimations()
  }

  createAnimations() {
    this.anims.create({
      key: 'vegetable-small-explode',
      frames: this.anims.generateFrameNumbers('vegetable-small', {start: 1, end: 11}),
      frameRate: 20,
    })
  }

  destroy() {
    if (this.body && this.body.checkCollision) {
      this.body.checkCollision.none = true
    }

    this.play('vegetable-small-explode', true)
    this.once('animationcomplete', () => {
      super.destroy()
    })
  }

}
