import PacketLabels from '../../constants/packet-labels'

export default class PacketServerSceneMovement {

  // noinspection DuplicatedCode
  constructor(packet) {
    this.label = PacketLabels.SERVER_SCENE_MOVEMENT
    this.clientUuid = packet.clientUuid || null
    this.x = packet.coordinates?.x || null
    this.y = packet.coordinates?.y || null
    this.vx = packet.coordinates?.vx || null
    this.vy = packet.coordinates?.vy || null
    this.ax = packet.coordinates?.ax || null
    this.ay = packet.coordinates?.ay || null
    this.r = packet.coordinates?.r || null
    this.direction = packet.motion?.direction || null
    this.jumping = packet.motion?.jumping || null
    this.walking = packet.motion?.walking || null
    this.sceneKey = packet.sceneKey || null
  }

  receive(sceneKey, callback) {
    if (this.sceneKey !== sceneKey) {
      return
    }

    if (typeof callback === 'function') {
      callback(this)
    }
  }

}
