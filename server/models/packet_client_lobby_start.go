package models

import (
	"github.com/pkg/errors"
	"time"
	"unlock/constants"
)

type PacketClientLobbyStart struct {
	Packet
}

func (packet *PacketClientLobbyStart) Receive(client *Client) (err error) {
	lobby := client.Lobby

	if lobby.Owner != client.Uuid {
		return errors.New("Client " + client.Uuid + " trying to change lobby state of " + lobby.Code + " without being owner")
	}

	if lobby.State != constants.LobbyStatePending {
		return errors.New("Trying to start a lobby that is not pending")
	}

	lobby.StartTime = time.Now()
	lobby.State = constants.LobbyStateStarting

	lobby.TimeoutTick(constants.TimeoutTypeLobbyStart, constants.TimeoutDurationLobbyStart, func() (err error) {
		return NewPacketServerGameWait().Send(lobby)
	})

	lobby.Timeout(constants.TimeoutTypeLobbyStartImminent, constants.TimeoutDurationLobbyStartImminent, func() (err error) {
		lobby.State = constants.LobbyStateStartingImminent
		return lobby.PushToFirestore()
	})

	lobby.Timeout(constants.TimeoutTypeLobbyCollapse, constants.TimeoutDurationLobbyCollapse, func() (err error) {
		return NewPacketServerLobbyCollapse().Send(lobby)
	})

	return lobby.PushToFirestore()
}
