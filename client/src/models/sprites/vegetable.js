import {GameObjects} from 'phaser'

export default class Vegetable extends GameObjects.Sprite {

  constructor(scene, x, y, key) {
    super(scene, x, y, key)
    scene.physics.world.enable(this)
    scene.add.existing(this)
    this.body.setAllowGravity(false)
    this.body.setCircle(35)
    this.body.offset.set(15, 20)
    this.createAnimations()
    this.play('vegetable-loop')
  }

  createAnimations() {
    this.anims.create({
      key: 'vegetable-loop',
      frames: this.anims.generateFrameNumbers('vegetable', {start: 0, end: 196}),
      frameRate: 30,
      repeat: -1
    })

    this.anims.create({
      key: 'vegetable-explode',
      frames: this.anims.generateFrameNumbers('vegetable-explode', {start: 0, end: 8}),
      frameRate: 30,
    })
  }

  destroy() {
    this.play('vegetable-explode', true)
    this.once('animationcomplete', () => {
      super.destroy()
    })
  }

}
