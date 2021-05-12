package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketServerGameStart struct {
	Packet
}

func NewPacketServerGameStart() *PacketServerGameStart {
	return &PacketServerGameStart{
		Packet: Packet{
			Label: constants.PacketServerGameStart,
		},
	}
}

func (packet *PacketServerGameStart) Send(lobby *Lobby) (err error) {
	payload, err := json.Marshal(packet)
	if err != nil {
		return errors.WithStack(err)
	}

	game, exists := lobby.CurrentGame()

	if exists {
		game.State = constants.GameStateStarted
	}

	lobby.TimeoutTick(constants.TimeoutTypeGameStart, game.Duration, func() (err error) {
		if lobby.State == constants.LobbyStateStarted && game.State == constants.GameStateStarted {
			return NewPacketServerGameWait().Send(lobby)
		}

		return nil
	})

	lobby.Broadcast <- payload

	return lobby.PushToFirestore()
}
