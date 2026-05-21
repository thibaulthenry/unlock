# Mini-jeux

Trois mini-jeux sont disponibles. Le serveur tire le suivant au hasard,
en évitant de relancer immédiatement le même que la manche précédente.

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

- `game-falling-apples-scene.js`
- `game-space-vegetables-scene.js`
- `game-star-wars-scene.js`

Et la logique métier serveur dans `server/models/data_scene_star_wars.go`
(pour StarWars qui maintient un état serveur des étoiles ; les deux
autres sont gérés côté client avec validation par `CLIENT_WIN`).
