# Unlock

Jeu vidéo multijoueur en temps réel. Trois mini-jeux (Falling Apples, Space
Vegetables, Star Wars), lobbies à 5 joueurs max, synchronisation Firestore +
WebSocket.

## Stack

| Composant   | Technologie                                                       | Hébergement                |
| ----------- | ----------------------------------------------------------------- | -------------------------- |
| Client      | Vue + Vuetify + Phaser 3, build Vite                              | Firebase Hosting           |
| Serveur     | Go + gorilla/websocket + Firestore Admin SDK                      | Cloud Run (Artifact Registry) |
| Base        | Firestore (mode natif)                                            | GCP                        |

> La refonte technique en cours migre le client de Vue 2/Vuetify 2/Vue CLI vers
> Vue 3/Vuetify 3/Vite, le serveur de Go 1.16 vers Go 1.23+, et passe l'image
> Cloud Run sur distroless. La logique de jeu (scènes Phaser, sprites, packets,
> timeouts) reste strictement identique.

## Arborescence

```
unlock/
├── client/                    # SPA Vue + Phaser
│   ├── src/
│   └── package.json
├── server/                    # WebSocket Go
│   ├── main.go
│   ├── models/                # Lobby, Client, packets (contrat avec le client)
│   ├── constants/             # Enums, timeouts, sprite colors
│   ├── firestore/             # Helpers Firestore admin
│   ├── Dockerfile
│   └── service.yaml           # Manifest Knative Cloud Run (paramétrable)
├── firestore.rules            # Règles de sécurité Firestore
├── firestore.indexes.json
├── firebase.json              # Hosting + Firestore
├── .firebaserc                # Projet GCP par défaut
├── deploy.sh                  # Redéploiement complet, étape par étape
└── .env.example               # Variables consommées par deploy.sh
```

## Prérequis pour redéployer

- `gcloud` (authentifié : `gcloud auth login` + `gcloud config set project ...`)
- `firebase` CLI (authentifié : `firebase login`)
- `node` >= 20
- `go` >= 1.21 (cible : 1.23)
- `docker` (pour le build de l'image serveur)

## Redéploiement complet

```bash
cp .env.example .env
# éditer .env : PROJECT_ID, REGION, ALLOWED_ORIGINS, config Firebase client...
./deploy.sh
```

Le script enchaîne, de façon idempotente :

1. Vérification des prérequis et de l'authentification.
2. Activation des APIs GCP (Cloud Run, Artifact Registry, Firestore, Firebase, Cloud Build).
3. Création du dépôt Artifact Registry si absent.
4. Création de la base Firestore si absente.
5. Déploiement des règles + indexes Firestore.
6. Build & push de l'image serveur dans Artifact Registry.
7. Déploiement Cloud Run (session-affinity activée pour le WebSocket).
8. Récupération de l'URL Cloud Run et écriture de `client/.env.production`.
9. Build du client (`npm ci && npm run build`).
10. Déploiement Firebase Hosting.

Options utiles : `--skip-server`, `--skip-client`, `--skip-infra`, `--dry-run`,
`--tag <sha>`.

## Développement local

### Serveur

```bash
cd server
export PORT=8080
export GCP_PROJECT_ID=unlock-db
export ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
# Optionnel : émulateur Firestore (firebase emulators:start --only firestore)
# export FIRESTORE_EMULATOR_HOST=localhost:8080
go run .
```

### Client

```bash
cd client
cp .env.example .env.local
# éditer .env.local : VUE_APP_WEBSOCKET_URL=ws://localhost:8080 + config Firebase
npm install
npm run serve
```

## Variables d'environnement

Voir les fichiers `*.env.example` à chaque niveau du repo. Les valeurs cibles
par défaut pointent sur le projet `unlock-db` existant et restent compatibles
si aucune variable n'est définie.
