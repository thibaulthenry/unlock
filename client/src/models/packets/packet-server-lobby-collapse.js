import PacketLabels from '../../constants/packet-labels'

export default class PacketServerLobbyCollapse {

  constructor() {
    this.label = PacketLabels.SERVER_LOBBY_COLLAPSE
  }

  receive(scene) {
    scene.cameras.main.shake(5000, 0.002)
    scene.sound.play('earthquake')

    scene.backgroundTextures['ground'].forEach(image => {
      scene.time.delayedCall(500, () => image.setTexture('ground-cracked-0'))
      scene.time.delayedCall(2500, () => image.setTexture('ground-cracked-1'))
      scene.time.delayedCall(4500, () => image.setTexture('ground-cracked-2'))
    })

    scene.time.delayedCall(5000, () => {
      scene.sound.play('landslide')
      scene.freezeMovements = true
      scene.createCageSprites()
      scene.physics.world.setBounds(0, 0, scene.sceneWidth, scene.sceneHeight * 2 - 50)
      scene.cameras.main.setBounds(0, 0, scene.sceneWidth, scene.sceneHeight * 2)
      scene.time.delayedCall(500, () => {
        scene.cameras.main.shake(0)
        scene.sound.stopByKey('earthquake')
      })
    })
  }

}

