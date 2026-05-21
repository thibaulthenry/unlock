# Contrat des packets

Toute la communication client ↔ serveur passe par des messages JSON envoyés
sur la WebSocket. Chaque packet a un champ `label` qui identifie son type ;
les champs additionnels dépendent du type.

> **Règle d'or** : modifier un packet d'un côté **doit toujours** se faire
> en miroir de l'autre. Une rupture de contrat casse silencieusement le
> gameplay (paquets ignorés sans erreur visible côté UI).

- Côté **serveur** : `server/models/packet_*.go` — une struct + une
  méthode `Receive` ou `Send`.
- Côté **client** : `client/src/models/packets/packet-*.js` — une classe
  avec `label` et propriétés.
- Labels canoniques : `server/constants/packet_labels.go` et
  `client/src/constants/packet-labels.js`.

## Packets client → serveur

### `CLIENT_CONNECTION`

Émis dès l'ouverture de la WebSocket. Demande à rejoindre (ou créer) un
lobby.

```json
{
  "label": "CLIENT_CONNECTION",
  "clientName": "Alice",
  "lobbyCapacity": 5,
  "lobbyCode": "demo-1",
  "LobbyPointsGoal": 5
}
```

Réponse : `SERVER_CONNECTION` avec l'UUID assigné au client et le code
final.

### `CLIENT_LOBBY_START`

Le propriétaire demande à démarrer la partie. Le serveur vérifie
`owner === client.Uuid` et l'état `Pending`.

```json
{ "label": "CLIENT_LOBBY_START" }
```

### `CLIENT_FOCUS`

Émis dès qu'un joueur change la visibilité de son onglet
(`document.visibilitychange`). Le serveur s'en sert dans Floating Islands
pour éliminer un joueur qui Alt-Tab pendant la partie.

```json
{ "label": "CLIENT_FOCUS", "state": true }
```

### `CLIENT_SCENE_FLOATING_ISLANDS_COLLIDE`

Émis chaque fois que l'axolotl atterrit sur une île. Le serveur lance un
timeout de 250 ms (petite île) ou 500 ms (grande) avant de faire passer
l'île à l'état suivant (instable puis détruite).

```json
{ "label": "CLIENT_SCENE_FLOATING_ISLANDS_COLLIDE", "key": "320" }
```

### `CLIENT_SCENE_FLOATING_ISLANDS_FALL`

Émis quand l'axolotl sort des limites du monde par le bas (chute hors du
ciel). Le serveur marque le client comme perdant. Si un seul joueur
reste, il est déclaré vainqueur via `CLIENT_WIN`.

```json
{ "label": "CLIENT_SCENE_FLOATING_ISLANDS_FALL" }
```

### `CLIENT_SCENE_MOVEMENT`

Émis ~30 fois par seconde par chaque client pour propager sa position
dans la scène courante.

```json
{
  "label": "CLIENT_SCENE_MOVEMENT",
  "coordinates": { "x": 312.5, "y": 480, "vx": 0, "vy": 0, "ax": 0, "ay": 0, "r": 0 },
  "motion": { "direction": "right", "jumping": false, "walking": true },
  "sceneKey": "LobbyScene"
}
```

Le serveur le re-broadcast à tous les autres clients du lobby sous forme
de `SERVER_SCENE_MOVEMENT`.

### `CLIENT_SCENE_STAR_WARS_COLLECT`

Spécifique à `GameStarWars`. Le client signale qu'il a passé sur une
étoile.

```json
{ "label": "CLIENT_SCENE_STAR_WARS_COLLECT", "starUuid": "abc-123" }
```

Le serveur valide l'existence de l'étoile et incrémente les points du
client. Si points > 5, déclenche automatiquement un `CLIENT_WIN`.

### `CLIENT_WIN`

Émis quand le client estime avoir gagné la manche en cours (premier à
attraper 7 pommes pour FallingApples, dernier survivant pour
SpaceVegetables, etc.).

```json
{ "label": "CLIENT_WIN" }
```

Validations serveur (`server/models/packet_client_win.go`) :
- Le lobby a un mini-jeu courant.
- L'état du mini-jeu est `Started`.
- Le nombre de winners n'est pas déjà atteint (`game.WinnersNumber`).
- Le client n'est pas déjà dans `game.Winners`.

