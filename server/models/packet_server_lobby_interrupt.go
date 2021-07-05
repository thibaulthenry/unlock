package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketServerLobbyInterrupt struct {
	Packet
}

func NewPacketServerLobbyInterrupt() *PacketServerLobbyInterrupt {
	return &PacketServerLobbyInterrupt{
		Packet: Packet{
			Label: constants.PacketServerLobbyInterrupt,
		},
	}
}

func (packet *PacketServerLobbyInterrupt) Send(lobby *Lobby) (err error) {
	payload, err := json.Marshal(packet)
	if err != nil {
		return errors.WithStack(err)
	}

	lobby.InterruptAllTimeouts()
	lobby.State = constants.LobbyStatePending

	lobby.Broadcast <- payload

	return nil
}
