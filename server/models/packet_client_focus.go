package models

import (
	"unlock/constants"
)

type PacketClientFocus struct {
	Packet
	State bool `json:"state"`
}

func (packet *PacketClientFocus) Receive(client *Client) (err error) {
	client.Focus = packet.State

	if packet.State {
		return client.Lobby.PushToFirestore()
	}

	if game, exists := client.Lobby.CurrentGame(); exists && game.State == constants.GameStateStarted {
		err = game.HandleRequiredFocus(client)
		if err != nil {
			return err
		}
	}

	return client.Lobby.PushToFirestore()
}