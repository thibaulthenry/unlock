package constants

type GameState int

const (
	GameStateStarting GameState = iota
	GameStateStarted
	GameStateEnded
)
