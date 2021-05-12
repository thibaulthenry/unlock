package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type PacketServerConnection struct {
	Packet
	Client    *Client `json:"client"`
	LobbyCode string  `json:"lobbyCode"`
}

func NewPacketServerConnection(client *Client, lobbyCode string) *PacketServerConnection {
	return &PacketServerConnection{
		Packet: Packet{
			Label: constants.PacketServerConnection,
		},
		Client:    client,
		LobbyCode: lobbyCode,
	}
}

func (packet *PacketServerConnection) Send(client *Client) (err error) {
	payload, err := json.Marshal(packet)
	if err != nil {
		return errors.WithStack(err)
	}

	client.Channel <- payload

	return nil
}
