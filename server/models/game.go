package models

import (
	"github.com/google/uuid"
	"time"
	"unlock/constants"
	"unlock/firestore"
)

type Game struct {
	Data          interface{}                `json:"data" firestore:"data"`
	Duration      int                        `json:"duration" firestore:"duration"`
	SceneKey      constants.SceneKey         `json:"sceneKey"  firestore:"sceneKey"`
	StartTime     time.Time                  `json:"startTime" firestore:"startTime"`
	State         constants.GameState        `json:"state" firestore:"state"`
	Type          constants.GameType         `json:"type"  firestore:"type"`
	Uuid          string                     `json:"uuid" firestore:"uuid"`
	TimeoutUuids  map[string]bool            `json:"-" firestore:"-"`
	WinCondition  constants.GameWinCondition `json:"winCondition"  firestore:"winCondition"`
	Winners       map[string]bool            `json:"winners"  firestore:"winners"`
	WinnersNumber int                        `json:"winnersNumber"  firestore:"winnersNumber"`
	WinReward     int                        `json:"winReward"  firestore:"winReward"`
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

func (game *Game) Reward(lobby *Lobby) {
	for key := range game.Winners {
		if client, clientExists := lobby.Clients[key]; clientExists {
			client.Points += game.WinReward
		}
	}
}
