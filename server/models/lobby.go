package models

import (
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"log"
	"math"
	"math/rand"
	"reflect"
	"sync"
	"time"
	"unlock/constants"
	"unlock/firestore"
)

type Lobby struct {
	Broadcast                chan []byte             `json:"-" firestore:"-"`
	Capacity                 int                     `json:"capacity" firestore:"capacity"`
	Clients                  map[string]*Client      `json:"clients" firestore:"clients"`
	Code                     string                  `json:"code" firestore:"code"`
	ConnectionPoolRepository *LobbyRepository        `json:"-" firestore:"-"`
	CurrentGameUuid          string                  `json:"currentGameUuid" firestore:"currentGameUuid"`
	Games                    map[string]*Game        `json:"games" firestore:"games"`
	Interrupt                chan bool               `json:"-" firestore:"-"`
	InterruptTimeouts        map[string]chan bool    `json:"-" firestore:"-"`
	InterruptTimeoutsMutex   sync.RWMutex            `json:"-" firestore:"-"`
	Owner                    string                  `json:"owner" firestore:"owner"`
	PointsGoal               int                     `json:"pointsGoal" firestore:"pointsGoal"`
	PreviousGameUuid         string                  `json:"previousGameUuid" firestore:"previousGameUuid"`
	Register                 chan *Client            `json:"-" firestore:"-"`
	RegisterWaitGroup        sync.WaitGroup          `json:"-" firestore:"-"`
	RemainingSpriteColors    []constants.SpriteColor `json:"-" firestore:"-"`
	StartTime                time.Time               `json:"startTime" firestore:"startTime"`
	State                    constants.LobbyState    `json:"state" firestore:"state"`
	Unregister               chan *Client            `json:"-" firestore:"-"`
	UnregisterWaitGroup      sync.WaitGroup          `json:"-" firestore:"-"`
}

func NewLobby(capacity int, code string, pointsGoal int) *Lobby {
	return &Lobby{
		Capacity:   capacity,
		Code:       code,
		PointsGoal: pointsGoal,
	}
}

func (lobby *Lobby) AddTimeout(timeoutUuid string) {
	lobby.InterruptTimeoutsMutex.Lock()
	lobby.InterruptTimeouts[timeoutUuid] = make(chan bool, 8)
	lobby.InterruptTimeoutsMutex.Unlock()
}

func (lobby *Lobby) ReadTimeout(timeoutUuid string) (timeoutChannel chan bool, exists bool) {
	lobby.InterruptTimeoutsMutex.RLock()
	timeoutChannel, exists = lobby.InterruptTimeouts[timeoutUuid]
	lobby.InterruptTimeoutsMutex.RUnlock()

	return timeoutChannel, exists
}

func (lobby *Lobby) CloseTimeout(timeoutUuid string) {
	lobby.InterruptTimeoutsMutex.Lock()

	if timeoutChannel, exists := lobby.InterruptTimeouts[timeoutUuid]; exists && timeoutChannel != nil {
		close(timeoutChannel)
		delete(lobby.InterruptTimeouts, timeoutUuid)
	}

	lobby.InterruptTimeoutsMutex.Unlock()
}

func (lobby *Lobby) CurrentGame() (game *Game, exists bool) {
	if currentGame, exists := lobby.Games[lobby.CurrentGameUuid]; exists {
		return currentGame, true
	}

	return nil, false
}

func (lobby *Lobby) deleteInFirestore() (err error) {
	return errors.WithStack(firestore.DeleteDocument(constants.CollectionLobbies, lobby.Code))
}

func (lobby *Lobby) GetLosers() (map[string]*Client, bool) {
	losers := make(map[string]*Client)

	for clientUuid, client := range lobby.Clients {
		if client.Points < lobby.PointsGoal {
			losers[clientUuid] = client
		}
	}

	return losers, len(losers) > 0
}

func (lobby *Lobby) GetWinners() (map[string]*Client, bool) {
	winners := make(map[string]*Client)

	for clientUuid, client := range lobby.Clients {
		if client.Points >= lobby.PointsGoal {
			winners[clientUuid] = client
		}
	}

	return winners, len(winners) > 0
}

func (lobby *Lobby) init(connectionPoolRepository *LobbyRepository) {
	lobby.Broadcast = make(chan []byte, 128)
	lobby.Clients = make(map[string]*Client)
	lobby.ConnectionPoolRepository = connectionPoolRepository
	lobby.Games = make(map[string]*Game)
	lobby.Interrupt = make(chan bool, 8)
	lobby.InterruptTimeouts = make(map[string]chan bool)
	lobby.State = constants.LobbyStatePending
	lobby.Register = make(chan *Client, 32)
	lobby.RemainingSpriteColors = make([]constants.SpriteColor, 10)
	copy(lobby.RemainingSpriteColors, constants.SpriteColors)
	lobby.Unregister = make(chan *Client, 32)
}

func (lobby *Lobby) InterruptAllTimeouts() {
	lobby.InterruptTimeoutsMutex.RLock()

	for _, channel := range lobby.InterruptTimeouts {
		select {
		case channel <- false:
		default:
		}
	}

	lobby.InterruptTimeoutsMutex.RUnlock()
}

