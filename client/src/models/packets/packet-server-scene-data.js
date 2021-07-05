import PacketLabels from '../../constants/packet-labels'

export default class PacketServerSceneData {

  constructor(packet) {
    this.label = PacketLabels.SERVER_SCENE_DATA
    this.data = packet.data || null
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

