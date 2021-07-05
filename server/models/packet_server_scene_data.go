package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketServerSceneData struct {
	Packet
	Data     interface{}        `json:"data"`
	SceneKey constants.SceneKey `json:"sceneKey"`
}

func NewPacketServerSceneData(data interface{}, sceneKey constants.SceneKey) *PacketServerSceneData {
	return &PacketServerSceneData{
		Packet: Packet{
			Label: constants.PacketServerSceneData,
		},
		Data:     data,
		SceneKey: sceneKey,
	}
}

func (packet *PacketServerSceneData) Send(lobby *Lobby) (err error) {
	payload, err := json.Marshal(packet)
	if err != nil {
		return errors.WithStack(err)
	}

	lobby.Broadcast <- payload

	return lobby.PushToFirestore()
}
