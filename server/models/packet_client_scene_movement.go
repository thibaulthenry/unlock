package models

import (
	"unlock/constants"
)

type PacketClientSceneMovement struct {
	Packet
	Coordinates *Coordinates       `json:"coordinates"`
	Motion      *Motion            `json:"motion"`
	SceneKey    constants.SceneKey `json:"sceneKey"`
}

func (packet *PacketClientSceneMovement) Receive(client *Client) (err error) {
	return NewPacketServerSceneMovement(packet.Coordinates, client.Uuid, packet.Motion, packet.SceneKey).Send(client.Lobby)
}
