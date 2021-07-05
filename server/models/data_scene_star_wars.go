package models

import (
	"github.com/google/uuid"
	"math"
	"math/rand"
)

type DataSceneStarWars struct {
	Points map[string]int   `json:"points" firestore:"points"`
	Stars  map[string]*Star `json:"stars" firestore:"-"`
}

type Star struct {
	Coordinates *Coordinates `json:"coordinates" firestore:"-"`
	Uuid        string       `json:"uuid" firestore:"-"`
}

func NewDataStarWarsScene() *DataSceneStarWars {
	return &DataSceneStarWars{
		Points: make(map[string]int),
		Stars:  make(map[string]*Star),
	}
}

func (data *DataSceneStarWars) CollectStar(client *Client, uuid string) {
	if _, exists := data.Stars[uuid]; !exists {
		return
	}

	delete(data.Stars, uuid)

	points, exists := data.Points[client.Uuid]
	if !exists {
		points = 0
	}

	data.Points[client.Uuid] = points + 1
}

func (data *DataSceneStarWars) CreateStar() {
	if len(data.Stars) > 5 {
		return
	}

	starUuid := uuid.NewString()
	star := &Star{Uuid: starUuid}

	var x1, y1, x2, y2 float64
	loop := true

	for loop {
		x1 = float64(50 + rand.Intn(1100))
		y1 = float64(50 + rand.Intn(1100))
		loop = false

		for _, existingStar := range data.Stars {
			x2 = existingStar.Coordinates.X
			y2 = existingStar.Coordinates.Y

			if math.Sqrt(math.Pow(x2 - x1, 2) + math.Pow(y2 - y1, 2)) < 100 {
				loop = true
			}
		}
	}

	star.Coordinates = &Coordinates{
		X: x1,
		Y: y1,
	}

	data.Stars[starUuid] = star
}
