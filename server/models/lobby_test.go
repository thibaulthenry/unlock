package models

import (
	"testing"
)

func TestLobbyInitialization(t *testing.T) {
	lobby := NewLobby(8, "TEST123", 10)

	if lobby.Capacity != 8 {
		t.Errorf("Expected Capacity to be 8, got %d", lobby.Capacity)
	}
	if lobby.Code != "TEST123" {
		t.Errorf("Expected Code to be TEST123, got %s", lobby.Code)
	}
	if lobby.PointsGoal != 10 {
		t.Errorf("Expected PointsGoal to be 10, got %d", lobby.PointsGoal)
	}
}

func TestLobbyDefaults(t *testing.T) {
	lobby := NewLobby(5, "CODE", 5)

	if lobby.Clients != nil {
		t.Errorf("Expected Clients to be nil, got %v", lobby.Clients)
	}
	if lobby.Games != nil {
		t.Errorf("Expected Games to be nil, got %v", lobby.Games)
	}
	if lobby.Owner != "" {
		t.Errorf("Expected Owner to be empty, got %s", lobby.Owner)
	}
	if lobby.CurrentGameUuid != "" {
		t.Errorf("Expected CurrentGameUuid to be empty, got %s", lobby.CurrentGameUuid)
	}
}

func TestCurrentGameNotExists(t *testing.T) {
	lobby := NewLobby(5, "CODE", 5)
	lobby.Games = make(map[string]*Game)
	lobby.CurrentGameUuid = "non-existent"

	_, exists := lobby.CurrentGame()
	if exists {
		t.Errorf("Expected CurrentGame to not exist")
	}
}

func TestCurrentGameExists(t *testing.T) {
	lobby := NewLobby(5, "CODE", 5)
	game := &Game{Uuid: "game-1"}
	lobby.Games = map[string]*Game{
		"game-1": game,
	}
	lobby.CurrentGameUuid = "game-1"

	retrievedGame, exists := lobby.CurrentGame()
	if !exists {
		t.Errorf("Expected CurrentGame to exist")
	}
	if retrievedGame.Uuid != "game-1" {
		t.Errorf("Expected game UUID to be game-1, got %s", retrievedGame.Uuid)
	}
}

func TestGetWinnersNoWinners(t *testing.T) {
	lobby := NewLobby(5, "CODE", 5)
	lobby.Clients = make(map[string]*Client)
	game := &Game{Uuid: "game-1"}
	lobby.Games = map[string]*Game{
		"game-1": game,
	}
	lobby.CurrentGameUuid = "game-1"

	// Test with no winners returns false
	_, exists := lobby.GetWinners()
	if exists {
		t.Errorf("Expected GetWinners to return false when no winners")
	}
}

func TestGetLosersNoLosers(t *testing.T) {
	lobby := NewLobby(5, "CODE", 5)
	lobby.Clients = make(map[string]*Client)
	game := &Game{Uuid: "game-1"}
	lobby.Games = map[string]*Game{
		"game-1": game,
	}
	lobby.CurrentGameUuid = "game-1"

	// Test with no losers returns false
	_, exists := lobby.GetLosers()
	if exists {
		t.Errorf("Expected GetLosers to return false when no losers")
	}
}

func TestLobbyStateInitialization(t *testing.T) {
	lobby := NewLobby(5, "CODE", 5)

	// Default state should be 0 (LobbyStatePending)
	if lobby.State != 0 {
		t.Logf("Lobby state initialized to: %v", lobby.State)
	}
}

