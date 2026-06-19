package models

import (
	"unlock/constants"
)

type PacketClientSceneMovement struct {
	Packet
	Coordinates *Coordinates       `json:"coordinates"`
	Motion      *Motion            `json:"motion"`
	SceneKey    constants.SceneKey `json:"sceneKey"`
}

func (packet *PacketClientSceneMovement) Receive(client *Client) (err error) {
	// Pour la Bagarre, on mémorise la position serveur pour valider les
	// coups de poing entre joueurs.
	if game, exists := client.Lobby.CurrentGame(); exists && game.SceneKey == constants.SceneKeyGameBrawl {
		if data, ok := game.Data.(*DataSceneBrawl); ok && packet.Coordinates != nil {
			data.Positions[client.Uuid] = packet.Coordinates
		}
	}

	return NewPacketServerSceneMovement(packet.Coordinates, client.Uuid, packet.Motion, packet.SceneKey).Send(client.Lobby)
}
