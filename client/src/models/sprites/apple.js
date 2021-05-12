import {GameObjects} from 'phaser'
import PacketClientWin from '../packets/packet-client-win'
import store from '../../services/store'

export default class Apple extends GameObjects.Sprite {

  constructor(scene, x, y, key) {
    super(scene, x, y, key)

    scene.add.existing(this)
    scene.physics.world.enable(this)

    this.body.setAllowGravity(false)
    this.body.onWorldBounds = true
    this.body.collideWorldBounds = true
    this.body.offset.x = 0
    this.body.offset.y = 8
    this.body.setCircle(16)
    this.body.bounce.set(0.8)

    scene.time.delayedCall(300, (appleGameObject) => {
      if (appleGameObject.body) appleGameObject.body.setAllowGravity(true)
    }, [this])

    scene.physics.world.addCollider(scene.basketLeftCircle, this, (_, appleGameObject) => {
      appleGameObject.body.setAngularAcceleration(-200)
    })
    scene.physics.world.addCollider(scene.basketRightCircle, this, (_, appleGameObject) => {
      appleGameObject.body.setAngularAcceleration(200)
    })

    scene.physics.world.addCollider(scene.basket, this, (basketGameObject, appleGameObject) => {
      appleGameObject.destroy()

      if (scene.appleCount < 7) {
        basketGameObject.setTexture(`basket_${++scene.appleCount}`)
        scene.knockback = true

        if (scene.knockbackTimer) {
          scene.knockbackTimer.remove()
        }

        scene.knockbackTimer = scene.time.delayedCall(550, (callbackScene) => callbackScene.knockback = false, [scene])
      }

      if (scene.appleCount > 6) {
        // noinspection JSIgnoredPromiseFromCall
        store.dispatch('sendPacket', new PacketClientWin())
        scene.scene.pause()
      }
    })
  }
}
