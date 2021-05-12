package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketServerLobbyEnd struct {
	Packet
	Winners map[string]*Client `json:"winners"`
	Losers  map[string]*Client `json:"losers"`
}

func NewPacketServerLobbyEnd(losers map[string]*Client, winners map[string]*Client) *PacketServerLobbyEnd {
	return &PacketServerLobbyEnd{
		Packet: Packet{
			Label: constants.PacketServerLobbyEnd,
		},
		Losers: losers,
		Winners: winners,
	}
}

func (packet *PacketServerLobbyEnd) Send(lobby *Lobby) (err error) {
	payload, err := json.Marshal(packet)
	if err != nil {
		return errors.WithStack(err)
	}

	lobby.State = constants.LobbyStateEnded

	lobby.Broadcast <- payload

	return lobby.PushToFirestore()
}
