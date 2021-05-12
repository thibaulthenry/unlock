package constants

type LobbyState int

const (
	LobbyStatePending LobbyState = iota
	LobbyStateStarting
	LobbyStateStartingImminent
	LobbyStateStarted
	LobbyStateEnded
)
