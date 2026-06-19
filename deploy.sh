#!/usr/bin/env bash
# deploy.sh — redéploiement complet de la stack cloud Unlock.
#
# Usage : copier .env.example en .env, le compléter, puis :
#   ./deploy.sh                # tout
#   ./deploy.sh --skip-server  # ne redéploie que le client
#   ./deploy.sh --skip-client  # ne redéploie que le serveur
#   ./deploy.sh --skip-infra   # saute APIs + Artifact Registry + Firestore + rules
#   ./deploy.sh --dry-run      # affiche les commandes sans les exécuter
#   ./deploy.sh --tag <sha>    # tag d'image (défaut : valeur de .env ou git short SHA)
#
# Le script est idempotent : il peut être relancé sans casser une stack déjà déployée.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# -----------------------------------------------------------------------------
# Parsing des options
# -----------------------------------------------------------------------------
SKIP_SERVER=false
SKIP_CLIENT=false
SKIP_INFRA=false
DRY_RUN=false
CLI_TAG=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-server) SKIP_SERVER=true ;;
        --skip-client) SKIP_CLIENT=true ;;
        --skip-infra)  SKIP_INFRA=true ;;
        --dry-run)     DRY_RUN=true ;;
        --tag)         CLI_TAG="$2"; shift ;;
        -h|--help)
            sed -n '2,15p' "$0"
            exit 0 ;;
        *) echo "Option inconnue : $1" >&2; exit 2 ;;
    esac
    shift
done

# -----------------------------------------------------------------------------
# Utilitaires
# -----------------------------------------------------------------------------
log()   { printf '\n\033[1;34m▶\033[0m %s\n' "$*"; }
ok()    { printf '  \033[1;32m✓\033[0m %s\n' "$*"; }
warn()  { printf '  \033[1;33m!\033[0m %s\n' "$*" >&2; }
fail()  { printf '  \033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

run() {
    if [[ "$DRY_RUN" == "true" ]]; then
        printf '  \033[2m$ %s\033[0m\n' "$*"
    else
        eval "$@"
    fi
}

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || fail "$1 requis (introuvable dans PATH)"
}

# -----------------------------------------------------------------------------
# 1. Prérequis
# -----------------------------------------------------------------------------
check_prereqs() {
    log "Vérification des prérequis"
    require_cmd gcloud
    require_cmd firebase
    require_cmd node
    require_cmd go
    require_cmd docker

    local node_major
    node_major=$(node -p 'process.versions.node.split(".")[0]')
    [[ "$node_major" -ge 20 ]] || fail "Node >= 20 requis (trouvé v$node_major)"

    local go_minor
    go_minor=$(go version | grep -oE 'go1\.[0-9]+' | cut -d. -f2)
    [[ "$go_minor" -ge 21 ]] || warn "Go 1.21+ recommandé (trouvé go1.$go_minor)"

    if ! gcloud auth print-access-token >/dev/null 2>&1; then
        fail "gcloud non authentifié — lance 'gcloud auth login'"
    fi
    ok "gcloud, firebase, node, go, docker OK"
}

# -----------------------------------------------------------------------------
# 2. Chargement du .env
# -----------------------------------------------------------------------------
load_env() {
    log "Chargement de .env"
    [[ -f .env ]] || fail ".env absent — copier .env.example et compléter"
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a

    : "${PROJECT_ID:?PROJECT_ID manquant dans .env}"
    : "${REGION:?REGION manquant}"
    : "${SERVICE_NAME:?SERVICE_NAME manquant}"
    : "${ARTIFACT_REPO:?ARTIFACT_REPO manquant}"
    : "${ALLOWED_ORIGINS:?ALLOWED_ORIGINS manquant}"

    IMAGE_TAG="${CLI_TAG:-${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo latest)}}"
    export IMAGE_TAG
    IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${SERVICE_NAME}:${IMAGE_TAG}"
    export IMAGE_URI

    : "${MIN_INSTANCES:=0}"
    : "${MAX_INSTANCES:=3}"
    : "${CLOUD_RUN_CONCURRENCY:=80}"
    : "${CLOUD_RUN_MEMORY:=256Mi}"
    : "${CLOUD_RUN_CPU:=1}"
    : "${CLOUD_RUN_TIMEOUT:=3600}"
    : "${FIREBASE_SITE:=$PROJECT_ID}"

    ok "PROJECT_ID=$PROJECT_ID REGION=$REGION SERVICE=$SERVICE_NAME TAG=$IMAGE_TAG"
}

# -----------------------------------------------------------------------------
# 3. Activation des APIs
# -----------------------------------------------------------------------------
enable_apis() {
    log "Activation des APIs GCP"
    run "gcloud services enable \
        run.googleapis.com \
        artifactregistry.googleapis.com \
        firestore.googleapis.com \
        firebase.googleapis.com \
        cloudbuild.googleapis.com \
        --project=$PROJECT_ID"
    ok "APIs activées"
}

# -----------------------------------------------------------------------------
# 4. Artifact Registry
# -----------------------------------------------------------------------------
ensure_artifact_repo() {
    log "Vérification du dépôt Artifact Registry"
    if gcloud artifacts repositories describe "$ARTIFACT_REPO" \
            --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
        ok "Dépôt $ARTIFACT_REPO déjà présent"
    else
        run "gcloud artifacts repositories create $ARTIFACT_REPO \
            --repository-format=docker \
            --location=$REGION \
            --description='Unlock Docker images' \
            --project=$PROJECT_ID"
        ok "Dépôt $ARTIFACT_REPO créé"
    fi
    run "gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet"
}

