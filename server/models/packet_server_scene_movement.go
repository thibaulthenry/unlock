package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketServerSceneMovement struct {
	Packet
	Coordinates *Coordinates       `json:"coordinates"`
	ClientUuid  string             `json:"clientUuid"`
	Motion      *Motion            `json:"motion"`
	SceneKey    constants.SceneKey `json:"sceneKey"`
}

func NewPacketServerSceneMovement(coordinates *Coordinates, clientUuid string, motion *Motion, sceneKey constants.SceneKey) *PacketServerSceneMovement {
	return &PacketServerSceneMovement{
		Packet: Packet{
			Label: constants.PacketServerSceneMovement,
		},
		Coordinates: coordinates,
		ClientUuid:  clientUuid,
		Motion:      motion,
		SceneKey:    sceneKey,
	}
}

func (packet *PacketServerSceneMovement) Send(lobby *Lobby) (err error) {
	payload, err := json.Marshal(packet)
	if err != nil {
		return errors.WithStack(err)
	}

	lobby.Broadcast <- payload

	return nil
}
