package models

type Coordinates struct {
	X  float64 `json:"x" firestore:"x"`
	Y  float64 `json:"y" firestore:"y"`
	Vx float64 `json:"vx" firestore:"vx"`
	Vy float64 `json:"vy" firestore:"vy"`
	Ax float64 `json:"ax" firestore:"ax"`
	Ay float64 `json:"ay" firestore:"ay"`
	R  float64 `json:"r" firestore:"r"`
}
