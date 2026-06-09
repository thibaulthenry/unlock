package models

import (
	"github.com/google/uuid"
	"math"
	"math/rand"
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

	case constants.SceneKeyGameBrawl:
		data := NewDataSceneBrawl(lobby, time.Now().UnixMilli())
		game.Data = data
		game.WinnersNumber = 1

		// Diffuse l'état initial (participants, terrain) après un court
		// délai pour laisser les clients basculer sur la scène.
		initUuid := lobby.Timeout(400, func() (err error) {
			return NewPacketServerSceneData(data, constants.SceneKeyGameBrawl).Send(lobby)
		})
		game.AddTimeoutUuid(initUuid)

		// Tick 500 ms : spawn de bombes après 30s, décroissance du HpCap
		// dans les 15 dernières secondes, diffusion régulière de l'état.
		bombSpawnAccumulator := 0
		tickUuid := lobby.TimeoutTick(game.Duration, func() error { return nil }, 500,
			func(startTime time.Time) error {
				if data.Finalized {
					return nil
				}
				elapsed := int(time.Since(startTime).Milliseconds())
				data.ElapsedMillis = elapsed

				// Spawn bombes entre 30s et 60s, en moyenne une toutes
				// les 1.5 s, à un x aléatoire.
				if elapsed >= BrawlBombSpawnAfter && elapsed < BrawlDurationMs {
					bombSpawnAccumulator += 500
					if bombSpawnAccumulator >= 1500 && rand.Intn(2) == 0 {
						data.SpawnBomb()
						bombSpawnAccumulator = 0
					}
				}

				// Décroissance HpCap entre 45s et 60s : ratio remaining /
				// 15s, le cap passe linéairement de InitialHp à 1.
				if elapsed >= BrawlCapDecayStart {
					remaining := BrawlDurationMs - elapsed
					if remaining < 0 {
						remaining = 0
					}
					ratio := float64(remaining) / float64(BrawlDurationMs-BrawlCapDecayStart)
					if ratio < 0 {
						ratio = 0
					}
					if ratio > 1 {
						ratio = 1
					}
					newCap := int(math.Ceil(ratio*float64(BrawlInitialHp-1))) + 1
					if newCap < 1 {
						newCap = 1
					}
					data.HpCap = newCap
					data.ApplyHpCap()
				}

				return NewPacketServerSceneData(data, constants.SceneKeyGameBrawl).Send(lobby)
			})
		game.AddTimeoutUuid(tickUuid)

		// Au timeout final (60 s), si un seul participant est encore en
		// vie il gagne, sinon personne (game.State passera à Ended via
		// le countdown standard, aucun PacketClientWin n'est appelé donc
		// aucun point n'est distribué).
		finalUuid := lobby.Timeout(game.Duration, func() (err error) {
			if data.Finalized {
				return nil
			}
			data.Finalized = true
			alive := data.AlivePlayers()
			if len(alive) == 1 {
				win := &PacketClientWin{}
				return win.Receive(lobby.Clients[alive[0]])
			}
			return nil
		})
		game.AddTimeoutUuid(finalUuid)

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
