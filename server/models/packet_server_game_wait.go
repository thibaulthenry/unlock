package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketServerGameWait struct {
	Packet
	Initialisation  bool            `json:"initialisation"`
	Points          map[string]int  `json:"points"`
	PreviousWinners map[string]bool `json:"previousWinners"`
}

func NewPacketServerGameWait(initialisation bool) *PacketServerGameWait {
	return &PacketServerGameWait{
		Packet: Packet{
			Label: constants.PacketServerGameWait,
		},
		Initialisation: initialisation,
		Points:          make(map[string]int),
		PreviousWinners: make(map[string]bool),
	}
}

func (packet *PacketServerGameWait) Send(lobby *Lobby) (err error) {
	if lobby.State == constants.LobbyStateStartingImminent {
		lobby.State = constants.LobbyStateStarted
	}

	if lobby.State != constants.LobbyStateStarted {
		return errors.New("Trying to start new game on lobby that is not started")
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

	lobby.TimeoutTickCountdown(constants.TimeoutDurationGameWait, func() (err error) {
		return NewPacketServerGameStart().Send(lobby)
	})

	if lobby.State == constants.LobbyStateStarted {
		lobby.Broadcast <- payload
	}

	return lobby.PushToFirestore()
}
