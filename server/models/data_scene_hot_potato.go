package models

import (
	"math/rand"
)

// DataSceneHotPotato représente l'état du mini-jeu "Bombe humaine" :
// un porteur de bombe désigné, qui doit la transmettre par contact à un
// autre joueur avant la fin du chrono. À l'expiration, le porteur perd
// et tous les autres gagnent.
//
// - HolderUuid       : UUID du joueur portant actuellement la bombe.
// - LastTransferAt   : timestamp serveur (ms epoch) du dernier transfert
//                      réussi. Sert au cooldown anti ping-pong.
// - CooldownMillis   : temps minimum entre deux transferts.
type DataSceneHotPotato struct {
	HolderUuid     string `json:"holderUuid" firestore:"-"`
	LastTransferAt int64  `json:"lastTransferAt" firestore:"-"`
	CooldownMillis int64  `json:"cooldownMillis" firestore:"-"`
}

// NewDataSceneHotPotato choisit un porteur initial au hasard parmi les
// clients présents dans le lobby.
func NewDataSceneHotPotato(lobby *Lobby) *DataSceneHotPotato {
	uuids := make([]string, 0, len(lobby.Clients))
	for uuid := range lobby.Clients {
		uuids = append(uuids, uuid)
	}

	holder := ""
	if len(uuids) > 0 {
		holder = uuids[rand.Intn(len(uuids))]
	}

	return &DataSceneHotPotato{
		HolderUuid:     holder,
		LastTransferAt: 0,
		CooldownMillis: 1000,
	}
}
