package models

import (
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketClientSceneFloatingIslandCollide struct {
	Packet
	Key string `json:"key"`
}

func (packet *PacketClientSceneFloatingIslandCollide) Receive(client *Client) (err error) {
	lobby := client.Lobby
	game, gameExists := lobby.CurrentGame()

	if !gameExists || game.SceneKey != constants.SceneKeyGameFloatingIslands {
		return errors.New("Client " + client.Uuid + " trying to collide island whereas FloatingIslands game not started")
	}

	switch game.Data.(type) {
	case *DataSceneFloatingIslands:
		data := game.Data.(*DataSceneFloatingIslands)
		island, islandExists := data.Islands[packet.Key]

		if _, isLoser := data.Losers[client.Uuid]; isLoser || !islandExists || island.Updating {
			return nil
		}

		island.Updating = true

		timeoutUuid := lobby.Timeout(map[bool]int{true: 250, false: 500}[island.Small], func() (err error) {
			island.Updating = false
			island.State += 1

			return NewPacketServerSceneData(data, constants.SceneKeyGameFloatingIslands).Send(lobby)
		})

		game.AddTimeoutUuid(timeoutUuid)

		err = NewPacketServerSceneData(data, constants.SceneKeyGameFloatingIslands).Send(lobby)
		if err != nil {
			return err
		}

		return nil
	default:
		return errors.New("Unable to cast game data to *DataSceneFloatingIslands")
	}
}