func (lobby *Lobby) NextGame() (err error) {
	//var previousSceneKey constants.SceneKey
	//
	//if previousGame, exists := lobby.Games[lobby.CurrentGameUuid]; exists {
	//	lobby.PreviousGameUuid = previousGame.Uuid
	//	previousSceneKey = previousGame.SceneKey
	//}
	//
	//var sceneKey constants.SceneKey
	//gameKeysLength := len(constants.GameKeyMap) + 1
	//
	//for sceneKey == "" || previousSceneKey == sceneKey {
	//	sceneKey = constants.GameKeyMap[strconv.Itoa(rand.Intn(gameKeysLength))]
	//}
	sceneKey := constants.SceneKeyGameFloatingIslands

	game, err := NewGame(sceneKey)
	if err != nil {
		return err
	}

	lobby.CurrentGameUuid = game.Uuid
	lobby.Games[game.Uuid] = game

	return lobby.PushToFirestore()
}

func (lobby *Lobby) PushToFirestore() (err error) {
	return errors.WithStack(firestore.SetDocument(constants.CollectionLobbies, lobby.Code, lobby))
}

func (lobby *Lobby) start() {
	defer func() {
		if r := recover(); r != nil {
			err := firestore.DeleteDocument(constants.CollectionLobbies, lobby.Code)
			if err != nil {
				log.Println(err)
			}
		}

		lobby.InterruptAllTimeouts()

		close(lobby.Broadcast)
		close(lobby.Interrupt)
		close(lobby.Register)
		close(lobby.Unregister)
	}()

LobbyLoop:
	for {
		select {

		case message := <-lobby.Broadcast:
			for _, client := range lobby.Clients {
				select {
				case client.Channel <- message:
				default:
					log.Println("Communication problem with client " + client.Uuid)
				}
			}

		case _ = <-lobby.Interrupt:
			break LobbyLoop

		case client := <-lobby.Register:
			lobby.Clients[client.Uuid] = client

			colorIndex := rand.Intn(len(lobby.RemainingSpriteColors))
			color := lobby.RemainingSpriteColors[colorIndex]
			lobby.RemainingSpriteColors = append(lobby.RemainingSpriteColors[:colorIndex], lobby.RemainingSpriteColors[colorIndex+1:]...)
			client.SpriteColor = color

			if len(lobby.Clients) == 1 {
				lobby.Owner = client.Uuid
			}

			lobby.RegisterWaitGroup.Done()

		case client := <-lobby.Unregister:
			if _, exists := lobby.Clients[client.Uuid]; exists {
				lobby.RemainingSpriteColors = append(lobby.RemainingSpriteColors, client.SpriteColor)
				delete(lobby.Clients, client.Uuid)
				close(client.Channel)

				if lobby.Owner == client.Uuid && len(lobby.Clients) > 0 {
					lobby.Owner = lobby.Clients[reflect.ValueOf(lobby.Clients).MapKeys()[0].String()].Uuid
				}
			}

			lobby.UnregisterWaitGroup.Done()
		}
	}
}

func (lobby *Lobby) Timeout(timeoutMillis int, runnable func() error) (timeoutUuid string) {
	timeoutUuid = uuid.NewString()
	lobby.AddTimeout(timeoutUuid)

	go func() {
		executeCallback := true

		timeoutChannel, exists := lobby.ReadTimeout(timeoutUuid)
		if !exists {
			return
		}

	TimeoutLoop:
		for timeout := time.After(time.Duration(timeoutMillis) * time.Millisecond); ; {
			select {
			case <-timeout:
				break TimeoutLoop

			case executeCallback = <-timeoutChannel:
				break TimeoutLoop
			}
		}

		lobby.CloseTimeout(timeoutUuid)

		if !executeCallback {
			return
		}

		err := runnable()
		if err != nil {
			log.Println(err)
		}
	}()

	return timeoutUuid
}

func (lobby *Lobby) TimeoutTick(timeoutMillis int, timeoutRunnable func() error, tickMillis int, tickRunnable func(startTime time.Time) error) (timeoutUuid string) {
	timeoutUuid = uuid.NewString()
	lobby.AddTimeout(timeoutUuid)
	ticker := time.NewTicker(time.Duration(tickMillis) * time.Millisecond)
	startTime := time.Now()

	go func() {
		executeCallback := true

		timeoutChannel, exists := lobby.ReadTimeout(timeoutUuid)
		if !exists {
			return
		}

	TimeoutLoop:
		for timeout := time.After(time.Duration(timeoutMillis) * time.Millisecond); ; {
			select {
			case <-timeout:
				break TimeoutLoop

			case <-ticker.C:
				err := tickRunnable(startTime)
				if err != nil {
					log.Println(err)
				}

			case executeCallback = <-timeoutChannel:
				break TimeoutLoop
			}
		}

		lobby.CloseTimeout(timeoutUuid)
		ticker.Stop()

		if !executeCallback {
			return
		}

		err := timeoutRunnable()
		if err != nil {
			log.Println(err)
		}
	}()

	return timeoutUuid
}

func (lobby *Lobby) TimeoutTickCountdown(timeoutMillis int, timeoutRunnable func() error) (timeoutUuid string) {
	millis := float64(timeoutMillis)

	return lobby.TimeoutTick(timeoutMillis, timeoutRunnable, 100, func(startTime time.Time) (err error) {
		percentage := math.Max(0, 100*(1-(float64(time.Since(startTime).Milliseconds())/millis)))
		return NewPacketServerCountdown(timeoutMillis/1000, percentage).Send(lobby)
	})
}
