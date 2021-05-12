import PacketLabels from '../../constants/packet-labels'

export default class PacketServerSpaceSceneMovement {

  constructor(packet) {
    this.label = PacketLabels.SERVER_SPACE_SCENE_MOVEMENT
    this.clientUuid = packet.clientUuid || null
    this.x = packet.x || null
    this.y = packet.y || null
    this.r = packet.r || null
  }

  receive(otherPlayers) {
    otherPlayers.getChildren().forEach(otherPlayer => {
      if (this.clientUuid === otherPlayer.clientUuid) {
        otherPlayer.setRotation(this.r)
        otherPlayer.setPosition(this.x, this.y)
      }
    })
  }

}
