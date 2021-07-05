package models

import (
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketClientSceneStarWarsCollect struct {
	Packet
	StarUuid string `json:"starUuid"`
}

func (packet *PacketClientSceneStarWarsCollect) Receive(client *Client) (err error) {
	lobby := client.Lobby
	game, exists := lobby.CurrentGame()

	if !exists || game.SceneKey != constants.SceneKeyGameStarWars {
		return errors.New("Client " + client.Uuid + " trying to collect star whereas StarWars game not started")
	}

	switch game.Data.(type) {
	case *DataSceneStarWars:
		data := game.Data.(*DataSceneStarWars)
		data.CollectStar(client, packet.StarUuid)

		err = NewPacketServerSceneData(data, constants.SceneKeyGameStarWars).Send(lobby)
		if err != nil {
			return err
		}

		if data.Points[client.Uuid] > 5 {
			win := &PacketClientWin{}
			return win.Receive(client)
		}

		return nil
	default:
		return errors.New("Unable to cast game data to *DataSceneStarWars")
	}
}
