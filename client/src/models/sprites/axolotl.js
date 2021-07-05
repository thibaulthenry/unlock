import {GameObjects} from 'phaser'
import SpriteColorCodes from '../../constants/sprite-color-codes'
import SpriteDirections from '../../constants/sprite-directions'

export default class Axolotl extends GameObjects.Sprite {

  constructor(scene, x, y, key, name, color, noGravity, avoidBounds) {
    super(scene, x, y, `${key}-${color}`)

    scene.physics.world.enable(this)
    scene.add.existing(this)

    if (noGravity) {
      this.body.setAllowGravity(false)
    }

    if (!avoidBounds) {
      this.body.collideWorldBounds = true
    }

    this.color = color
    this.coordinates = this.getCoordinates()
    this.cursors = scene.cursors
    this.direction = SpriteDirections.RIGHT
    this.jumping = false
    this.walking = false
    this.createAxolotlAnimations()

    this.axolotlName = this.scene.add.text(x + 50, y - 28, name, {fontSize: '16px', color: '#000000', fontStyle: 'bold'})
        .setOrigin(0.5, 0.5)
        .setVisible(false)

    this.axolotlNameTriangle = this.scene.add.triangle(x + 50, y - 8, -8, -8, 8, -8, 0, 0, SpriteColorCodes[color].hex)
        .setOrigin(0.5, 0.5)
        .setVisible(false)
  }

  createAxolotlAnimations() {
    this.anims.create({
      key: `axolotl-${this.color}-idle-${SpriteDirections.RIGHT}`,
      frames: this.anims.generateFrameNumbers(`axolotl-${this.color}`, {start: 0, end: 0}),
      frameRate: 1,
    })

    this.anims.create({
      key: `axolotl-${this.color}-walk-${SpriteDirections.RIGHT}`,
      frames: this.anims.generateFrameNumbers(`axolotl-${this.color}`, {start: 1, end: 2}),
      frameRate: 6,
      repeat: -1
    })

    this.anims.create({
      key: `axolotl-${this.color}-jump-${SpriteDirections.RIGHT}`,
      frames: this.anims.generateFrameNumbers(`axolotl-${this.color}`, {start: 6, end: 6}),
      frameRate: 6,
    })

    this.anims.create({
      key: `axolotl-${this.color}-idle-${SpriteDirections.LEFT}`,
      frames: this.anims.generateFrameNumbers(`axolotl-${this.color}`, {start: 3, end: 3}),
      frameRate: 1,
    })

    this.anims.create({
      key: `axolotl-${this.color}-walk-${SpriteDirections.LEFT}`,
      frames: this.anims.generateFrameNumbers(`axolotl-${this.color}`, {start: 4, end: 5}),
      frameRate: 6,
      repeat: -1
    })

    this.anims.create({
      key: `axolotl-${this.color}-jump-${SpriteDirections.LEFT}`,
      frames: this.anims.generateFrameNumbers(`axolotl-${this.color}`, {start: 7, end: 7}),
      frameRate: 6,
    })
  }

  destroy() {
    if (this.axolotlName) {
      this.axolotlName.setVisible(false)
    }

    if (this.axolotlNameTriangle) {
      this.axolotlNameTriangle.setVisible(false)
    }

    super.destroy()
  }

  getCoordinates() {
    if (!this.body) {
      return
    }

    return {
      x: this.x,
      y: this.y,
      vx: this.body.velocity.x,
      vy: this.body.velocity.y,
      ax: this.body.acceleration.x,
      ay: this.body.acceleration.y,
      r: this.rotation,
    }
  }

  getChangedCoordinates() {
    if (!this.body || !this.coordinates) {
      return
    }

    const {x, y, vx, vy, ax, ay, r} = this.getCoordinates()

    if (this.coordinates && (
        x !== this.coordinates.x
        || y !== this.coordinates.y
        || vx !== this.coordinates.vx
        || vy !== this.coordinates.vy
        || ax !== this.coordinates.ax
        || ay !== this.coordinates.ay
        || r !== this.coordinates.r)) {
      this.coordinates = {x, y, vx, vy, ax, ay, r}
      return {x, y, vx, vy, ax, ay, r}
    }
  }

  getMotion() {
    return {
      direction: this.direction,
      jumping: this.jumping,
      walking: this.walking
    }
  }

  playAnimations(direction = this.direction, jumping = this.jumping, walking = this.walking) {
    if (!this.anims) {
      return
    }

    if (jumping) {
      this.play(`axolotl-${this.color}-jump-${direction}`, true)
    } else {
      this.play(`axolotl-${this.color}-${walking ? 'walk' : 'idle'}-${direction}`, true)
    }
  }

  setMotion({direction, jumping, walking}) {
    if (direction !== null && direction !== undefined) this.direction = direction
    if (jumping !== null && jumping !== undefined) this.jumping = jumping
    if (walking !== null && walking !== undefined) this.walking = walking
  }

  update() {
    if (!this.body) {
      return
    }

    this.body.setVelocityX(0)
    this.walking = false
    this.jumping = !this.body.onFloor()

    if (this.cursors.left.isDown || this.cursors.KeyA.isDown  || this.cursors.KeyQ.isDown) {
      this.direction = SpriteDirections.LEFT

      if (!this.scene.freezeMovements) {
        this.body.setVelocityX(-200)
        this.walking = true
      }
    }

    if (this.cursors.right.isDown || this.cursors.KeyD.isDown) {
      this.direction = SpriteDirections.RIGHT

      if (!this.scene.freezeMovements) {
        this.body.setVelocityX(200)
        this.walking = true
      }
    }

    if (this.cursors.space.isDown && !this.jumping) {
      if (this.scene.freezeMovements) {
        this.body.setVelocityY(-100)
      } else {
        this.body.setVelocityY(-250)
        this.body.setAccelerationY(5)
      }
    }

    this.playAnimations()
    this.updateNamePosition(this.body.x + 50, this.body.y - 28)
    this.updateNameTrianglePosition(this.body.x + 60, this.body.y - 3)
  }

  updateNamePosition(x, y) {
    this.axolotlName.setVisible(true)
    this.axolotlName.setPosition(x, y)
  }

  updateNameTrianglePosition(x, y) {
    this.axolotlNameTriangle.setVisible(true)
    this.axolotlNameTriangle.setPosition(x, y)
  }

}
