import PacketLabels from '@/constants/packet-labels'

export default class PacketServerConnection {

  constructor(payload) {
    this.label = PacketLabels.SERVER_CONNECTION
    this.client = payload.client || null
    this.lobbyCode = payload.lobbyCode || null
  }

  receive(store) {
    store.setClient({ client: this.client })
    store.setLobbyCode({ lobbyCode: this.lobbyCode })
  }

}
