package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketServerSpaceSceneMovement struct {
	Packet
	ClientUuid string  `json:"clientUuid"`
	X          float64 `json:"x"`
	Y          float64 `json:"y"`
	R          float64 `json:"r"`
}

func NewPacketServerSpaceSceneMovement(clientUuid string, x float64, y float64, r float64) *PacketServerSpaceSceneMovement {
	return &PacketServerSpaceSceneMovement{
		Packet: Packet{
			Label: constants.PacketServerSpaceSceneMovement,
		},
		ClientUuid: clientUuid,
		X:          x,
		Y:          y,
		R:          r,
	}
}

func (packet *PacketServerSpaceSceneMovement) Send(lobby *Lobby) (err error) {
	payload, err := json.Marshal(packet)
	if err != nil {
		return errors.WithStack(err)
	}

	lobby.Broadcast <- payload

	return nil
}
