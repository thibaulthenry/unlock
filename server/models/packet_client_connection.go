package models

import (
	"fmt"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketClientConnection struct {
	Packet
	ClientName      string `json:"clientName"`
	LobbyCapacity   int    `json:"lobbyCapacity"`
	LobbyCode       string `json:"lobbyCode"`
	LobbyPointsGoal int    `json:"LobbyPointsGoal"`
}

func (packet *PacketClientConnection) Receive(client *Client) (err error) {
	lobby := client.LobbyRepository.GetOrCreateLobby(packet.LobbyCapacity, packet.LobbyCode, packet.LobbyPointsGoal)
	if lobby.State > constants.LobbyStateStarting {
		return errors.New("Lobby " + lobby.Code + " already started")
	}

	if len(lobby.Clients) >= lobby.Capacity {
		return errors.New("Lobby " + lobby.Code + " is full")
	}

	client.Lobby = lobby
	client.Spectating = false
	client.Name = packet.computePlayerName(client)

	lobby.RegisterWaitGroup.Add(1)
	lobby.Register <- client
	lobby.RegisterWaitGroup.Wait()

	err = lobby.PushToFirestore()
	if err != nil {
		return err
	}

	return NewPacketServerConnection(client, lobby.Code).Send(client)
}

func (packet *PacketClientConnection) computePlayerName(client *Client) (name string) {
	name = packet.ClientName
	suffix := 1

	for {
		available := true

		for  _, client := range client.Lobby.Clients {
			if client.Name == name {
				available = false
				name = fmt.Sprintf("%s %d", packet.ClientName, suffix)
				suffix++
				break
			}
		}

		if available {
			break
		}
	}

	return name
}
