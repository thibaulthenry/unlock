package models

import (
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketClientSceneFloatingIslandFall struct {
	Packet
}

func (packet *PacketClientSceneFloatingIslandFall) Receive(client *Client) (err error) {
	lobby := client.Lobby
	game, gameExists := lobby.CurrentGame()

	if !gameExists || game.SceneKey != constants.SceneKeyGameFloatingIslands {
		return errors.New("Client " + client.Uuid + " trying to fall whereas FloatingIslands game not started")
	}

	switch game.Data.(type) {
	case *DataSceneFloatingIslands:
		data := game.Data.(*DataSceneFloatingIslands)

		if _, exists := data.Losers[client.Uuid]; exists {
			return nil
		}

		if data.RemainingPlayersCount > 1 {
			data.RemainingPlayersCount -= 1
			data.Losers[client.Uuid] = true
			delete(data.RemainingPlayers, client.Uuid)
		}

		err = NewPacketServerSceneData(data, constants.SceneKeyGameFloatingIslands).Send(lobby)
		if err != nil {
			return err
		}

		if data.RemainingPlayersCount == 1 {
			for winnerUuid := range data.RemainingPlayers {
				win := &PacketClientWin{}
				return win.Receive(lobby.Clients[winnerUuid])
			}
		}

		return nil
	default:
		return errors.New("Unable to cast game data to *DataSceneFloatingIslands")
	}
}
