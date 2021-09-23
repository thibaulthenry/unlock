package models

import (
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"sync"
	"time"
	"unlock/constants"
	"unlock/firestore"
)

type Game struct {
	Data               interface{}                `json:"data" firestore:"data"`
	Duration           int                        `json:"duration" firestore:"duration"`
	SceneKey           constants.SceneKey         `json:"sceneKey"  firestore:"sceneKey"`
	StartTime          time.Time                  `json:"startTime" firestore:"startTime"`
	State              constants.GameState        `json:"state" firestore:"state"`
	Type               constants.GameType         `json:"type"  firestore:"type"`
	Uuid               string                     `json:"uuid" firestore:"uuid"`
	TimeoutUuids       map[string]bool            `json:"-" firestore:"-"`
	TimeoutsUuidsMutex sync.RWMutex               `json:"-" firestore:"-"`
	WinCondition       constants.GameWinCondition `json:"winCondition"  firestore:"winCondition"`
	Winners            map[string]bool            `json:"winners"  firestore:"winners"`
	WinnersNumber      int                        `json:"winnersNumber"  firestore:"winnersNumber"`
	WinReward          int                        `json:"winReward"  firestore:"winReward"`
}

func NewGame(sceneKey constants.SceneKey) (game *Game, err error) {
	err = firestore.GetDocument(constants.CollectionGames, string(sceneKey), &game)
	if err != nil {
		return nil, err
	}

	game.StartTime = time.Now()
	game.State = constants.GameStateStarting
	game.TimeoutUuids = make(map[string]bool)
	game.Uuid = uuid.NewString()
	game.Winners = make(map[string]bool)

	return game, nil
}

func (game *Game) AddTimeoutUuid(timeoutUuid string) {
	game.TimeoutsUuidsMutex.Lock()
	game.TimeoutUuids[timeoutUuid] = true
	game.TimeoutsUuidsMutex.Unlock()
}

func (game *Game) HandleGameData(lobby *Lobby) (err error) {
	switch game.SceneKey {

	case constants.SceneKeyGameFloatingIslands:
		data := NewDataSceneFloatingIslands(lobby)
		game.Data = data

		if data.RemainingPlayersCount <= 1 {
			game.InterruptAllTimeouts(lobby)

			if winnerUuid, exists := data.GetWinner(); exists {
				win := &PacketClientWin{}

				err = win.Receive(lobby.Clients[winnerUuid])
				if err != nil {
					return err
				}
			}
		}

		timeoutUuid := lobby.TimeoutTick(game.Duration, func() error { return nil }, 1000, func(startTime time.Time) (err error) {
			return NewPacketServerSceneData(data, constants.SceneKeyGameFloatingIslands).Send(lobby)
		})

		game.AddTimeoutUuid(timeoutUuid)

	case constants.SceneKeyGameStarWars:
		data := NewDataSceneStarWars()
		game.Data = data

		timeoutUuid := lobby.TimeoutTick(game.Duration, func() error { return nil }, 2000, func(startTime time.Time) (err error) {
			data.CreateStar()
			return NewPacketServerSceneData(data, constants.SceneKeyGameStarWars).Send(lobby)
		})

		game.AddTimeoutUuid(timeoutUuid)
	}

	return nil
}

func (game *Game) HandleRequiredFocus(client *Client) (err error) {
	switch game.SceneKey {

	case constants.SceneKeyGameFloatingIslands:
		switch game.Data.(type) {

		case *DataSceneFloatingIslands:

			packetFall := &PacketClientSceneFloatingIslandFall{}
			return packetFall.Receive(client)

		default:
			return errors.New("Unable to cast game data to *DataSceneFloatingIslands")
		}
	}

	return nil
}

func (game *Game) InterruptAllTimeouts(lobby *Lobby) {
	lobby.InterruptTimeoutsMutex.RLock()
	game.TimeoutsUuidsMutex.Lock()

	for timeoutUuid, running := range game.TimeoutUuids {
		if timeoutChannel, exists := lobby.InterruptTimeouts[timeoutUuid]; exists && running {
			timeoutChannel <- true
			game.TimeoutUuids[timeoutUuid] = false
		}
	}

	game.TimeoutsUuidsMutex.Unlock()
	lobby.InterruptTimeoutsMutex.RUnlock()
}

func (game *Game) Reward(lobby *Lobby) {
	for key := range game.Winners {
		if client, clientExists := lobby.Clients[key]; clientExists {
			client.Points += game.WinReward
		}
	}
}
