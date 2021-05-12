package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketServerLobbyCollapse struct {
	Packet
}

func NewPacketServerLobbyCollapse() *PacketServerLobbyCollapse {
	return &PacketServerLobbyCollapse{
		Packet: Packet{
			Label: constants.PacketServerLobbyCollapse,
		},
	}
}

func (packet *PacketServerLobbyCollapse) Send(lobby *Lobby) (err error) {
	payload, err := json.Marshal(packet)
	if err != nil {
		return errors.WithStack(err)
	}

	lobby.Broadcast <- payload

	return nil
}
