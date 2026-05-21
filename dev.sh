#!/usr/bin/env bash
# dev.sh — démarre la stack Unlock en local (émulateur Firestore + serveur Go + client Vite).
#
# Prérequis : node >= 20, go >= 1.21, java >= 17, firebase-tools (`npm i -g firebase-tools`).
#
# Usage :
#   ./dev.sh              # démarre tout, redirige les logs dans .dev/logs/, traque Ctrl+C
#   ./dev.sh --no-client  # uniquement émulateur + serveur (utile pour les smoke tests)
#
# Ouvrir ensuite :
#   http://127.0.0.1:3000        client Vite
#   http://127.0.0.1:4000        UI émulateur Firebase
#   ws://127.0.0.1:8080          serveur Go

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_DIR=".dev/logs"
mkdir -p "$LOG_DIR"

WITH_CLIENT=true
case "${1:-}" in
  --no-client) WITH_CLIENT=false ;;
  -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
esac

pids=()
cleanup() {
  echo; echo "Arrêt..."
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "→ Démarrage de l'émulateur Firestore (logs: $LOG_DIR/firestore.log)"
firebase emulators:start --only firestore --project=unlock-local \
  > "$LOG_DIR/firestore.log" 2>&1 &
pids+=($!)

echo "→ Attente de l'émulateur sur 127.0.0.1:8181..."
until curl -sf http://127.0.0.1:8181 -o /dev/null 2>/dev/null; do
  sleep 1
done
echo "  ✓ Émulateur prêt"

echo "→ Démarrage du serveur Go (logs: $LOG_DIR/server.log)"
(
  cd server
  PORT=8080 \
  GCP_PROJECT_ID=unlock-local \
  FIRESTORE_EMULATOR_HOST=127.0.0.1:8181 \
  ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 \
  go run . > "../$LOG_DIR/server.log" 2>&1
) &
pids+=($!)

echo "→ Attente du serveur sur :8080..."
until curl -sI --max-time 1 http://127.0.0.1:8080/ 2>/dev/null | grep -q "Bad Request"; do
  sleep 1
done
echo "  ✓ Serveur Go prêt"

if [[ "$WITH_CLIENT" == "true" ]]; then
  if [[ ! -f client/.env.local ]]; then
    cp client/.env.local.example client/.env.local
    echo "  i  client/.env.local créé depuis .env.local.example"
  fi

  echo "→ Démarrage du client Vite (logs: $LOG_DIR/client.log)"
  (
    cd client
    npm run dev -- --host 127.0.0.1 --port 3000 > "../$LOG_DIR/client.log" 2>&1
  ) &
  pids+=($!)

  echo "→ Attente du client sur :3000..."
  until curl -sf http://127.0.0.1:3000 -o /dev/null 2>/dev/null; do
    sleep 1
  done
  echo "  ✓ Client Vite prêt"
fi

cat <<EOF

╭──────────────────────────────────────────╮
│  Stack Unlock locale prête               │
╰──────────────────────────────────────────╯
  Client      → http://127.0.0.1:3000
  Serveur WS  → ws://127.0.0.1:8080
  Firestore   → 127.0.0.1:8181
  Emulator UI → http://127.0.0.1:4000

  Logs : $LOG_DIR/{firestore,server,client}.log
  Ctrl+C pour tout arrêter.
EOF

wait
