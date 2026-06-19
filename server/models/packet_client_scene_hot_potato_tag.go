package models

import (
	"errors"
	"time"
	"unlock/constants"
)

// PacketClientSceneHotPotatoTag est émis par le client porteur de bombe
// quand son axolotl entre en collision avec un autre. Le serveur valide
// que l'expéditeur est bien le porteur, que la cible existe, qu'on ne
// retombe pas sur le même joueur, et que le cooldown est expiré.
type PacketClientSceneHotPotatoTag struct {
	Packet
	TaggedUuid string `json:"taggedUuid"`
}

func (packet *PacketClientSceneHotPotatoTag) Receive(client *Client) (err error) {
	lobby := client.Lobby
	game, gameExists := lobby.CurrentGame()

	if !gameExists || game.SceneKey != constants.SceneKeyGameHotPotato {
		return errors.New("Client " + client.Uuid + " trying to tag whereas HotPotato game not started")
	}

	data, ok := game.Data.(*DataSceneHotPotato)
	if !ok {
		return errors.New("Unable to cast game data to *DataSceneHotPotato")
	}

	// Seul le porteur peut transmettre.
	if data.HolderUuid != client.Uuid {
		return nil
	}

	// La cible doit exister, ne pas être l'émetteur, et ne pas déjà porter.
	if packet.TaggedUuid == "" || packet.TaggedUuid == client.Uuid {
		return nil
	}
	if _, exists := lobby.Clients[packet.TaggedUuid]; !exists {
		return nil
	}

	// Cooldown anti ping-pong.
	now := time.Now().UnixMilli()
	if now-data.LastTransferAt < data.CooldownMillis {
		return nil
	}

	data.HolderUuid = packet.TaggedUuid
	data.LastTransferAt = now

	return NewPacketServerSceneData(data, constants.SceneKeyGameHotPotato).Send(lobby)
}
