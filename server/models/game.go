package models

import (
	"github.com/google/uuid"
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

// HandleGameData initialise game.Data spécifique à chaque mini-jeu et
// programme les ticks/timeouts associés. Appelé par PacketServerGameStart
// juste avant le broadcast.
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
			return nil
		}

		timeoutUuid := lobby.TimeoutTick(game.Duration, func() error { return nil }, 1000, func(startTime time.Time) (err error) {
			return NewPacketServerSceneData(data, constants.SceneKeyGameFloatingIslands).Send(lobby)
		})

		game.AddTimeoutUuid(timeoutUuid)

	case constants.SceneKeyGameHotPotato:
		data := NewDataSceneHotPotato(lobby)
		game.Data = data

		// Tout le monde sauf le porteur final est gagnant.
		game.WinnersNumber = len(lobby.Clients) - 1
		if game.WinnersNumber < 1 {
			game.WinnersNumber = 1
		}

		// Diffuse l'état initial (porteur) après un court délai pour
		// laisser les clients basculer sur la scène GameHotPotato : le
		// SERVER_GAME_START est broadcast juste après ce HandleGameData,
		// donc envoyer SCENE_DATA immédiatement risque d'être reçu par
		// la scène PreGame qui l'ignorerait.
		initUuid := lobby.Timeout(400, func() (err error) {
			return NewPacketServerSceneData(data, constants.SceneKeyGameHotPotato).Send(lobby)
		})
		game.AddTimeoutUuid(initUuid)

		// À la fin du chrono, le porteur explose : tous les autres
		// joueurs sont déclarés vainqueurs via PacketClientWin.
		timeoutUuid := lobby.Timeout(game.Duration, func() (err error) {
			if game.State != constants.GameStateStarted {
				return nil
			}

			for uuid, c := range lobby.Clients {
				if uuid == data.HolderUuid {
					continue
				}
				win := &PacketClientWin{}
				if e := win.Receive(c); e != nil {
					err = e
				}
			}
			return err
		})

		game.AddTimeoutUuid(timeoutUuid)

	case constants.SceneKeyGameStarWars:
		data := NewDataStarWarsScene()
		game.Data = data

		timeoutUuid := lobby.TimeoutTick(game.Duration, func() error { return nil }, 2000, func(startTime time.Time) (err error) {
			data.CreateStar()
			return NewPacketServerSceneData(data, constants.SceneKeyGameStarWars).Send(lobby)
		})

		game.AddTimeoutUuid(timeoutUuid)
	}

	return nil
}

// HandleRequiredFocus traite la perte de focus d'un client pendant un
// mini-jeu qui exige une attention soutenue (Floating Islands : un joueur
// distrait tombe).
func (game *Game) HandleRequiredFocus(client *Client) (err error) {
	switch game.SceneKey {

	case constants.SceneKeyGameFloatingIslands:
		switch game.Data.(type) {

		case *DataSceneFloatingIslands:
			packetFall := &PacketClientSceneFloatingIslandFall{}
			return packetFall.Receive(client)
		}
	}

	return nil
}

// InterruptAllTimeouts interrompt tous les timeouts encore actifs du jeu et
// déclenche leurs callbacks (channel <- true). Utilisé quand un joueur gagne
// un mini-jeu avant la fin du chrono : on enchaîne immédiatement sur la
// phase d'attente du jeu suivant via le callback du countdown.
func (game *Game) InterruptAllTimeouts(lobby *Lobby) {
	lobby.InterruptTimeoutsMutex.RLock()
	game.TimeoutsUuidsMutex.Lock()

	for timeoutUuid, running := range game.TimeoutUuids {
		if timeoutChannel, exists := lobby.InterruptTimeouts[timeoutUuid]; exists && running {
			select {
			case timeoutChannel <- true:
			default:
			}
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
