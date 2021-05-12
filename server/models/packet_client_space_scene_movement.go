package models

type PacketClientSpaceSceneMovement struct {
	Packet
	X          float64 `json:"x"`
	Y          float64 `json:"y"`
	R          float64 `json:"r"`
}

func (packet *PacketClientSpaceSceneMovement) Receive(client *Client) (err error) {
	return NewPacketServerSpaceSceneMovement(client.Uuid, packet.X, packet.Y, packet.R).Send(client.Lobby)
}
