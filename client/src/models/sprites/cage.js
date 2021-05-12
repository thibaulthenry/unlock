import {GameObjects} from 'phaser'

export default class Cage extends GameObjects.Sprite {

  constructor(scene, x, y, key, animate = true) {
    super(scene, x, y, key)
    scene.physics.world.enable(this)
    scene.add.existing(this)
    this.body.setAllowGravity(false)
    this.createAnimations()

    if (animate) {
      scene.time.delayedCall(2000, () => {
        this.play('cage-lock', true)
        scene.sound.play('cage-lock')
      })
    } else {
      this.setFrame(10)
    }

    scene.children.bringToTop(this)
  }

  createAnimations() {
    this.anims.create({
      key: 'cage-lock',
      frames: this.anims.generateFrameNumbers('cage', {start: 0, end: 10}),
      frameRate: 30,
    })
  }

}
