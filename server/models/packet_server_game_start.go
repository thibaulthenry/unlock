package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"time"
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

	game.TimeoutUuids[timeoutUuid] = true

	if game.SceneKey == constants.SceneKeyGameStarWars {
		data := NewDataStarWarsScene()
		game.Data = data

		timeoutUuid = lobby.TimeoutTick(game.Duration, func() error { return nil }, 2000, func(startTime time.Time) (err error) {
			data.CreateStar()
			return NewPacketServerSceneData(data, constants.SceneKeyGameStarWars).Send(lobby)
		})

		game.TimeoutUuids[timeoutUuid] = true
	}

	lobby.Broadcast <- payload

	return lobby.PushToFirestore()
}
