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

  receive(store, sceneKey, playersMap) {
    if (this.sceneKey !== sceneKey) {
      return
    }

    const uuid = store.state.client.uuid

    for (let [clientUuid, axolotl] of playersMap.entries()) {
      if (this.clientUuid !== uuid && this.clientUuid === clientUuid) {
        axolotl.setPosition(this.x, this.y)
        axolotl.updateNamePosition(this.x, this.y - 71)
        axolotl.updateNameTrianglePosition(this.x + 10, this.y - 46)
        axolotl.playAnimations(this.direction, this.jumping, this.walking)
      }
    }
  }

}