Si tout passe, le client est ajouté aux winners. Quand
`len(winners) === winnersNumber`, le mini-jeu est interrompu, les
rewards sont distribués, et si un joueur atteint `pointsGoal` →
`SERVER_LOBBY_END`.

## Packets serveur → clients

### `SERVER_CONNECTION`

Réponse à `CLIENT_CONNECTION`. Envoyé uniquement au client connecté.

```json
{
  "label": "SERVER_CONNECTION",
  "client": { "uuid": "...", "name": "Alice", "points": 0, "spectating": false, "spriteColor": "purple" },
  "lobbyCode": "demo-1"
}
```

### `SERVER_COUNTDOWN`

Broadcasté ~10 fois par seconde pour mettre à jour la barre de
countdown du client.

```json
{ "label": "SERVER_COUNTDOWN", "delay": 20, "percentage": 47.3 }
```

### `SERVER_GAME_START`

Annonce le démarrage du mini-jeu (après le 15 s GameWait). Le client
change de scène Phaser.

```json
{ "label": "SERVER_GAME_START" }
```

### `SERVER_GAME_WAIT`

Émis à la fin d'un mini-jeu (ou au passage Starting → Started). Le
client change pour la scène `PreGame` (ou `PreGameFall` pour les
perdants de la manche précédente).

```json
{
  "label": "SERVER_GAME_WAIT",
  "initialisation": false,
  "points": { "uuid-1": 1, "uuid-2": 0 },
  "previousWinners": { "uuid-1": true }
}
```

### `SERVER_LOBBY_COLLAPSE`

Déclenche l'animation de la cage qui tombe (vers t=10s dans la phase
Starting). Pure UX, pas d'effet sur l'état.

### `SERVER_LOBBY_INTERRUPT`

Émis quand il ne reste plus qu'un joueur dans un lobby actif (les
autres se sont déconnectés). Le client est renvoyé à l'accueil avec un
snackbar d'erreur.

### `SERVER_LOBBY_END`

Émis quand un joueur atteint `pointsGoal`. Déclenche l'EndScene.

```json
{
  "label": "SERVER_LOBBY_END",
  "winners": { "uuid-1": {...} },
  "losers": { "uuid-2": {...} }
}
```

### `SERVER_SCENE_DATA`

Données spécifiques à la scène en cours. Utilisé pour `GameStarWars`
(positions des étoiles) et `GameSpaceVegetables` (points de vie du
boss).

```json
{
  "label": "SERVER_SCENE_DATA",
  "sceneKey": "GameStarWars",
  "data": { "points": { "uuid-1": 2 }, "stars": { "uuid-abc": {...} } }
}
```

### `SERVER_SCENE_MOVEMENT`

Re-broadcast d'un `CLIENT_SCENE_MOVEMENT` à tous les autres clients du
lobby.

## Boucle de jeu typique

```
Client A                    Serveur                      Client B
   │                           │                            │
   │── CLIENT_CONNECTION ─────►│                            │
   │◄────── SERVER_CONNECTION──│                            │
   │                           │                            │
   │                           │◄──── CLIENT_CONNECTION ────│
   │                           │── SERVER_CONNECTION ──────►│
   │                           │                            │
   │── CLIENT_LOBBY_START ────►│                            │
   │                           │── SERVER_COUNTDOWN ──────► │
   │◄────── SERVER_COUNTDOWN ──│                            │
   │             (20s)         │                            │
   │                           │── SERVER_GAME_WAIT ──────► │
   │◄───── SERVER_GAME_WAIT ───│                            │
   │             (15s)         │                            │
   │                           │── SERVER_GAME_START ─────► │
   │◄──── SERVER_GAME_START ───│                            │
   │                           │                            │
   │── CLIENT_SCENE_MOVEMENT ─►│── SERVER_SCENE_MOVEMENT ──►│
   │◄── SERVER_SCENE_MOVEMENT──│◄── CLIENT_SCENE_MOVEMENT ──│
   │             ...           │            ...             │
   │                           │                            │
   │─── CLIENT_WIN ───────────►│                            │
   │                           │── SERVER_GAME_WAIT ──────► │
   │◄───── SERVER_GAME_WAIT ───│   (boucle ou LOBBY_END)    │
```
