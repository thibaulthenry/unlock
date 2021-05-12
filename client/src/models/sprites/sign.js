import {GameObjects} from 'phaser'
import store from '../../services/store'

export default class Sign extends GameObjects.Sprite {

  constructor(scene, x, y, key) {
    super(scene, x, y, key)
    scene.physics.world.enable(this)
    scene.add.existing(this)
    this.body.setAllowGravity(false)
    scene.children.bringToTop(this)
    this.setScale(0.8, 0.8)

    this.text = scene.add.text(x + 91, y + 52, store.state.client.getFloor(), {fontFamily: '"Brush Script MT"', fontSize: '65px', color: '#ffffff'})
        .setPadding(10, 10, 10, 10)
        .setShadow(-2, 2, "#000000", 15, true, true)
        .setOrigin(0.5, 0.5)
  }

  updateText(text) {
    this.text.setText(text)
  }

}
