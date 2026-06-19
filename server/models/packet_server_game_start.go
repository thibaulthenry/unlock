package models

import (
	"encoding/json"
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
		return err
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

	// Quand HandleGameData déclenche un win immédiat (Floating Islands avec
	// un seul joueur, par exemple), le lobby peut déjà être terminé : on ne
	// re-broadcast pas un GAME_START qui n'a plus de sens.
	if lobby.State == constants.LobbyStateStarted {
		lobby.Broadcast <- payload
	}

	return lobby.PushToFirestore()
}
