# Développement local

## Prérequis

| Outil           | Version | Pourquoi                              |
| --------------- | ------- | ------------------------------------- |
| Node            | ≥ 20    | Build Vite, exécution des scripts JS  |
| Go              | ≥ 1.21  | Compilation du serveur WebSocket      |
| Java            | ≥ 17    | Émulateur Firestore (process JVM)     |
| firebase-tools  | latest  | Lancement de l'émulateur, déploiement |

```bash
npm install -g firebase-tools
```

## Démarrage en une commande

```bash
./dev.sh                # tout
./dev.sh --no-client    # sans Vite (tests serveur)
```

Le script enchaîne :

1. Lance l'**émulateur Firestore** sur `127.0.0.1:8181`.
2. Lance le **serveur Go** sur `:8080`, env `FIRESTORE_EMULATOR_HOST`
   pointé sur l'émulateur, `GCP_PROJECT_ID=unlock-local`.
3. **Seed** les configs `/games/*` via `scripts/seed-firestore.mjs`
   (indispensable, sans ça le serveur bloque en phase pregame).
4. Crée `client/.env.local` à partir du template si absent.
5. Lance **Vite** sur `:3000`.
6. Consolide les logs dans `.dev/logs/{firestore,server,client}.log`.
7. Nettoie tout à `Ctrl+C`.

## URLs locales

| URL                              | Service                          |
| -------------------------------- | -------------------------------- |
| <http://127.0.0.1:3000>          | Client (le jeu)                  |
| `ws://127.0.0.1:8080`            | Serveur WebSocket                |
| <http://127.0.0.1:4000>          | UI émulateur Firebase            |
| `127.0.0.1:8181`                 | Émulateur Firestore (REST + gRPC) |

## Démarrage manuel

Si tu préfères contrôler chaque service :

```bash
# Terminal 1
firebase emulators:start --only firestore --project=unlock-local

# Terminal 2
FIRESTORE_EMULATOR_HOST=127.0.0.1:8181 GCP_PROJECT_ID=unlock-local \
  node scripts/seed-firestore.mjs

# Terminal 3
cd server
PORT=8080 \
GCP_PROJECT_ID=unlock-local \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8181 \
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 \
go run .

# Terminal 4
cd client
cp .env.local.example .env.local
npm install
npm run dev
```

## Tester à deux joueurs

Ouvre deux onglets en navigation privée (pour avoir des sessions
WebSocket distinctes), rejoins le même code de lobby, et l'hôte peut
démarrer la partie.

## Debug en navigateur

En dev (`import.meta.env.DEV`), le store Pinia est exposé via
`window.$store`. Dans la console :

```js
window.$store.state.lobby        // état courant du lobby
window.$store.state.game         // mini-jeu courant
window.$store.dispatch('sendPacket', { label: 'CLIENT_WIN' })  // forcer un win
```

L'**UI de l'émulateur** (<http://127.0.0.1:4000/firestore>) affiche les
documents `/lobbies` et `/games` en temps réel, très pratique pour
inspecter ce que le serveur écrit.

## Pièges courants

- **"rpc error: NotFound /games/..."** : tu as démarré le serveur sans
  seeder l'émulateur. Lance `node scripts/seed-firestore.mjs` ou
  redémarre via `./dev.sh`.
- **Le lobby disparaît après reconnexion** : c'est le comportement
  normal — `Client.quit()` supprime le lobby de Firestore quand le
  dernier client part. Reconnecte les deux clients d'abord.
- **Origin refusée par le serveur** : le serveur ne whitelist que les
  origines dans `ALLOWED_ORIGINS`. En local : `http://localhost:3000`
  ET `http://127.0.0.1:3000` (les deux !).
- **HMR Vite qui plante sur Phaser** : Phaser ne supporte pas le HMR.
  Recharge la page après une modif de scène.
