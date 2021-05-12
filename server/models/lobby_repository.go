package models

import (
	"sync"
)

type LobbyRepository struct {
	lobbies map[string]*Lobby
	mu      sync.RWMutex
}

func NewLobbyRepository() *LobbyRepository {
	return &LobbyRepository{
		lobbies: make(map[string]*Lobby),
	}
}

func (repository *LobbyRepository) GetOrCreateLobby(capacity int, code string, pointsGoal int) *Lobby {
	repository.mu.Lock()
	defer repository.mu.Unlock()

	lobby, exists := repository.lobbies[code]
	if exists {
		return lobby
	}

	lobby = NewLobby(capacity, code, pointsGoal)

	lobby.init(repository)
	repository.lobbies[code] = lobby

	go lobby.start()

	return lobby
}
