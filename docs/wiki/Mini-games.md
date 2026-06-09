# Mini-jeux

Six mini-jeux sont disponibles. Le serveur tire le suivant au hasard,
en évitant de relancer immédiatement le même que la manche précédente.

## Bagarre (`GameBrawl`)

![Bagarre - phase finale](../screenshots/04-game-brawl-bombs.png)

> Combat free-for-all : mettez KO vos adversaires pour être le dernier
> debout. Des bombes tombent et les PV se réduisent en fin de match.

### Règles

Le serveur sélectionne **2 ou 3 participants** au hasard parmi les
joueurs du lobby :
- 3 si le nombre de joueurs est impair,
- 2 sinon.

Les autres clients restent dans la scène en spectateurs (sans axolotl
contrôlé) — ils ne gagnent ni ne perdent de point pour cette manche.

Chaque participant démarre avec **5 PV**. Un coup de poing (touche
Espace, validé par le serveur via les positions connues des joueurs)
inflige 1 PV de dégât dans une portée de 80 px horizontaux et 60 px
verticaux dans la direction face. Cooldown 400 ms par participant.

### Trois terrains

Tiré au sort par le serveur via `TerrainId` (0, 1 ou 2) :

| ID | Nom              | Description                                        |
|----|------------------|----------------------------------------------------|
| 0  | Battlefield      | Sol large + 2 mini plateformes + 1 au sommet       |
| 1  | Final Destination| Une seule longue plateforme suspendue              |
| 2  | Stairs           | Escalier asymétrique (4 niveaux décalés)           |

### Pression temporelle

- **30 s** : début de la **pluie de bombes**. Le serveur en spawn une
  en moyenne toutes les 1,5 s (avec un tirage aléatoire) à un X au
  sommet de la scène. Les bombes tombent à 250 px/s (côté client) ; la
  collision avec un axolotl inflige 2 PV et le client émet
  `CLIENT_SCENE_BRAWL_BOMB_HIT` pour validation serveur.
- **45 s** (15 s restants) : début de la **décroissance du HpCap**. Le
  plafond de PV décroît linéairement de 5 à 1 : tous les PV au-dessus
  du cap sont écrêtés à chaque tick (toutes les 500 ms). Conséquence :
  dans la dernière seconde, **un coup suffit à tuer**.

### Conditions de fin

- Si un seul participant a encore des PV > 0 (à n'importe quel moment)
  → il gagne immédiatement (+1 clé), la manche s'arrête.
- À 60 s, si l'égalité persiste ou si tous les participants sont KO en
  même temps → **personne ne marque** ; la manche se termine sans
  vainqueur et la partie continue.

### Côté serveur

- Game type : Solo
- WinnersNumber : 1
- WinReward : 1 clé
- Duration : 60 000 ms

État serveur dans `server/models/data_scene_brawl.go` :
- `Players []string` : UUID des participants sélectionnés
- `Hps map[string]int` : PV actuel par UUID
- `HpCap int` : plafond de PV courant (commence à 5, descend à 1)
- `Bombs map[string]*BrawlBomb` : bombes en cours de chute
- `Positions map[string]*Coordinates` : positions serveur des participants
  (mémorisées via `CLIENT_SCENE_MOVEMENT`, utilisées pour valider les
  punches)
- `LastPunchAt map[string]int64` : timestamp du dernier coup par
  attaquant (cooldown 400 ms)

### Packets

- `CLIENT_SCENE_BRAWL_PUNCH` : `{ x, y, directionRight }` — émis quand
  le joueur déclenche un coup de poing (clic droit ou F). Le serveur
  cherche les cibles dans une hitbox depuis (x, y) en fonction de la
  direction, ignore les joueurs en pleine esquive, et applique 1 PV de
  dégât aux cibles restantes.
- `CLIENT_SCENE_BRAWL_BOMB_HIT` : `{ bombKey }` — émis quand la
  collision locale entre l'axolotl du client et une bombe est détectée.
  Le serveur supprime la bombe et applique 2 PV de dégât, sauf si le
  joueur est en pleine esquive (la bombe est alors consommée sans
  dégât).
- `CLIENT_SCENE_BRAWL_DODGE` : `{}` — émis au déclenchement d'une
  esquive (clic gauche ou E / Shift). Le serveur vérifie le cooldown
  (8 s), marque le joueur `Dodging` pendant 500 ms, et programme un
  timeout pour remettre le flag à false.

### Contrôles

- ← → : déplacement
- Espace ou ↑ : saut
- **Clic droit** (ou F au clavier) : coup de poing
- **Clic gauche** (ou E / Shift au clavier) : esquive surf

Le menu contextuel du navigateur est désactivé sur le canvas Phaser
(`input.mouse.disableContextMenu()`) ainsi que sur la fenêtre (cf.
`Game.vue`), pour que le clic droit déclenche bien le punch sans afficher
le menu natif.

### Animation du coup de poing

Au lancement d'un punch, l'axolotl effectue un petit **lunge** (tween
horizontal yoyo de 110 ms), un **halo rouge** entoure son poing avec un
cercle blanc cerclé de rouge au centre, et le texte « POW! » en jaune
gras apparaît au-dessus. Le tout grossit jusqu'à 1.8× puis s'estompe sur
700 ms. Le serveur valide indépendamment ; le visuel est purement local
pour le ressenti.

### Esquive surf

Le clic gauche déclenche l'esquive : l'axolotl devient **translucide**
(alpha 0.4) pendant 500 ms et une **vague d'eau** (deux ellipses bleues
cyan + blanche imbriquées) apparaît sous ses pieds, animée d'un léger
yoyo de mise à l'échelle. Pendant la fenêtre, le joueur est immunisé
aux coups de poing (cf. `PunchableTargets` qui filtre `Dodging`) et aux
bombes (le bomb-hit consomme la bombe sans dégât).

