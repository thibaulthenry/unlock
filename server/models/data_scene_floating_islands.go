package models

import (
	"math"
	"strconv"
)

type DataSceneFloatingIslands struct {
	Islands               map[string]*Island `json:"islands" firestore:"-"`
	Losers                map[string]bool    `json:"losers" firestore:"-"`
	RemainingPlayers      map[string]bool    `json:"remainingPlayers" firestore:"-"`
	RemainingPlayersCount int                `json:"remainingPlayersCount" firestore:"-"`
	Stage                 int                `json:"stage" firestore:"-"`
}

type Island struct {
	Coordinates *Coordinates `json:"coordinates" firestore:"-"`
	Updating    bool         `json:"-" firestore:"-"`
	Key         string       `json:"key" firestore:"-"`
	Small       bool         `json:"small" firestore:"-"`
	State       IslandState  `json:"state" firestore:"-"`
	Type        IslandType   `json:"type" firestore:"-"`
}

type IslandState int

const (
	IslandStateSafe IslandState = iota
)

type IslandType string

const (
	IslandTypeBlue  IslandType = "blue"
	IslandTypeGrey  IslandType = "grey"
	IslandTypeWhite IslandType = "white"
)

func NewDataSceneFloatingIslands(lobby *Lobby) (data *DataSceneFloatingIslands) {
	playersCount := len(lobby.Clients)
	stage := 4 + int(math.Max(0.0, float64(playersCount)-4.0))
	islandMap := make(map[string]*Island)
	types := []IslandType{
		IslandTypeBlue, IslandTypeBlue, IslandTypeBlue,
		IslandTypeWhite, IslandTypeWhite, IslandTypeWhite, IslandTypeWhite,
		IslandTypeGrey, IslandTypeGrey, IslandTypeGrey, IslandTypeGrey,
	}

	var key string
	var posX, posY float64
	var small bool

	for y := 0; y < stage; y++ {
		for x := 0; x < 9; x++ {
			for size := 0; size < 2; size++ {
				small = size == 1
				key = strconv.Itoa(x) + strconv.Itoa(y) + strconv.Itoa(size)

				posX = float64(80 + 130*x)
				posY = float64(map[bool]int{true: 240 + y*300, false: 200 + y*300}[small])

				islandMap[key] = &Island{
					Coordinates: &Coordinates{X: posX, Y: posY},
					Key:         key,
					Small:       small,
					State:       IslandStateSafe,
					Type:        types[y],
				}
			}
		}
	}

	losers := make(map[string]bool)
	remainingPlayers := make(map[string]bool)

	for uuid, client := range lobby.Clients {
		if client.Focus {
			remainingPlayers[uuid] = true
		} else {
			losers[uuid] = true
		}
	}

	playersCount -= len(losers)

	return &DataSceneFloatingIslands{
		Islands:               islandMap,
		Losers:                losers,
		RemainingPlayers:      remainingPlayers,
		RemainingPlayersCount: playersCount,
		Stage:                 stage,
	}
}

func (data *DataSceneFloatingIslands) GetWinner() (uuid string, exists bool) {
	if data.RemainingPlayersCount > 1 {
		return "", false
	}

	for uuid := range data.RemainingPlayers {
		return uuid, true
	}

	return "", false
}