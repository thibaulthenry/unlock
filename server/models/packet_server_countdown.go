package models

import (
	"encoding/json"
	"unlock/constants"
)

type PacketServerCountdown struct {
	Packet
	Delay      int     `json:"delay"`
	Percentage float64 `json:"percentage"`
}

func NewPacketServerCountdown(delay int, percentage float64) *PacketServerCountdown {
	return &PacketServerCountdown{
		Packet: Packet{
			Label: constants.PacketServerCountdown,
		},
		Delay: delay,
		Percentage: percentage,
	}
}

func (packet *PacketServerCountdown) Send(lobby *Lobby) (err error) {
	payload, err := json.Marshal(packet)
	if err != nil {
		return err
	}

	lobby.Broadcast <- payload

	return nil
}
