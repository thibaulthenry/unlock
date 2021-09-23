import {GameObjects, Math} from 'phaser'
import SpriteColorCodes from '../../constants/sprite-color-codes'

export default class Spaceship extends GameObjects.Sprite {

  constructor(scene, x, y, key, name, color, starCount) {
    super(scene, x, y, key)
    scene.physics.world.enable(this)
    scene.add.existing(this)
    this.setScale(0.4, 0.4)
    this.setDepth(1)
    this.body.setAllowGravity(false)
    this.body.setMaxVelocity(300, 300)
    this.body.collideWorldBounds = true

    this.coordinates = this.getCoordinates()
    this.cursors = scene.cursors
    this.physics = scene.physics

    if (!name) {
      return
    }

    this.spaceshipName = this.scene.add.text(x + 20, y - 38, name, {fontSize: '16px', color: '#ffffff', fontStyle: 'bold'})
        .setOrigin(0.5, 0.5)
        .setVisible(false)

    this.spaceshipNameTriangle = this.scene.add.triangle(x + 20, y - 4, -8, -8, 8, -8, 0, 0, SpriteColorCodes[color].hex)
        .setOrigin(0.5, 0.5)
        .setVisible(false)

    if (starCount === undefined || starCount === null) {
      return
    }

    this.spaceshipStarCount = this.scene.add.text(x + 21, y - 58, '' + starCount, {fontSize: '16px', color: '#ffffff', fontStyle: 'bold'})
        .setOrigin(0.5, 0.5)
        .setVisible(false)
  }

  destroy() {
    if (this.spaceshipName) {
      this.spaceshipName.setVisible(false)
    }

    if (this.spaceshipNameTriangle) {
      this.spaceshipNameTriangle.setVisible(false)
    }

    if (this.spaceshipStarCount) {
      this.spaceshipStarCount.setVisible(false)
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
    if (!(this.body && this.coordinates)) {
      return
    }

    const {x, y, vx, vy, ax, ay, r} = this.getCoordinates()

    if (this.coordinates && !(
        x === this.coordinates.x
        && y === this.coordinates.y
        && vx === this.coordinates.vx
        && vy === this.coordinates.vy
        && ax === this.coordinates.ax
        && ay === this.coordinates.ay
        && r === this.coordinates.r)) {
      this.coordinates = {x, y, vx, vy, ax, ay, r}
      return {x, y, vx, vy, ax, ay, r}
    }
  }

  update() {
    if (!this.body) {
      return
    }

    if (this.cursors.left.isDown || this.cursors.KeyA.isDown  || this.cursors.KeyQ.isDown) {
      this.body.setAngularVelocity(-350)
    } else if (this.cursors.right.isDown || this.cursors.KeyD.isDown) {
      this.body.setAngularVelocity(350)
    } else {
      this.body.setAngularVelocity(0)
    }

    if (this.cursors.up.isDown || this.cursors.KeyZ.isDown  || this.cursors.KeyW.isDown) {
      this.physics.velocityFromRotation(this.rotation + 1.5, 600, this.body.acceleration)
    } else {
      this.body.setAcceleration(0, 0)
      this.body.velocity.multiply(new Math.Vector2(0.95, 0.95))
      this.body.acceleration.multiply(new Math.Vector2(0.95, 0.95))
    }

    if (this.spaceshipName) {
      this.updateNamePosition(this.body.x + 20, this.body.y - 30)
      this.updateNameTrianglePosition(this.body.x + 30, this.body.y - 4)

      if (this.spaceshipStarCount) {
        this.updateStarCountPosition(this.body.x + 21, this.body.y - 50)
      }
    }
  }

  updateNamePosition(x, y) {
    this.spaceshipName.setVisible(true)
    this.spaceshipName.setPosition(x, y)
  }

  updateNameTrianglePosition(x, y) {
    this.spaceshipNameTriangle.setVisible(true)
    this.spaceshipNameTriangle.setPosition(x, y)
  }

  updateStarCountPosition(x, y) {
    this.spaceshipStarCount.setVisible(true)
    this.spaceshipStarCount.setPosition(x, y)
  }

  updateStarCount(starCount = 0) {
    this.spaceshipStarCount.setText('' + starCount)
  }

}
