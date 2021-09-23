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

	if !exists {
		return
	}

	game.State = constants.GameStateStarted

	timeoutUuid := lobby.TimeoutTickCountdown(game.Duration, func() (err error) {
		if lobby.State == constants.LobbyStateStarted && game.State == constants.GameStateStarted {
			return NewPacketServerGameWait(false).Send(lobby)
		}

		return nil
	})

	game.AddTimeoutUuid(timeoutUuid)

	err = game.HandleGameData(lobby)
	if err != nil {
		return err
	}

	if lobby.State == constants.LobbyStateStarted {
		lobby.Broadcast <- payload
	}

	return lobby.PushToFirestore()
}
