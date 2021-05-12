import PacketLabels from '../../constants/packet-labels'

export default class PacketClientSpaceSceneMovement {

  constructor(x, y, r) {
    this.label = PacketLabels.CLIENT_SPACE_SCENE_MOVEMENT
    this.x = x || null
    this.y = y || null
    this.r = r || null
  }

}
