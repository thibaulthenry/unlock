import PacketLabels from '@/constants/packet-labels'

export default class PacketClientSceneBrawlPunch {

  constructor(x, y, directionRight) {
    this.label = PacketLabels.CLIENT_SCENE_BRAWL_PUNCH
    this.x = x
    this.y = y
    this.directionRight = directionRight
  }

}
