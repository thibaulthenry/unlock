import PacketLabels from '../../constants/packet-labels'

export default class PacketClientSceneStarWarsCollect {

  constructor(starUuid) {
    this.label = PacketLabels.CLIENT_SCENE_STAR_WARS_COLLECT
    this.starUuid = starUuid
  }

}