# -----------------------------------------------------------------------------
# 5. Firestore database
# -----------------------------------------------------------------------------
ensure_firestore() {
    log "Vérification de la base Firestore"
    if gcloud firestore databases describe \
            --database='(default)' --project="$PROJECT_ID" >/dev/null 2>&1; then
        ok "Base Firestore '(default)' déjà créée"
    else
        run "gcloud firestore databases create \
            --location=$REGION \
            --project=$PROJECT_ID"
        ok "Base Firestore créée en $REGION"
    fi
}

# -----------------------------------------------------------------------------
# 6. Rules + indexes Firestore
# -----------------------------------------------------------------------------
deploy_firestore_rules() {
    log "Déploiement des règles Firestore"
    run "firebase deploy --only firestore:rules,firestore:indexes --project $PROJECT_ID --non-interactive"
    ok "Rules + indexes déployés"
}

# -----------------------------------------------------------------------------
# 7. Build + push de l'image serveur
# -----------------------------------------------------------------------------
build_and_push_server() {
    log "Build & push de l'image serveur ($IMAGE_URI)"
    run "docker build -t $IMAGE_URI server/"
    run "docker push $IMAGE_URI"
    ok "Image poussée"
}

# -----------------------------------------------------------------------------
# 8. Déploiement Cloud Run
# -----------------------------------------------------------------------------
deploy_cloud_run() {
    log "Déploiement Cloud Run ($SERVICE_NAME)"
    run "gcloud run deploy $SERVICE_NAME \
        --image=$IMAGE_URI \
        --region=$REGION \
        --project=$PROJECT_ID \
        --platform=managed \
        --allow-unauthenticated \
        --session-affinity \
        --timeout=${CLOUD_RUN_TIMEOUT} \
        --concurrency=${CLOUD_RUN_CONCURRENCY} \
        --memory=${CLOUD_RUN_MEMORY} \
        --cpu=${CLOUD_RUN_CPU} \
        --min-instances=${MIN_INSTANCES} \
        --max-instances=${MAX_INSTANCES} \
        --set-env-vars=GCP_PROJECT_ID=${PROJECT_ID},ALLOWED_ORIGINS=${ALLOWED_ORIGINS} \
        --quiet"
    ok "Cloud Run déployé"
}

# -----------------------------------------------------------------------------
# 9. Récupération de l'URL Cloud Run + injection côté client
# -----------------------------------------------------------------------------
fetch_ws_url() {
    log "Récupération de l'URL Cloud Run"
    if [[ "$DRY_RUN" == "true" ]]; then
        CLOUD_RUN_URL="https://${SERVICE_NAME}-xxx-${REGION}.a.run.app"
    else
        CLOUD_RUN_URL=$(gcloud run services describe "$SERVICE_NAME" \
            --region="$REGION" --project="$PROJECT_ID" \
            --format='value(status.url)')
    fi
    [[ -n "$CLOUD_RUN_URL" ]] || fail "URL Cloud Run introuvable"
    WS_URL="wss://${CLOUD_RUN_URL#https://}"
    ok "WebSocket : $WS_URL"

    cat > client/.env.production <<EOF
VUE_APP_FIREBASE_API_KEY=${VUE_APP_FIREBASE_API_KEY:-}
VUE_APP_FIREBASE_AUTH_DOMAIN=${VUE_APP_FIREBASE_AUTH_DOMAIN:-}
VUE_APP_FIREBASE_PROJECT_ID=${VUE_APP_FIREBASE_PROJECT_ID:-$PROJECT_ID}
VUE_APP_FIREBASE_STORAGE_BUCKET=${VUE_APP_FIREBASE_STORAGE_BUCKET:-}
VUE_APP_FIREBASE_MESSAGING_SENDER_ID=${VUE_APP_FIREBASE_MESSAGING_SENDER_ID:-}
VUE_APP_FIREBASE_APP_ID=${VUE_APP_FIREBASE_APP_ID:-}
VUE_APP_WEBSOCKET_URL=${WS_URL}
EOF
    ok "client/.env.production écrit"
}

# -----------------------------------------------------------------------------
# 10. Build du client
# -----------------------------------------------------------------------------
build_client() {
    log "Build du client"
    run "cd client && npm ci && npm run build"
    ok "Client buildé dans client/dist"
}

# -----------------------------------------------------------------------------
# 11. Déploiement Firebase Hosting
# -----------------------------------------------------------------------------
deploy_hosting() {
    log "Déploiement Firebase Hosting"
    run "firebase deploy --only hosting --project $PROJECT_ID --non-interactive"
    ok "Hosting déployé"
}

# -----------------------------------------------------------------------------
# 12. Résumé
# -----------------------------------------------------------------------------
print_summary() {
    log "Résumé"
    echo "  Projet GCP    : $PROJECT_ID"
    echo "  Région        : $REGION"
    echo "  Image         : $IMAGE_URI"
    echo "  Cloud Run     : ${CLOUD_RUN_URL:-<skipped>}"
    echo "  WebSocket     : ${WS_URL:-<skipped>}"
    echo "  Hosting       : https://${FIREBASE_SITE}.web.app"
    echo "  Git SHA       : $(git rev-parse --short HEAD 2>/dev/null || echo n/a)"
}

# -----------------------------------------------------------------------------
# Orchestration
# -----------------------------------------------------------------------------
check_prereqs
load_env

if [[ "$SKIP_INFRA" != "true" ]]; then
    enable_apis
    ensure_artifact_repo
    ensure_firestore
    deploy_firestore_rules
fi

if [[ "$SKIP_SERVER" != "true" ]]; then
    build_and_push_server
    deploy_cloud_run
fi

fetch_ws_url

if [[ "$SKIP_CLIENT" != "true" ]]; then
    build_client
    deploy_hosting
fi

print_summary
