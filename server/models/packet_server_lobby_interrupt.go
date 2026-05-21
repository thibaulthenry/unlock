package models

import (
	"encoding/json"
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
		return err
	}

	lobby.InterruptAllTimeouts()
	lobby.State = constants.LobbyStatePending

	lobby.Broadcast <- payload

	return nil
}
