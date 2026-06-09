package models

import (
	"github.com/google/uuid"
	"math"
	"math/rand"
)

// DataSceneBrawl est l'état serveur du mini-jeu "Bagarre" :
// combat free-for-all entre 2 ou 3 participants tirés au sort
// (3 si la taille du lobby est impaire, 2 sinon). Chaque participant
// commence avec InitialHp PV ; un coup de poing en inflige 1. À partir
// de la 30e seconde, des bombes tombent du ciel et infligent des
// dégâts. Dans les 15 dernières secondes, un HpCap décroît
// progressivement jusqu'à 1 (donc un coup de poing élimine).
type DataSceneBrawl struct {
	Players       []string                `json:"players"`
	Hps           map[string]int          `json:"hps"`
	InitialHp     int                     `json:"initialHp"`
	HpCap         int                     `json:"hpCap"`
	Bombs         map[string]*BrawlBomb   `json:"bombs"`
	TerrainId     int                     `json:"terrainId"`
	ElapsedMillis int                     `json:"elapsedMillis"`

	// Champs internes non sérialisés.
	StartMillis  int64                       `json:"-" firestore:"-"`
	Positions    map[string]*Coordinates     `json:"-" firestore:"-"`
	LastPunchAt  map[string]int64            `json:"-" firestore:"-"`
	Finalized    bool                        `json:"-" firestore:"-"`
}

type BrawlBomb struct {
	Key string  `json:"key"`
	X   float64 `json:"x"`
}

const (
	BrawlInitialHp       = 5
	BrawlPunchRange      = 80.0
	BrawlPunchVertical   = 60.0
	BrawlPunchCooldownMs = 400
	BrawlBombSpawnAfter  = 30000 // ms à partir desquels des bombes spawnent
	BrawlCapDecayStart   = 45000 // ms à partir desquels HpCap décroît
	BrawlDurationMs      = 60000
)

// NewDataSceneBrawl sélectionne les participants et le terrain.
func NewDataSceneBrawl(lobby *Lobby, startMillis int64) *DataSceneBrawl {
	allUuids := make([]string, 0, len(lobby.Clients))
	for uuid := range lobby.Clients {
		allUuids = append(allUuids, uuid)
	}

	// 3 participants si le lobby a un nombre impair de joueurs, 2 sinon.
	wanted := 2
	if len(allUuids)%2 == 1 {
		wanted = 3
	}
	if wanted > len(allUuids) {
		wanted = len(allUuids)
	}

	rand.Shuffle(len(allUuids), func(i, j int) { allUuids[i], allUuids[j] = allUuids[j], allUuids[i] })
	players := allUuids[:wanted]

	hps := make(map[string]int, wanted)
	for _, u := range players {
		hps[u] = BrawlInitialHp
	}

	return &DataSceneBrawl{
		Players:       players,
		Hps:           hps,
		InitialHp:     BrawlInitialHp,
		HpCap:         BrawlInitialHp,
		Bombs:         make(map[string]*BrawlBomb),
		TerrainId:     rand.Intn(3),
		ElapsedMillis: 0,
		StartMillis:   startMillis,
		Positions:     make(map[string]*Coordinates),
		LastPunchAt:   make(map[string]int64),
	}
}

// AlivePlayers retourne la liste des UUID encore vivants (HP > 0).
func (d *DataSceneBrawl) AlivePlayers() []string {
	alive := []string{}
	for _, u := range d.Players {
		if d.Hps[u] > 0 {
			alive = append(alive, u)
		}
	}
	return alive
}

// IsParticipant indique si un client fait partie du combat en cours.
func (d *DataSceneBrawl) IsParticipant(uuid string) bool {
	for _, u := range d.Players {
		if u == uuid {
			return true
		}
	}
	return false
}

// ApplyDamage retire damage PV à un joueur, plafonné à 0.
// Retourne true si le joueur vient d'être éliminé par ce coup.
func (d *DataSceneBrawl) ApplyDamage(targetUuid string, damage int) bool {
	hp, ok := d.Hps[targetUuid]
	if !ok || hp <= 0 {
		return false
	}
	hp -= damage
	if hp < 0 {
		hp = 0
	}
	d.Hps[targetUuid] = hp
	return hp == 0
}

// ApplyHpCap force tous les PV à rester sous HpCap (utilisé pendant la
// phase de décroissance).
func (d *DataSceneBrawl) ApplyHpCap() {
	for u, hp := range d.Hps {
		if hp > d.HpCap {
			d.Hps[u] = d.HpCap
		}
	}
}

// PunchableTargets retourne les UUID des joueurs touchables depuis
// (x, y) en regardant dans la direction directionRight.
func (d *DataSceneBrawl) PunchableTargets(attackerUuid string, attackerX, attackerY float64, directionRight bool) []string {
	targets := []string{}
	for _, u := range d.Players {
		if u == attackerUuid {
			continue
		}
		if d.Hps[u] <= 0 {
			continue
		}
		pos, ok := d.Positions[u]
		if !ok {
			continue
		}
		dx := pos.X - attackerX
		dy := math.Abs(pos.Y - attackerY)
		if dy > BrawlPunchVertical {
			continue
		}
		if directionRight && dx > 0 && dx < BrawlPunchRange {
			targets = append(targets, u)
		}
		if !directionRight && dx < 0 && -dx < BrawlPunchRange {
			targets = append(targets, u)
		}
	}
	return targets
}

// SpawnBomb crée une bombe à un x aléatoire en haut de la scène.
func (d *DataSceneBrawl) SpawnBomb() *BrawlBomb {
	bomb := &BrawlBomb{
		Key: uuid.NewString(),
		X:   float64(60 + rand.Intn(1080)),
	}
	d.Bombs[bomb.Key] = bomb
	return bomb
}
