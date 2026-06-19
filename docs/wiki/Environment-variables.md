# Variables d'environnement

Référence exhaustive des env vars consommées dans le repo.

## Racine (`.env` lue par `deploy.sh`)

| Variable                              | Obligatoire | Défaut             | Description                                          |
| ------------------------------------- | ----------- | ------------------ | ---------------------------------------------------- |
| `PROJECT_ID`                          | ✓           | —                  | ID du projet GCP cible                               |
| `REGION`                              | ✓           | —                  | Région GCP (ex. `europe-west1`)                      |
| `SERVICE_NAME`                        | ✓           | —                  | Nom du service Cloud Run                             |
| `ARTIFACT_REPO`                       | ✓           | —                  | Nom du repo Artifact Registry                        |
| `ALLOWED_ORIGINS`                     | ✓           | —                  | CSV des origins autorisées par le WS (sans /)        |
| `IMAGE_TAG`                           |             | court SHA git      | Tag de l'image Docker                                |
| `MIN_INSTANCES`                       |             | 0                  | Cloud Run min instances                              |
| `MAX_INSTANCES`                       |             | 3                  | Cloud Run max instances                              |
| `CLOUD_RUN_CONCURRENCY`               |             | 80                 | Concurrent requests / instance                       |
| `CLOUD_RUN_MEMORY`                    |             | 256Mi              | Mémoire allouée                                      |
| `CLOUD_RUN_CPU`                       |             | 1                  | vCPU alloué                                          |
| `CLOUD_RUN_TIMEOUT`                   |             | 3600               | Timeout requête (s)                                  |
| `FIREBASE_SITE`                       |             | =`PROJECT_ID`      | Nom du site Hosting                                  |
| `VUE_APP_FIREBASE_API_KEY`            |             | —                  | Injecté dans `client/.env.production`                |
| `VUE_APP_FIREBASE_AUTH_DOMAIN`        |             | —                  | idem                                                 |
| `VUE_APP_FIREBASE_PROJECT_ID`         |             | =`PROJECT_ID`      | idem                                                 |
| `VUE_APP_FIREBASE_STORAGE_BUCKET`     |             | —                  | idem                                                 |
| `VUE_APP_FIREBASE_MESSAGING_SENDER_ID`|             | —                  | idem                                                 |
| `VUE_APP_FIREBASE_APP_ID`             |             | —                  | idem                                                 |

> Le script écrit aussi automatiquement `VUE_APP_WEBSOCKET_URL` dans
> `client/.env.production` à partir de l'URL Cloud Run récupérée.

## Serveur (`server/`)

| Variable                  | Obligatoire | Défaut                                                                    | Description                                       |
| ------------------------- | ----------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `PORT`                    |             | `8080`                                                                    | Port HTTP d'écoute (Cloud Run l'injecte)          |
| `GCP_PROJECT_ID`          |             | `unlock-db`                                                               | Projet GCP cible pour Firestore                   |
| `ALLOWED_ORIGINS`         |             | `https://unlock-db.web.app,https://unlock-db.firebaseapp.com`             | Origines autorisées par le WS                     |
| `FIRESTORE_EMULATOR_HOST` |             | —                                                                         | Pointe le SDK Go sur un émulateur (dev local)     |

## Client (`client/`)

Le client Vite lit toutes les variables préfixées `VITE_` au build.

Pour le dev local, mettre dans `client/.env.local` :

| Variable                              | Obligatoire | Défaut                                                                | Description                              |
| ------------------------------------- | ----------- | --------------------------------------------------------------------- | ---------------------------------------- |
| `VITE_FIREBASE_API_KEY`               |             | clé du projet `unlock-db`                                             | Config Firebase JS SDK                   |
| `VITE_FIREBASE_AUTH_DOMAIN`           |             | `unlock-db.firebaseapp.com`                                           | idem                                     |
| `VITE_FIREBASE_PROJECT_ID`            |             | `unlock-db`                                                           | idem                                     |
| `VITE_FIREBASE_STORAGE_BUCKET`        |             | `unlock-db.appspot.com`                                               | idem (utilisé aussi pour les images du carousel) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`   |             | —                                                                     | idem                                     |
| `VITE_FIREBASE_APP_ID`                |             | —                                                                     | idem                                     |
| `VITE_WEBSOCKET_URL`                  |             | `wss://unlock-server-dvibvdky5q-ew.a.run.app`                         | URL du serveur WS                        |
| `VITE_FIRESTORE_EMULATOR_HOST`        |             | —                                                                     | Pointe le SDK Firebase JS sur un émulateur Firestore |

> Le fichier `client/.env.production` est généré par `deploy.sh` et ne
> doit pas être commité.

## Récapitulatif par scénario

### Lancement local avec émulateur

```env
# server/.env (ou export inline)
PORT=8080
GCP_PROJECT_ID=unlock-local
FIRESTORE_EMULATOR_HOST=127.0.0.1:8181
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# client/.env.local
VITE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8181
VITE_WEBSOCKET_URL=ws://localhost:8080
VITE_FIREBASE_PROJECT_ID=unlock-local
```

`dev.sh` crée automatiquement ces fichiers à partir des `.example`.

### Lancement local contre la prod (déconseillé)

```env
# server pas applicable
# client/.env.local
VITE_WEBSOCKET_URL=wss://unlock-server-dvibvdky5q-ew.a.run.app
VITE_FIREBASE_PROJECT_ID=unlock-db
```

> Attention : le serveur prod refuse les origins `localhost`. Pour
> tester, soit ajouter localhost à `ALLOWED_ORIGINS` en prod (mauvaise
> idée), soit utiliser l'émulateur.

### Déploiement sur nouveau projet GCP

Remplir le `.env` à la racine avec ton nouveau `PROJECT_ID`, `REGION` et
toute la config Firebase client, puis `./deploy.sh`.
