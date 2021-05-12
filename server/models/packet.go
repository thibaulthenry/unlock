package models

import (
	"encoding/json"
	"github.com/pkg/errors"
	"unlock/constants"
)

type Packet struct {
	Label string `json:"label"`
}

func HandlePacket(client *Client, payload []byte) (err error) {
	var packet Packet

	err = json.Unmarshal(payload, &packet)
	if err != nil {
		return errors.WithStack(err)
	}

	switch packet.Label {

	case constants.PacketClientConnection:
		var packet PacketClientConnection

		err = json.Unmarshal(payload, &packet)
		if err != nil {
			return errors.WithStack(err)
		}

		return packet.Receive(client)

	case constants.PacketClientLobbyStart:
		var packet PacketClientLobbyStart

		err = json.Unmarshal(payload, &packet)
		if err != nil {
			return errors.WithStack(err)
		}

		return packet.Receive(client)

	case constants.PacketClientSceneMovement:
		var packet PacketClientSceneMovement

		err = json.Unmarshal(payload, &packet)
		if err != nil {
			return errors.WithStack(err)
		}

		return packet.Receive(client)

	case constants.PacketClientSpaceSceneMovement:
		var packet PacketClientSpaceSceneMovement

		err = json.Unmarshal(payload, &packet)
		if err != nil {
			return errors.WithStack(err)
		}

		return packet.Receive(client)

	case constants.PacketClientWin:
		var packet PacketClientWin

		err = json.Unmarshal(payload, &packet)
		if err != nil {
			return errors.WithStack(err)
		}

		return packet.Receive(client)
	}

	return nil
}