Le serveur impose un **cooldown de 8 s** : un petit cercle bleu à
droite de la barre de vie indique l'état. Vide quand on vient
d'esquiver, il se remplit progressivement en arc dans le sens horaire
jusqu'à être totalement plein quand la nouvelle esquive est disponible.

Une caméra zoomée à **0.75** (dézoom 25 %) permet de voir plus de
terrain pendant ce mini-jeu — utile pour anticiper bombes et adversaires.

## Chute de pommes (`GameFallingApples`)

Chaque manche dure environ **30 secondes** (`duration` dans
`/games/{SceneKey}` côté Firestore). Le gagnant reçoit **1 clé**
(`winReward`).

## Chute de pommes (`GameFallingApples`)

![Chute de pommes](../screenshots/04-game-falling-apples.png)

> Récoltez 7 pommes avant les autres joueurs.

### Règles

Des pommes tombent depuis le sommet de la forêt à intervalles réguliers.
Chaque joueur porte un **panier** sur la tête et doit se déplacer
latéralement pour attraper les pommes.

- **Win condition** : `First` — premier à 7 pommes remporte la manche.
- **Contrôles** : ← → (ou A / D).

### Côté serveur

- Game type : Solo
- WinnersNumber : 1
- WinReward : 1 clé

## Îles flottantes (`GameFloatingIslands`)

![Îles flottantes](../screenshots/04-game-floating-islands.png)

> Restez en vie en sautant entre les îles flottantes.

### Règles

Les axolotls sont propulsés au sommet d'un ciel rempli d'îles disposées
sur plusieurs étages (4 à 7 selon le nombre de joueurs). Chaque île
**s'effondre** quelques centaines de millisecondes après qu'un joueur
s'y pose : 250 ms pour les petites, 500 ms pour les grandes. Le dernier
survivant remporte la manche.

