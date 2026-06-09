package models

import (
	"errors"
	"unlock/constants"
)

// PacketClientSceneBrawlBombHit est émis par le client quand sa propre
// bombe le touche (collision détectée côté client). Le serveur valide
// que la bombe existe et applique 2 dégâts à l'émetteur.
type PacketClientSceneBrawlBombHit struct {
	Packet
	BombKey string `json:"bombKey"`
}

func (packet *PacketClientSceneBrawlBombHit) Receive(client *Client) (err error) {
	lobby := client.Lobby
	game, ok := lobby.CurrentGame()
	if !ok || game.SceneKey != constants.SceneKeyGameBrawl {
		return errors.New("Client " + client.Uuid + " trying to bomb-hit outside Brawl")
	}
	data, ok := game.Data.(*DataSceneBrawl)
	if !ok {
		return errors.New("Unable to cast game data to *DataSceneBrawl")
	}

	if !data.IsParticipant(client.Uuid) || data.Hps[client.Uuid] <= 0 {
		return nil
	}

	if _, exists := data.Bombs[packet.BombKey]; !exists {
		return nil
	}

	delete(data.Bombs, packet.BombKey)
	data.ApplyDamage(client.Uuid, 2)

	if err = NewPacketServerSceneData(data, constants.SceneKeyGameBrawl).Send(lobby); err != nil {
		return err
	}

	return brawlCheckEarlyVictory(lobby, game, data)
}
