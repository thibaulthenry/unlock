# Redéploiement cloud

## Vue d'ensemble

Le script `deploy.sh` à la racine du repo orchestre le déploiement
complet de la stack sur Google Cloud Platform :

- **Hosting** (Firebase Hosting) pour le client statique.
- **Cloud Run** (Artifact Registry) pour le serveur Go.
- **Firestore** pour la base.

Toutes les ressources sont **paramétrables** via un `.env` à la racine,
ce qui permet de redéployer dans un nouveau projet GCP sans modifier le
code.

## Prérequis

| Outil          | Pourquoi                                          |
| -------------- | ------------------------------------------------- |
| `gcloud`       | API GCP, Artifact Registry, Cloud Run, Firestore  |
| `firebase`     | Hosting + rules Firestore                         |
| `node` ≥ 20    | Build Vite du client                              |
| `go` ≥ 1.21    | Compilation du serveur (en backup à Docker)       |
| `docker`       | Build de l'image Cloud Run                        |

Authentification :

```bash
gcloud auth login
gcloud auth application-default login   # optionnel
gcloud config set project <PROJECT_ID>
firebase login
```

## Première utilisation

```bash
cp .env.example .env
$EDITOR .env
./deploy.sh
```

Variables clés dans `.env` :

```env
PROJECT_ID=mon-projet-gcp
REGION=europe-west1
SERVICE_NAME=unlock-server
ARTIFACT_REPO=unlock
ALLOWED_ORIGINS=https://mon-projet-gcp.web.app,https://mon-projet-gcp.firebaseapp.com
MIN_INSTANCES=0
MAX_INSTANCES=3
FIREBASE_SITE=mon-projet-gcp

# Config Firebase client (récupérable via Firebase console > project settings)
VUE_APP_FIREBASE_API_KEY=...
VUE_APP_FIREBASE_AUTH_DOMAIN=...
VUE_APP_FIREBASE_PROJECT_ID=...
VUE_APP_FIREBASE_STORAGE_BUCKET=...
VUE_APP_FIREBASE_MESSAGING_SENDER_ID=...
VUE_APP_FIREBASE_APP_ID=...
```

## Étapes orchestrées par `deploy.sh`

1. **`check_prereqs`** : vérifie `gcloud`, `firebase`, `node ≥ 20`,
   `go ≥ 1.21`, `docker`, et que `gcloud auth` est actif.
2. **`load_env`** : sourcing du `.env`, valide les variables obligatoires.
3. **`enable_apis`** : active les APIs GCP (Cloud Run, Artifact Registry,
   Firestore, Firebase, Cloud Build). Idempotent.
4. **`ensure_artifact_repo`** : crée le dépôt Docker dans
   `${REGION}-docker.pkg.dev` si absent.
5. **`ensure_firestore`** : crée la base Firestore en mode `(default)`
   dans `${REGION}` si absente.
6. **`deploy_firestore_rules`** : `firebase deploy --only
   firestore:rules,firestore:indexes`.
7. **`build_and_push_server`** : `docker build server/` puis
   `docker push` vers Artifact Registry.
8. **`deploy_cloud_run`** : `gcloud run deploy` avec `session-affinity`,
   `timeout=3600s`, `concurrency`, min/max instances, env vars
   `GCP_PROJECT_ID` et `ALLOWED_ORIGINS`.
9. **`fetch_ws_url`** : récupère l'URL Cloud Run, la convertit en `wss://`
   et l'écrit dans `client/.env.production`.
10. **`build_client`** : `cd client && npm ci && npm run build`.
11. **`deploy_hosting`** : `firebase deploy --only hosting`.
12. **`print_summary`** : URLs finales, tag d'image, SHA git.

## Flags utiles

```bash
./deploy.sh --skip-server      # Ne redéploie que le client + infra
./deploy.sh --skip-client      # Ne redéploie que le serveur + infra
./deploy.sh --skip-infra       # Saute APIs, Artifact Registry, Firestore, rules
./deploy.sh --dry-run          # Affiche les commandes, ne les exécute pas
./deploy.sh --tag v0.2.0       # Force un tag d'image (défaut : court SHA git)
```

## Seed des configurations de mini-jeux

⚠️ **Important** : le serveur lit `/games/{SceneKey}` pour chaque
mini-jeu (durée, type, win condition, reward). En production cette
collection existe déjà. Sur un nouveau projet GCP, il faut la créer.

`scripts/seed-firestore.mjs` est conçu pour l'émulateur, mais peut
cibler un Firestore réel en supprimant `FIRESTORE_EMULATOR_HOST` :

```bash
# Authentification application-default
gcloud auth application-default login

GCP_PROJECT_ID=mon-projet-gcp \
  node scripts/seed-firestore.mjs
```

Sinon, les seed à la main dans la console Firebase :

| Document `/games/{...}`   | Champs                                                                     |
| ------------------------- | -------------------------------------------------------------------------- |
| `GameFallingApples`       | `sceneKey: "GameFallingApples", duration: 30, type: 0, winCondition: 0, winnersNumber: 1, winReward: 1` |
| `GameSpaceVegetables`     | `sceneKey: "GameSpaceVegetables", duration: 30, type: 0, winCondition: 1, winnersNumber: 1, winReward: 1` |
| `GameStarWars`            | `sceneKey: "GameStarWars", duration: 30, type: 0, winCondition: 0, winnersNumber: 1, winReward: 1` |

## Images du carousel

Les aperçus de la page d'accueil sont servis depuis **Firebase Storage**
du projet GCP, **pas** depuis le repo. Pour un nouveau déploiement :

```bash
gcloud storage cp game_falling_apples.png gs://<PROJECT>.appspot.com/games/
gcloud storage cp game_space_vegetables.png gs://<PROJECT>.appspot.com/games/
```

## Vérification post-déploiement

```bash
# Cloud Run
curl -sI $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

# Hosting
curl -sI https://${FIREBASE_SITE}.web.app/

# Firestore
gcloud firestore databases describe --database='(default)' --project=$PROJECT_ID
```

## Rollback

Cloud Run garde l'historique des révisions. Pour revenir en arrière :

```bash
# Lister les révisions
gcloud run revisions list --service=$SERVICE_NAME --region=$REGION

# Diriger 100% du trafic vers la précédente
gcloud run services update-traffic $SERVICE_NAME \
  --region=$REGION \
  --to-revisions=<REVISION_NAME>=100
```

Hosting garde aussi un historique : Firebase Console > Hosting > Release
history > Rollback.