- **Win condition** : `Timeout` — dernier joueur en vie.
- **Contrôles** : ← → (déplacement), Espace (saut). Vitesse 1,5× celle
  des autres mini-jeux (`speedFactor` sur l'axolotl).
- Quand un joueur sort des limites du monde par le bas, le packet
  `CLIENT_SCENE_FLOATING_ISLANDS_FALL` est envoyé et il est éliminé.

### Anti-triche : surveillance du focus

Ce mini-jeu surveille la **visibilité de l'onglet** : si un joueur change
d'onglet (Alt-Tab, etc.) pendant la partie, son client émet un packet
`CLIENT_FOCUS` avec `state: false`, et le serveur déclenche
automatiquement un `CLIENT_SCENE_FLOATING_ISLANDS_FALL` pour l'éliminer
(cf. `server/models/game.go:HandleRequiredFocus`).

### Côté serveur

- Game type : Solo
- WinnersNumber : 1
- WinReward : 1 clé
- Duration : 30 000 ms

État serveur dans `server/models/data_scene_floating_islands.go` :
- Une map d'`Island` avec leur état (`Safe`, `Updating`, détruite)
- `RemainingPlayers` / `Losers` (set de UUIDs)
- `RemainingPlayersCount` (pour détecter le dernier survivant)

## Bombe humaine (`GameHotPotato`)

![Bombe humaine](../screenshots/04-game-hot-potato.png)

> Refilez la bombe ! Touchez un autre joueur pour vous en débarrasser
> avant qu'elle n'explose.

### Règles

Au début de la manche, le serveur tire au sort un porteur initial. Une
bombe (cercle rouge avec mèche) apparaît au-dessus de sa tête, avec un
**compte à rebours visible**. Le porteur doit toucher un autre axolotl
pour lui transférer la bombe ; un **cooldown de 1 s** empêche les
allers-retours instantanés. À t=0, le porteur final **explose** : tous
les autres joueurs gagnent la manche.

### Carte

Une arène de 1200×600 px à **4 niveaux** :

- Sol (large, full width)
- Plateforme intermédiaire gauche
- Plateforme intermédiaire droite
- Plateforme du haut

Et **deux paires de tuyaux** qui téléportent d'un étage à l'autre :

- Paire A (verte) : tuyau A1 (haut, à gauche) ↔ A2 (mid-droite)
- Paire B (orange) : tuyau B1 (haut, à droite) ↔ B2 (mid-gauche)

Effleurer un tuyau téléporte instantanément le joueur à l'autre
extrémité de la paire (cooldown 600 ms pour éviter les boucles). Idéal
pour feinter un poursuivant.

### Contrôles

- ← → : déplacement.
- Espace : saut.
- Contact avec un tuyau : téléportation.

### Côté serveur

- Game type : Solo
- WinnersNumber : **dynamique** = `len(lobby.Clients) - 1` (surchargé
  dans `Game.HandleGameData` au démarrage de la manche, parce que le
  champ Firestore est statique). Tout le monde sauf le porteur final
  gagne.
- WinReward : 1 clé
- Duration : 25 000 ms

État serveur dans `server/models/data_scene_hot_potato.go` :
- `HolderUuid` : UUID du porteur courant
- `LastTransferAt` (ms epoch) + `CooldownMillis` (1000) pour l'anti
  ping-pong côté serveur

### Packets

- `CLIENT_SCENE_HOT_POTATO_TAG` : émis par le client porteur quand il
  détecte une collision (proximité < 60 px) avec un autre axolotl. Le
  serveur valide (porteur effectif + cooldown OK) et diffuse le nouveau
  `HolderUuid` via `SERVER_SCENE_DATA`.

### Détails d'implémentation

- L'envoi initial du `SERVER_SCENE_DATA` est différé de **400 ms**
  après `HandleGameData` pour laisser le client basculer sur la scène
  `GameHotPotato` (sinon la scène `PreGame` encore active ignorerait
  le packet).
- Les positions de spawn sont **déterministes** (hash de l'UUID modulo
  une liste de 10 positions) pour éviter que tous les axolotls
  apparaissent superposés en début de manche.

## Légumes de l'espace (`GameSpaceVegetables`)

![Légumes de l'espace](../screenshots/04-game-space-vegetables.png)

> Tirez pour éliminer le légume central.

### Règles

Les joueurs pilotent un **vaisseau** en bas de l'écran. Au centre, un gros
légume est protégé par deux couronnes de petits légumes en orbite. Il
faut tirer pour briser ces couronnes puis viser le boss.

- **Win condition** : `Timeout` — quand le temps s'écoule, le gagnant est
  celui qui a porté le coup final au boss (si quelqu'un l'a abattu).
- **Contrôles** : ← → (déplacement), clic gauche (tir).

### Côté serveur

- Game type : Solo
- WinnersNumber : 1
- WinReward : 1 clé

## Guerre des étoiles (`GameStarWars`)

![Guerre des étoiles](../screenshots/04-game-star-wars.png)

> Récoltez 6 étoiles avant les autres joueurs.

### Règles

Les vaisseaux se déplacent dans toutes les directions dans l'espace. Des
étoiles spawnent aléatoirement (max 6 à la fois, séparées d'au moins 100
pixels). Il suffit de passer dessus pour les ramasser.

- **Win condition** : `First` — premier à 6 étoiles gagne (cf.
  `server/models/packet_client_scene_star_wars_collect.go` :
  `if data.Points[client.Uuid] > 5`).
- **Contrôles** : ↑ ↓ ← → (ou ZQSD / WASD).

### Côté serveur

- Game type : Solo
- WinnersNumber : 1
- WinReward : 1 clé

## Configuration des mini-jeux

Les paramètres ci-dessus sont stockés dans la collection Firestore
`/games/{SceneKey}`. En production ils existent dans le projet GCP. En
dev local, ils sont seedés par `scripts/seed-firestore.mjs` (appelé
automatiquement par `dev.sh`).

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8181 GCP_PROJECT_ID=unlock-local \
  node scripts/seed-firestore.mjs
```

Le code de chaque scène est dans `client/src/models/scenes/` :

- `game-brawl-scene.js`
- `game-falling-apples-scene.js`
- `game-floating-islands-scene.js`
- `game-hot-potato-scene.js`
- `game-space-vegetables-scene.js`
- `game-star-wars-scene.js`

Logique métier serveur :
- `server/models/data_scene_brawl.go` — Bagarre (participants, PV,
  HpCap, bombes, positions)
- `server/models/data_scene_star_wars.go` — StarWars (positions des
  étoiles)
- `server/models/data_scene_floating_islands.go` — Floating Islands
  (îles, joueurs restants, étages, focus)
- `server/models/data_scene_hot_potato.go` — Hot Potato (porteur,
  cooldown de transfert)

Les deux autres mini-jeux (FallingApples, SpaceVegetables) sont gérés
côté client avec validation par `CLIENT_WIN`.
