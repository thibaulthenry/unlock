package models

type Coordinates struct {
	X  float64 `json:"x"`
	Y  float64 `json:"y"`
	Vx float64 `json:"vx"`
	Vy float64 `json:"vy"`
	Ax float64 `json:"ax"`
	Ay float64 `json:"ay"`
	R  float64 `json:"r"`
}
