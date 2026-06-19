package models

import (
	"errors"
	"time"
	"unlock/constants"
)

// PacketClientSceneBrawlPunch est émis par le client quand il appuie sur
// la touche de coup de poing. Le serveur cherche les cibles à portée
// (depuis la position connue de l'attaquant + sa direction) et leur
// inflige 1 dégât. Cooldown 400 ms par attaquant.
type PacketClientSceneBrawlPunch struct {
	Packet
	X              float64 `json:"x"`
	Y              float64 `json:"y"`
	DirectionRight bool    `json:"directionRight"`
}

func (packet *PacketClientSceneBrawlPunch) Receive(client *Client) (err error) {
	lobby := client.Lobby
	game, ok := lobby.CurrentGame()
	if !ok || game.SceneKey != constants.SceneKeyGameBrawl {
		return errors.New("Client " + client.Uuid + " trying to punch outside Brawl")
	}
	data, ok := game.Data.(*DataSceneBrawl)
	if !ok {
		return errors.New("Unable to cast game data to *DataSceneBrawl")
	}

	if !data.IsParticipant(client.Uuid) || data.Hps[client.Uuid] <= 0 {
		return nil
	}

	now := time.Now().UnixMilli()
	if last, ok := data.LastPunchAt[client.Uuid]; ok && now-last < BrawlPunchCooldownMs {
		return nil
	}
	data.LastPunchAt[client.Uuid] = now

	// Mémorise la position de l'attaquant (utile aussi pour valider les
	// punches des autres).
	data.Positions[client.Uuid] = &Coordinates{X: packet.X, Y: packet.Y}

	// Expose le coup aux autres clients pour l'animation distante.
	data.LastPunch = &BrawlPunch{
		Uuid:           client.Uuid,
		AtMs:           now,
		DirectionRight: packet.DirectionRight,
	}

	targets := data.PunchableTargets(client.Uuid, packet.X, packet.Y, packet.DirectionRight)
	for _, t := range targets {
		data.ApplyDamage(t, 1)
	}

	if err = NewPacketServerSceneData(data, constants.SceneKeyGameBrawl).Send(lobby); err != nil {
		return err
	}

	return brawlCheckEarlyVictory(lobby, game, data)
}

// brawlCheckEarlyVictory : si un seul participant est en vie avant la fin
// du chrono, la partie se termine immédiatement avec lui comme vainqueur.
func brawlCheckEarlyVictory(lobby *Lobby, game *Game, data *DataSceneBrawl) error {
	if data.Finalized {
		return nil
	}
	alive := data.AlivePlayers()
	if len(alive) == 1 {
		data.Finalized = true
		win := &PacketClientWin{}
		return win.Receive(lobby.Clients[alive[0]])
	}
	if len(alive) == 0 {
		// Tout le monde KO en même temps : aucun winner.
		data.Finalized = true
		game.State = constants.GameStateEnded
		return NewPacketServerGameWait(false).Send(lobby)
	}
	return nil
}
