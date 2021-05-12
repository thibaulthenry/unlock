package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketServerGameWait struct {
	Packet
	Points          map[string]int  `json:"points"`
	PreviousWinners map[string]bool `json:"previousWinners"`
}

func NewPacketServerGameWait() *PacketServerGameWait {
	return &PacketServerGameWait{
		Packet: Packet{
			Label: constants.PacketServerGameWait,
		},
		Points:          make(map[string]int),
		PreviousWinners: make(map[string]bool),
	}
}

func (packet *PacketServerGameWait) Send(lobby *Lobby) (err error) {
	if lobby.State == constants.LobbyStateStartingImminent {
		lobby.State = constants.LobbyStateStarted
	}

	game, exists := lobby.CurrentGame()
	if exists {
		for uuid, client := range lobby.Clients {
			packet.Points[uuid] = client.Points
		}

		packet.PreviousWinners = game.Winners
		game.State = constants.GameStateEnded
	}

	payload, err := json.Marshal(packet)
	if err != nil {
		return errors.WithStack(err)
	}

	err = lobby.NextGame()
	if err != nil {
		return err
	}

	lobby.TimeoutTick(constants.TimeoutTypeGameWait, constants.TimeoutDurationGameWait, func() (err error) {
		return NewPacketServerGameStart().Send(lobby)
	})

	lobby.Broadcast <- payload

	return lobby.PushToFirestore()
}
