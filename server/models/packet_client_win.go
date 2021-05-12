package models

import (
	"unlock/constants"
)

type PacketClientWin struct {
	Packet
}

func (packet *PacketClientWin) Receive(client *Client) (err error) {
	game, exists := client.Lobby.CurrentGame()

	if !exists {
		return
	}

	if game.State != constants.GameStateStarted {
		return
	}

	if len(game.Winners) >= game.WinnersNumber {
		return
	}

	if _, exists := game.Winners[client.Uuid]; exists {
		return
	}

	game.Winners[client.Uuid] = true

	if len(game.Winners) == game.WinnersNumber {
		lobby := client.Lobby

		lobby.InterruptTimeout <- NewTimeoutResult(true, constants.TimeoutTypeGameStart)
		game.Reward(lobby)

		if winners, exists := lobby.GetWinners(); exists {
			losers, _ := lobby.GetLosers()
			lobby.State = constants.LobbyStateEnded

			err = NewPacketServerLobbyEnd(losers, winners).Send(lobby)
			if err != nil {
				return err
			}
		}
	}

	return client.Lobby.PushToFirestore()
}
