# Architecture

## Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Navigateur                                  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Vue 3 + Vuetify 3 + Pinia + VueFire                            │  │
│  │   ├─ UI (drawers, footer, classement, settings)                │  │
│  │   ├─ Phaser 3 canvas (scènes : Lobby, PreGame, GameXxx, End)   │  │
│  │   └─ Event bus mitt entre Vue et Phaser                        │  │
│  └────────────────────────────────────────────────────────────────┘  │
│           │  WebSocket (gameplay)             │  Firestore (sync     │
│           │                                   │   lobby state)       │
└───────────┼───────────────────────────────────┼──────────────────────┘
            ▼                                   ▼
   ┌─────────────────────┐              ┌─────────────────────┐
   │  Go + gorilla/      │   gRPC       │   Firestore         │
   │  websocket          │ ───────────► │   (Native mode)     │
   │  (Cloud Run)        │              │                     │
   └─────────────────────┘              └─────────────────────┘
```

- Le **client** héberge la logique de rendu et l'état UI. Il s'abonne à
  `/lobbies/{code}` pour suivre l'état du lobby en lecture seule.
- Le **serveur** est la **source de vérité du gameplay**. Il valide les
  packets entrants, fait avancer la machine à états du lobby, et écrit
  sur Firestore avec le SDK admin (les rules client n'autorisent pas
  les écritures).
- **Firestore** stocke l'état persistant du lobby et la config des
  mini-jeux (`/games/{SceneKey}`).

## Stack détaillée

### Client (`client/`)

| Lib                       | Version | Rôle                              |
| ------------------------- | ------- | --------------------------------- |
| `vue`                     | ^3.5    | Framework UI                      |
| `vuetify`                 | ^3.7    | Composants Material               |
| `pinia`                   | ^2.3    | Store (remplace Vuex)             |
| `vuefire`                 | ^3.2    | Intégration Firebase pour Vue 3   |
| `firebase`                | ^11     | SDK Firestore modulaire           |
| `vue-router`              | ^4.5    | Routing SPA                       |
| `vue-i18n`                | ^11     | i18n (mode composition)           |
| `phaser`                  | ^3.87   | Moteur de jeu canvas              |
| `mitt`                    | ^3      | Event bus Vue ↔ Phaser            |
| `vite`                    | ^6      | Bundler + dev server              |
| `@vitejs/plugin-vue`      | ^5      | SFC support                       |
| `vite-plugin-vuetify`     | ^2      | Treeshaking Vuetify               |

### Serveur (`server/`)

| Lib                                       | Version | Rôle                          |
| ----------------------------------------- | ------- | ----------------------------- |
| `github.com/gorilla/websocket`            | v1.5    | WebSocket upgrade + IO        |
| `cloud.google.com/go/firestore`           | v1.18   | Firestore admin SDK           |
| `github.com/google/uuid`                  | v1.6    | Génération UUIDs              |

## Structure du repo

```
unlock/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.vue
│       ├── main.js                  ← createApp, plugins, globalProperties
│       ├── components/              ← Display, Game, Keyboard, Ladder, Mouse, Settings + global/
│       ├── views/                   ← Home, About, lobbies/Lobby
│       ├── models/
│       │   ├── data/                ← Client, Game, Lobby (classes JS)
│       │   ├── packets/             ← Une classe par packet (label + sérialisation)
│       │   ├── scenes/              ← Phaser scenes (LobbyScene, GameXxxScene, etc.)
│       │   └── sprites/             ← Phaser sprites (Axolotl, Spaceship, Star, etc.)
│       ├── constants/               ← Enums (packet-labels, scene-keys, sprite-colors...)
│       ├── stores/
│       │   └── main.js              ← Pinia store
│       └── services/
│           ├── firebase.js          ← initializeApp + getFirestore + connectFirestoreEmulator
│           ├── event-bus.js         ← mitt
│           ├── i18n.js              ← createI18n (legacy: false)
│           ├── router.js            ← createRouter (history mode)
│           └── store.js             ← Façade Vuex-compatible vers Pinia
├── server/
│   ├── main.go                      ← HTTP + WS upgrade + CORS env
│   ├── go.mod / go.sum
│   ├── Dockerfile                   ← Multi-stage, distroless static non-root
│   ├── service.yaml                 ← Manifest Knative Cloud Run
│   ├── models/
│   │   ├── client.go                ← ReadPump / WritePump
│   │   ├── lobby.go                 ← Boucle goroutine, channels Register/Unregister/Broadcast
│   │   ├── lobby_repository.go      ← Map de lobbies, sync.RWMutex
│   │   ├── game.go                  ← Charge la config depuis /games/{SceneKey}
│   │   ├── packet*.go               ← Une struct + Receive ou Send par packet
│   │   └── data_scene_star_wars.go  ← État serveur des étoiles
│   ├── constants/                   ← Enums, timeouts, paramètres WS
│   └── firestore/                   ← Helpers admin (getClient, GetDocument, SetDocument, DeleteDocument)
├── scripts/
│   └── seed-firestore.mjs           ← Seed /games/* en dev
├── docs/
│   ├── screenshots/                 ← PNG utilisés dans la doc
│   └── wiki/                        ← Pages à coller dans le GitHub Wiki
├── firestore.rules
├── firestore.indexes.json
├── firebase.json                    ← Hosting + Firestore + emulators
├── .firebaserc
├── dev.sh                           ← Stack locale en une commande
└── deploy.sh                        ← Redéploiement cloud étape par étape
```

## Machine à états du lobby

```
            ┌─────────┐
            │ Pending │ ◄────── création du lobby
            └────┬────┘
                 │ CLIENT_LOBBY_START reçu, ≥ 2 joueurs
                 ▼
           ┌──────────┐
           │ Starting │ ─── 20s countdown ───────────┐
           └────┬─────┘                              │
            8s │                                     │
                ▼                                     │
   ┌────────────────────┐                            │
   │ StartingImminent   │ ─── cage descend ──────────┤
   └────────┬───────────┘                            │
            │ countdown LobbyStart finit             │
            ▼                                        │
        ┌─────────┐                                  │
        │ Started │ ◄───── boucle mini-jeux ─────────┘
        └────┬────┘
             │ un joueur atteint pointsGoal
             ▼
         ┌───────┐
         │ Ended │
         └───────┘
```

Détails dans `server/constants/lobby_states.go` et la logique dans
`server/models/packet_client_lobby_start.go`,
`server/models/packet_client_win.go`,
`server/models/packet_server_game_wait.go`.

## Cycle d'une manche

```
        ┌──────────────┐
        │ GameStarting │ ── SERVER_GAME_START envoyé
        └──────┬───────┘
               │
               ▼
         ┌──────────┐
         │ Started  │ ── joueurs s'affrontent (30s)
         └────┬─────┘
              │ CLIENT_WIN OU timeout
              ▼
          ┌───────┐
          │ Ended │ ── reward des winners, push Firestore
          └───────┘
              │
              │ 15s GameWait
              ▼
         (manche suivante)
```

## Protocole WebSocket

Voir [[Contrat des packets|Packets]].

## Sécurité

- Les **rules Firestore** (`firestore.rules`) autorisent uniquement la
  **lecture publique** des collections `/lobbies` et `/games`. Toute
  écriture client est refusée.
- Le serveur Go utilise l'**admin SDK** (compte de service Cloud Run)
  qui bypass les rules. C'est lui qui écrit l'état du lobby.
- CORS WebSocket validé par `ALLOWED_ORIGINS` (CSV, sans / avec trailing
  slash).
