#!/usr/bin/env node
/**
 * Seed l'émulateur Firestore (ou un projet réel) avec les documents de
 * configuration des mini-jeux. Le serveur Go lit /games/{SceneKey} au
 * démarrage de chaque mini-jeu (cf. server/models/game.go).
 *
 * Usage :
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8181 \
 *   GCP_PROJECT_ID=unlock-local \
 *     node scripts/seed-firestore.mjs
 *
 * Les valeurs sont des défauts raisonnables alignés sur l'i18n et la logique
 * serveur ; ajustez si l'environnement de production utilise d'autres réglages.
 */

const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8181'
const project = process.env.GCP_PROJECT_ID || 'unlock-local'
const base = `http://${host}/v1/projects/${project}/databases/(default)/documents`

// GameType: Solo=0, Duo=1, Team=2
// GameWinCondition: First=0, Timeout=1
const games = {
  GameFallingApples: {
    sceneKey: 'GameFallingApples',
    duration: 30,
    type: 0,             // Solo
    winCondition: 0,     // First
    winnersNumber: 1,
    winReward: 1,
  },
  GameSpaceVegetables: {
    sceneKey: 'GameSpaceVegetables',
    duration: 30,
    type: 0,
    winCondition: 1,     // Timeout
    winnersNumber: 1,
    winReward: 1,
  },
  GameStarWars: {
    sceneKey: 'GameStarWars',
    duration: 30,
    type: 0,
    winCondition: 0,
    winnersNumber: 1,
    winReward: 1,
  },
}

const toFirestoreValue = (v) => {
  if (typeof v === 'string') return { stringValue: v }
  if (typeof v === 'number' && Number.isInteger(v)) return { integerValue: String(v) }
  if (typeof v === 'number') return { doubleValue: v }
  if (typeof v === 'boolean') return { booleanValue: v }
  throw new Error('Unsupported type: ' + typeof v)
}

const toFields = (obj) => Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k, toFirestoreValue(v)])
)

for (const [id, doc] of Object.entries(games)) {
  const url = `${base}/games/${id}`
  const body = JSON.stringify({ fields: toFields(doc) })
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body,
  })
  if (!res.ok) {
    console.error(`✗ ${id}: ${res.status} ${await res.text()}`)
    process.exit(1)
  }
  console.log(`✓ /games/${id}`)
}

console.log(`\nSeed terminé sur ${host} (project=${project}).`)
