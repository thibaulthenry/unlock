package models

import (
	"errors"
	"time"
	"unlock/constants"
)

// PacketClientSceneBrawlDodge est émis par un participant à la Bagarre
// quand il déclenche son esquive surf (clic gauche). Le serveur vérifie
// le cooldown (8 s depuis la dernière esquive), marque le joueur comme
// Dodging pendant BrawlDodgeDurationMs (500 ms) puis remet la flèche à
// jour. Pendant la fenêtre Dodging, le joueur est immunisé aux coups de
// poing et aux bombes (cf. PunchableTargets et BombHit).
type PacketClientSceneBrawlDodge struct {
	Packet
}

func (packet *PacketClientSceneBrawlDodge) Receive(client *Client) (err error) {
	lobby := client.Lobby
	game, ok := lobby.CurrentGame()
	if !ok || game.SceneKey != constants.SceneKeyGameBrawl {
		return errors.New("Client " + client.Uuid + " trying to dodge outside Brawl")
	}
	data, ok := game.Data.(*DataSceneBrawl)
	if !ok {
		return errors.New("Unable to cast game data to *DataSceneBrawl")
	}

	if !data.IsParticipant(client.Uuid) || data.Hps[client.Uuid] <= 0 {
		return nil
	}

	now := time.Now().UnixMilli()
	if readyAt, ok := data.DodgeReadyAt[client.Uuid]; ok && now < readyAt {
		return nil
	}

	data.Dodging[client.Uuid] = true
	data.DodgeReadyAt[client.Uuid] = now + BrawlDodgeCooldownMs

	if err = NewPacketServerSceneData(data, constants.SceneKeyGameBrawl).Send(lobby); err != nil {
		return err
	}

	// Fin de l'esquive après BrawlDodgeDurationMs : on rebroadcast pour
	// retirer l'effet visuel et l'immunité.
	endUuid := lobby.Timeout(BrawlDodgeDurationMs, func() (err error) {
		clientUuid := client.Uuid
		data.Dodging[clientUuid] = false
		return NewPacketServerSceneData(data, constants.SceneKeyGameBrawl).Send(lobby)
	})
	game.AddTimeoutUuid(endUuid)
	return nil
}
