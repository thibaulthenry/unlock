import PacketLabels from '@/constants/packet-labels'

export default class PacketClientSceneBrawlBombHit {

  constructor(bombKey) {
    this.label = PacketLabels.CLIENT_SCENE_BRAWL_BOMB_HIT
    this.bombKey = bombKey
  }

}
